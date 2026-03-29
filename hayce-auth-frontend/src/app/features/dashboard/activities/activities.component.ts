import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivitiesService } from '../../../core/services/activities.service';
import { AppActivityItem } from '../../../core/models/activity.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-activities',
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
  templateUrl: './activities.component.html',
})
export class ActivitiesComponent implements OnInit {
  private readonly activitiesService = inject(ActivitiesService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  protected readonly activities = signal<AppActivityItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly activityPendingId = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;

  protected readonly canCreate = this.authService.hasPermission('crear_actividad');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_actividad');
  protected readonly canDelete = this.authService.hasPermission('eliminar_actividad');
  protected readonly canRestore = this.authService.hasPermission('eliminar_actividad');
  protected readonly isSuperAdmin = computed(
    () => !!this.authService.currentUser()?.esSuperAdmin,
  );

  protected readonly filteredActivities = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.activities();
    }

    return this.activities().filter(
      (item) =>
        item.nombre.toLowerCase().includes(term) || 
        item.descripcion.toLowerCase().includes(term) ||
        item.estacion.nombre?.toLowerCase().includes(term) ||
        item.organization?.nombre?.toLowerCase().includes(term) ||
        item.createdBy?.nombre?.toLowerCase().includes(term)
    );
  });

  protected readonly totalPages = computed(
    () => Math.ceil(this.filteredActivities().length / this.pageSize) || 1,
  );

  protected readonly paginatedActivities = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredActivities().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.loadActivities();
  }

  protected loadActivities(): void {
    this.loading.set(true);
    this.activitiesService
      .getActivities(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activities) => this.activities.set(activities),
        error: () => this.alertService.show('No se pudieron cargar las actividades.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.currentPage.set(1);
    this.loadActivities();
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
  }

  protected confirmDelete(activity: AppActivityItem): void {
    this.alertService.confirm(`Deseas desactivar la actividad "${activity.nombre}"?`, () => {
      this.activityPendingId.set(activity._id);
      this.activitiesService
        .deleteActivity(activity._id)
        .pipe(finalize(() => this.activityPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Actividad desactivada correctamente.', 'success');
            this.loadActivities();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo desactivar la actividad.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  protected confirmRestore(activity: AppActivityItem): void {
    this.alertService.confirm(`Deseas restaurar la actividad "${activity.nombre}"?`, () => {
      this.activityPendingId.set(activity._id);
      this.activitiesService
        .restoreActivity(activity._id)
        .pipe(finalize(() => this.activityPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Actividad restaurada correctamente.', 'success');
            this.loadActivities();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo restaurar la actividad.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }
}
