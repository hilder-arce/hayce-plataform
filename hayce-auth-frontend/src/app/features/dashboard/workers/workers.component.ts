import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkersService } from '../../../core/services/workers.service';
import { AppWorkerItem } from '../../../core/models/worker.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-workers',
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
  templateUrl: './workers.component.html',
})
export class WorkersComponent implements OnInit {
  private readonly workersService = inject(WorkersService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  protected readonly workers = signal<AppWorkerItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly workerPendingId = signal<string | null>(null);

  protected readonly canCreate = this.authService.hasPermission('crear_trabajador');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_trabajador');
  protected readonly canDelete = this.authService.hasPermission('eliminar_trabajador');
  protected readonly canRestore = this.authService.hasPermission('eliminar_trabajador');

  protected readonly filteredWorkers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.workers();
    }

    return this.workers().filter(
      (item) =>
        item.nombres.toLowerCase().includes(term) ||
        item.apellidos.toLowerCase().includes(term) ||
        item.correo?.toLowerCase().includes(term) ||
        item.numero_telefono?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadWorkers();
  }

  protected loadWorkers(): void {
    this.loading.set(true);
    this.workersService
      .getWorkers(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (workers) => this.workers.set(workers),
        error: () => this.alertService.show('No se pudieron cargar los trabajadores.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.loadWorkers();
  }

  protected confirmDelete(worker: AppWorkerItem): void {
    this.alertService.confirm(`Deseas desactivar al trabajador "${worker.nombres} ${worker.apellidos}"?`, () => {
      this.workerPendingId.set(worker._id);
      this.workersService
        .deleteWorker(worker._id)
        .pipe(finalize(() => this.workerPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Trabajador desactivado correctamente.', 'success');
            this.loadWorkers();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo desactivar el trabajador.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  protected confirmRestore(worker: AppWorkerItem): void {
    this.alertService.confirm(`Deseas restaurar al trabajador "${worker.nombres} ${worker.apellidos}"?`, () => {
      this.workerPendingId.set(worker._id);
      this.workersService
        .restoreWorker(worker._id)
        .pipe(finalize(() => this.workerPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Trabajador restaurado correctamente.', 'success');
            this.loadWorkers();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo restaurar el trabajador.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }
}
