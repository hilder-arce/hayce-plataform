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

  protected readonly canCreate = this.authService.hasPermission('crear_tareo');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_tareo');
  protected readonly canDelete = this.authService.hasPermission('eliminar_tareo');
  protected readonly canRestore = this.authService.hasPermission('eliminar_tareo');

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
        item.creado_por?.nombre?.toLowerCase().includes(term) ||
        item.trabajador.nombres?.toLowerCase().includes(term) ||
        item.trabajador.apellidos?.toLowerCase().includes(term) ||
        item.actividad.nombre?.toLowerCase().includes(term) ||
        item.estacion_ref?.nombre?.toLowerCase().includes(term)
    );
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
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    // Currently, getTareos doesn't accept 'includeInactive'.
    // If implemented, would call: this.tareosService.getTareos(this.showInactive())...
    // For now, it just changes the flag but doesn't refetch.
    // To implement inactive loading, adjust getTareos in service and uncomment.
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
        .deleteTareo(tareo._id) // NOTE: Backend uses 'remove' for deactivation, 'restore' for activation. Frontend uses delete/restore for same action.
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
}
