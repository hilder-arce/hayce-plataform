import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { ActivitiesService } from '../../../../core/services/activities.service';
import { StationsService } from '../../../../core/services/stations.service';
import { AppStationItem } from '../../../../core/models/station.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './activity-form.component.html',
})
export class ActivityFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly stationsService = inject(StationsService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form: FormGroup;
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly stations = signal<AppStationItem[]>([]);
  protected readonly activityId = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required]],
      estacion: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadStations();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.activityId.set(id);
      this.loadActivity(id);
    }
  }

  private loadStations(): void {
    this.stationsService.getStations().subscribe({
      next: (stations) => this.stations.set(stations),
      error: () => this.alertService.show('No se pudieron cargar las estaciones.', 'error'),
    });
  }

  private loadActivity(id: string): void {
    this.loading.set(true);
    this.activitiesService
      .getActivityById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (activity) => {
          this.form.patchValue({
            nombre: activity.nombre,
            descripcion: activity.descripcion,
            estacion: activity.estacion._id,
          });
        },
        error: () => {
          this.alertService.show('No se pudo cargar la información de la actividad.', 'error');
          void this.router.navigate(['/dashboard/activities']);
        },
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.value;

    const request = this.isEdit()
      ? this.activitiesService.updateActivity(this.activityId()!, payload)
      : this.activitiesService.createActivity(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Actividad ${this.isEdit() ? 'actualizada' : 'creada'} correctamente.`,
          'success'
        );
        void this.router.navigate(['/dashboard/activities']);
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message || 'Ocurrió un error al procesar la solicitud.';
        this.alertService.show(message, 'error');
      },
    });
  }
}
