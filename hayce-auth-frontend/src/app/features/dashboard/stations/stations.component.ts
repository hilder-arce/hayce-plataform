import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { StationsService } from '../../../core/services/stations.service';
import { AppStationItem } from '../../../core/models/station.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-stations',
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
  templateUrl: './stations.component.html',
})
export class StationsComponent implements OnInit {
  private readonly stationsService = inject(StationsService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  protected readonly stations = signal<AppStationItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly stationPendingId = signal<string | null>(null);

  protected readonly canCreate = this.authService.hasPermission('crear_estacion');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_estacion');
  protected readonly canDelete = this.authService.hasPermission('eliminar_estacion');
  protected readonly canRestore = this.authService.hasPermission('eliminar_estacion');

  protected readonly filteredStations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.stations();
    }

    return this.stations().filter(
      (item) =>
        item.nombre.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.loadStations();
  }

  protected loadStations(): void {
    this.loading.set(true);
    this.stationsService
      .getStations(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (stations) => this.stations.set(stations),
        error: () => this.alertService.show('No se pudieron cargar las estaciones.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.loadStations();
  }

  protected confirmDelete(station: AppStationItem): void {
    this.alertService.confirm(`Deseas desactivar la estación "${station.nombre}"?`, () => {
      this.stationPendingId.set(station._id);
      this.stationsService
        .deleteStation(station._id)
        .pipe(finalize(() => this.stationPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Estación desactivada correctamente.', 'success');
            this.loadStations();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo desactivar la estación.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  protected confirmRestore(station: AppStationItem): void {
    this.alertService.confirm(`Deseas restaurar la estación "${station.nombre}"?`, () => {
      this.stationPendingId.set(station._id);
      this.stationsService
        .restoreStation(station._id)
        .pipe(finalize(() => this.stationPendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Estación restaurada correctamente.', 'success');
            this.loadStations();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo restaurar la estación.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }
}
