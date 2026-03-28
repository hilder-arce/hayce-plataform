import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { StationsService } from '../../../../core/services/stations.service';
import {
  AppStationItem,
  CreateStationPayload,
  UpdateStationPayload,
} from '../../../../core/models/station.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type StationFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
}>;

@Component({
  selector: 'app-station-form',
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
  templateUrl: './station-form.component.html',
})
export class StationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stationsService = inject(StationsService);
  private readonly alertService = inject(AlertService);

  protected readonly loading = signal(true);
  protected readonly isEditMode = signal(false);
  protected stationId: string | null = null;

  protected readonly stationForm: StationFormGroup = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params): Observable<AppStationItem> => {
          this.stationId = params.get('id');
          if (!this.stationId) {
            this.loading.set(false);
            return EMPTY;
          }

          this.isEditMode.set(true);
          return this.stationsService.getStationById(this.stationId);
        }),
      )
      .subscribe({
        next: (station) => {
          this.stationForm.patchValue({
            nombre: station.nombre,
            descripcion: station.descripcion,
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('No se pudo cargar la estación solicitada.', 'error');
          void this.router.navigate(['/dashboard/stations']);
        },
      });
  }

  protected getFieldError(field: keyof StationFormGroup['controls']): string | null {
    const control = this.stationForm.controls[field];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (field === 'nombre') {
      if (control.hasError('required')) {
        return 'El nombre de la estación es obligatorio.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 3 caracteres.';
      }
    }

    if (field === 'descripcion') {
      if (control.hasError('required')) {
        return 'La descripción es obligatoria.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 10 caracteres.';
      }
    }

    return null;
  }

  protected onSubmit(): void {
    if (this.stationForm.invalid) {
      this.stationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.stationForm.getRawValue();
    const request: Observable<AppStationItem> = this.isEditMode()
      ? this.stationsService.updateStation(this.stationId!, payload as UpdateStationPayload)
      : this.stationsService.createStation(payload as CreateStationPayload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Estación ${this.isEditMode() ? 'actualizada' : 'creada'} correctamente.`,
          'success',
        );
        void this.router.navigate(['/dashboard/stations']);
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error?.message || `No se pudo ${this.isEditMode() ? 'actualizar' : 'crear'} la estación.`;
        this.alertService.show(message, 'error');
      },
    });
  }
}
