import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { TareosService } from '../../../core/services/tareos.service';
import { AppTareoItem, EstadoTareo, ESTADO_TAREO_LABELS } from '../../../core/models/tareo.models';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-tareos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './tareos.component.html',
})
export class TareosComponent implements OnInit {
  private readonly tareosService = inject(TareosService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  protected readonly tareos = signal<AppTareoItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly tareoPendingId = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;

  protected readonly canCreate = this.authService.hasPermission('crear_tareo');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_tareo');
  protected readonly canDelete = this.authService.hasPermission('eliminar_tareo');
  protected readonly canRestore = this.authService.hasPermission('eliminar_tareo');
  protected readonly currentUser = this.authService.currentUser;

  protected readonly isSuperAdmin = computed(
    () => !!this.authService.currentUser()?.esSuperAdmin,
  );


  protected formatHoursToTime(hours: number): string {
    if (!hours) return '00:00';

    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  protected readonly filteredTareos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.tareos();
    }

    return this.tareos().filter(
      (item) =>
        item.numero_operacion.toLowerCase().includes(term) ||
        item.chasis.toLowerCase().includes(term) ||
        item.estacion.toLowerCase().includes(term) ||
        item.organization?.nombre?.toLowerCase().includes(term) ||
        item.creado_por?.nombre?.toLowerCase().includes(term) ||
        item.trabajador.nombres?.toLowerCase().includes(term) ||
        item.trabajador.apellidos?.toLowerCase().includes(term) ||
        item.actividad.nombre?.toLowerCase().includes(term) ||
        item.estacion_ref?.nombre?.toLowerCase().includes(term)
    );
  });

  protected readonly totalPages = computed(
    () => Math.ceil(this.filteredTareos().length / this.pageSize) || 1,
  );

  protected readonly paginatedTareos = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTareos().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.loadTareos();
  }

  protected loadTareos(): void {
    this.loading.set(true);
    this.tareosService
      .getTareos() // Note: No filter for inactive yet, assuming default is active only
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tareos) => this.tareos.set(tareos),
        error: () => this.alertService.show('No se pudieron cargar los tareos.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.currentPage.set(1);
    // Currently, getTareos doesn't accept 'includeInactive'.
    // If implemented, would call: this.tareosService.getTareos(this.showInactive())...
    // For now, it just changes the flag but doesn't refetch.
    // To implement inactive loading, adjust getTareos in service and uncomment.
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
  }

  protected getEstadoTareoBadgeVariant(estado: EstadoTareo): BadgeVariant {
    switch (estado) {
      case EstadoTareo.FINALIZADO: return 'success';
      case EstadoTareo.EN_DESARROLLO: return 'info';
      case EstadoTareo.POR_INICIAR: return 'warning';
      default: return 'default';
    }
  }

  protected getEstadoTareoLabel(estado: EstadoTareo): string {
    return ESTADO_TAREO_LABELS[estado] ?? estado;
  }

  protected confirmDelete(tareo: AppTareoItem): void {
    this.alertService.confirm(`Deseas desactivar el tareo con N° ${tareo.numero_operacion}?`, () => {
      this.tareoPendingId.set(tareo._id);
      this.tareosService
        .deleteTareo(tareo._id)
        .pipe(finalize(() => this.tareoPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Tareo desactivado correctamente.', 'success');
            this.loadTareos();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo desactivar el tareo.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  protected confirmRestore(tareo: AppTareoItem): void {
    this.alertService.confirm(`Deseas restaurar el tareo con N° ${tareo.numero_operacion}?`, () => {
      this.tareoPendingId.set(tareo._id);
      this.tareosService
        .restoreTareo(tareo._id)
        .pipe(finalize(() => this.tareoPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Tareo restaurado correctamente.', 'success');
            this.loadTareos();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo restaurar el tareo.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  

  async generarPDFTareos(
    listaTareos: any[],
    accion: 'download' | 'print' = 'download'
  ): Promise<void> {

    if (this.loading()) {
      this.alertService.show(
        'Espera a que los tareos terminen de cargar',
        'info',
      );
      return;
    }

    try {
      const doc = new jsPDF('l', 'mm', 'a4');

      /* ================= CONFIGURACIÓN DE PÁGINA ================= */
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginleft = 8;
      const marginRight = 8;
      const topMargin = 12;
      const bottomMargin = 12;
      const usableWidth = pageWidth - marginleft - marginRight;

      let yPosition = topMargin;
      const rowHeight = 6;
      const headerHeight = 7;

      /* ================= FUNCIONES AUXILIARES ================= */
      const normalizeWidths = (widths: number[]) => {
        const total = widths.reduce((a, b) => a + b, 0);
        const factor = usableWidth / total;
        return widths.map(w => w * factor);
      };

      const needsNewPage = (extraHeight = rowHeight) => {
        return yPosition + extraHeight > pageHeight - bottomMargin;
      };

      const formatFecha = (fecha: string | null | undefined): string => {
        if (!fecha) return '—';

        const date = new Date(fecha);

        return date.toLocaleDateString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };

      const formatHora = (hora: string | null | undefined): string => {
        if (!hora) return '—';

        const date = new Date(hora);

        return date.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      };

      /* ================= ENCABEZADO DE PÁGINA ================= */
      const printPageHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);

        doc.text(
          'REPORTE GENERAL DE TAREOS Y ASISTENCIAS',
          pageWidth / 2,
          yPosition,
          { align: 'center' }
        );

        yPosition += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const fechaGen = new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

        doc.text(`Fecha de Emisión: ${fechaGen}`, marginleft, yPosition += 5);

        doc.text(`Responsable: ${this.currentUser()?.nombre}`, marginleft, yPosition += 5);

        yPosition += 8;
      };

      /* ================= CONFIGURACIÓN DE TABLA ================= */
      const headers = [
        'FECHA',
        'N° OP',
        'CHASIS',
        'ESTACIÓN',
        'TRABAJADOR',
        'ACTIVIDAD',
        'HRA. INI',
        'HRA. FIN',
        'HORAS',
        'ESTADO',
        'OBSERVACIÓN'
      ];

      const baseWidths = [22, 20, 24, 28, 40, 38, 18, 18, 15, 22, 35];
      const colWidths = normalizeWidths(baseWidths);

      const headerColor: [number, number, number] = [33, 150, 243];
      const altRowColor: [number, number, number] = [245, 247, 250];

      /* ================= HEADER DE TABLA ================= */
      const drawTableHeader = () => {
        let xPos = marginleft;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);

        headers.forEach((header, index) => {
          doc.setFillColor(...headerColor);

          doc.setDrawColor(...headerColor);
          doc.setLineWidth(0);
          doc.rect(xPos, yPosition, colWidths[index], headerHeight, 'F');

          doc.text(header, xPos + 1.5, yPosition + 4.5);

          xPos += colWidths[index];
        });

        yPosition += headerHeight;
        doc.setTextColor(0, 0, 0);
      };

      /* ================= INICIO DEL PDF ================= */
      printPageHeader();
      drawTableHeader();

      /* ================= FILAS DE DATOS ================= */
      listaTareos.forEach((tareo, index) => {
        if (needsNewPage(rowHeight)) {
          doc.addPage();
          yPosition = topMargin;

          printPageHeader();
          drawTableHeader();
        }

        let xPos = marginleft;

        if (index % 2 !== 0) {
          doc.setFillColor(...altRowColor);
          doc.rect(marginleft, yPosition, usableWidth, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);

        const trabajadorNombre = [
          tareo?.trabajador?.nombres,
          tareo?.trabajador?.apellidos
        ]
          .filter(Boolean)
          .join(' ');

        const rowData = [
          formatFecha(tareo?.fecha),
          tareo?.numero_operacion || '—',
          tareo?.chasis || '—',
          tareo?.estacion || tareo?.estacion_ref?.nombre || '—',
          trabajadorNombre || '—',
          tareo?.actividad?.nombre || '—',
          tareo?.hora_ini
            ? new Date(tareo.hora_ini).toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : '—',

          tareo?.hora_fin
            ? new Date(tareo.hora_fin).toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : '—',
          tareo?.horas
            ? `${Math.floor(tareo.horas)}h ${Math.round((tareo.horas % 1) * 60)}m`
            : '0h 0m',
          tareo?.estado_tareo || '—',
          tareo?.observacion || '—'
        ];

        rowData.forEach((cell, index) => {
          const cellText = String(cell ?? '—');

          const text =
            cellText.length > 25
              ? cellText.substring(0, 22) + '...'
              : cellText;

          if (index % 2 !== 0) {
            doc.setFillColor(...altRowColor);
          }

          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0);

          doc.rect(xPos, yPosition, colWidths[index], rowHeight,
            index % 2 !== 0 ? 'F' : undefined
          );

          doc.text(text, xPos + 1.5, yPosition + 4);

          xPos += colWidths[index];
        });

        yPosition += rowHeight;
      });

      /* ================= FINALIZACIÓN ================= */
      const fileName = `Reporte-tareos-${new Date().getTime()}.pdf`;
      const isMobile = window.innerWidth < 768;

      if (accion === 'download') {
        doc.save(fileName);

        this.alertService.show(
          'PDF descargado exitosamente',
          'success'
        );
      } else {
        if (isMobile) {
          this.alertService.show(
              'Preparando impresión...',
              'info'
            );
          doc.autoPrint();

          const pdfBlob = doc.output('blob');
          const blobUrl = URL.createObjectURL(pdfBlob);

          const printWindow = window.open(blobUrl, '_blank');

          setTimeout(() => {
            printWindow?.print();
          }, 1500);
        } else {
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          iframe.style.visibility = 'hidden';
          
          iframe.src = pdfUrl;
          
          document.body.appendChild(iframe);
          
          iframe.onload = () => {
            this.alertService.show(
              'Preparando impresión...',
              'info'
            );
            
            setTimeout(() => {
              iframe.contentWindow?.focus();
              
              // Esperar un poco más para asegurar que el PDF cargó completamente
              setTimeout(() => {
                iframe.contentWindow?.print();
                
                this.alertService.show(
                  'Abriendo diálogo de impresión...',
                  'success'
                );
                
                setTimeout(() => {
                  document.body.removeChild(iframe);
                  URL.revokeObjectURL(pdfUrl);
                }, 2000);
              }, 1200);
              
            }, 800);
            
          };
        }
      }

    } catch (error) {
      console.error('Error generando PDF:', error);

      this.alertService.show(
        'Ocurrió un error al generar el PDF',
        'error'
      );
    }
  }

  //IMPORTAR A CSV
  async exportarExcelTareos(listaTareos: any[]): Promise<void> {
    if (this.loading()) {
      this.alertService.show(
        'Espera a que los tareos terminen de cargar',
        'info',
      );
      return;
    }
    try {
      const data = listaTareos.map((tareo) => ({
        FECHA: tareo.fecha
          ? new Date(tareo.fecha).toLocaleDateString('es-PE')
          : '—',

        'N° OP': tareo.numero_operacion || '—',

        CHASIS: tareo.chasis || '—',

        ESTACION: tareo.estacion_ref?.nombre || tareo.estacion || '—',

        TRABAJADOR: tareo.trabajador
          ? `${tareo.trabajador.nombres || ''} ${tareo.trabajador.apellidos || ''}`.trim()
          : '—',

        ACTIVIDAD: tareo.actividad?.nombre || '—',

        'HORA INICIO': tareo.hora_ini
          ? new Date(tareo.hora_ini).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : '—',

        'HORA FIN': tareo.hora_fin
          ? new Date(tareo.hora_fin).toLocaleTimeString('es-PE', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : '—',

        HORAS: tareo.horas
          ? `${Math.floor(tareo.horas)}h ${Math.round((tareo.horas % 1) * 60)}m`
          : '0h 0m',

        ESTADO: tareo.estado_tareo || '—',

        OBSERVACIONES: tareo.observacion || '—'
      }));

      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([], {
        skipHeader: true
      });

      XLSX.utils.sheet_add_aoa(worksheet, [
        ['REPORTE GENERAL DE TAREOS Y ASISTENCIAS']
      ], { origin: 'A1' });

      XLSX.utils.sheet_add_aoa(worksheet, [
        [`Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')}`],
        [`Responsable: ${this.currentUser()?.nombre || '—'}`],
        []
      ], { origin: 'A3' });

      const headers = [[
        'FECHA',
        'N° OP',
        'CHASIS',
        'ESTACION',
        'TRABAJADOR',
        'ACTIVIDAD',
        'HORA INICIO',
        'HORA FIN',
        'HORAS',
        'ESTADO',
        'OBSERVACIONES'
      ]];

      XLSX.utils.sheet_add_aoa(worksheet, headers, { origin: 'A6' });

      XLSX.utils.sheet_add_json(worksheet, data, {
        origin: 'A7',
        skipHeader: true
      });

      worksheet['!merges'] = [
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 10 }
        }
      ];

      worksheet['A1'].s = {
        font: {
          bold: true,
          sz: 16,
          color: { rgb: '1F2937' }
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };

      worksheet['A3'].s = {
        font: {
          bold: true
        }
      };

      worksheet['A4'].s = {
        font: {
          bold: true
        }
      };

      for (let col = 0; col <= 10; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {
            bold: true,
            color: { rgb: 'FFFFFF' }
          },
          fill: {
            fgColor: { rgb: '2196F3' }
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center'
          }
        };
      }

      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 22 },
        { wch: 30 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 35 }
      ];

      const workbook: XLSX.WorkBook = {
        Sheets: {
          Tareos: worksheet
        },
        SheetNames: ['Tareos']
      };

      const fileName = `Reporte-tareo-${new Date().getTime()}.xlsx`;

      XLSX.writeFile(workbook, fileName, {
        cellStyles: true
      });

      this.alertService.show(
        `Excel exportado exitosamente.`,
        'success'
      );

    } catch (error) {
      console.error('Error exportando Excel:', error);

      this.alertService.show(
        'Ocurrió un error al exportar el Excel',
        'error'
      );
    }
  }
}
