import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AppActivityItem } from '../../../../core/models/activity.models';
import { AppStationItem } from '../../../../core/models/station.models';
import {
  CreateTareoPayload,
  EstadoTareo,
  ESTADO_TAREO_LABELS,
  UpdateTareoPayload,
} from '../../../../core/models/tareo.models';
import { AppWorkerItem } from '../../../../core/models/worker.models';
import { ActivitiesService } from '../../../../core/services/activities.service';
import { AlertService } from '../../../../core/services/alert.service';
import { StationsService } from '../../../../core/services/stations.service';
import { TareosService } from '../../../../core/services/tareos.service';
import { WorkersService } from '../../../../core/services/workers.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../../shared/components/select/select.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-tareo-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SelectComponent,
    SpinnerComponent,
  ],
  templateUrl: './tareo-form.component.html',
})
export class TareoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tareosService = inject(TareosService);
  private readonly workersService = inject(WorkersService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly stationsService = inject(StationsService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form: FormGroup;
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly tareoId = signal<string | null>(null);
  protected readonly selectedStationId = signal('');
  protected readonly calculatedHours = signal('0.00');
  protected readonly timeRangeError = signal<string | null>(null);

  protected readonly workers = signal<AppWorkerItem[]>([]);
  protected readonly activities = signal<AppActivityItem[]>([]);
  protected readonly stations = signal<AppStationItem[]>([]);
  protected readonly estadoTareoOptions = Object.values(EstadoTareo);

  protected readonly workerOptions = computed<SelectOption[]>(() =>
    this.workers().map((worker) => ({
      value: worker._id,
      label: `${worker.nombres} ${worker.apellidos}`.trim(),
    })),
  );

  protected readonly stationOptions = computed<SelectOption[]>(() =>
    this.stations().map((station) => ({
      value: station._id,
      label: station.nombre,
    })),
  );

  protected readonly filteredActivities = computed(() => {
    const stationId = this.selectedStationId();
    if (!stationId) {
      return [];
    }

    return this.activities().filter((activity) => activity.estacion?._id === stationId);
  });

  protected readonly activityOptions = computed<SelectOption[]>(() =>
    this.filteredActivities().map((activity) => ({
      value: activity._id,
      label: activity.nombre,
    })),
  );

  protected readonly estadoTareoSelectOptions: SelectOption[] = this.estadoTareoOptions.map((estado) => ({
    value: estado,
    label: ESTADO_TAREO_LABELS[estado],
  }));

  constructor() {
    this.form = this.fb.group({
      trabajador: ['', [Validators.required]],
      estacion: ['', [Validators.required]],
      actividad: ['', [Validators.required]],
      numero_operacion: ['', [Validators.required, Validators.minLength(3)]],
      chasis: ['', [Validators.required, Validators.minLength(3)]],
      fecha: ['', [Validators.required]],
      hora_ini: ['', [Validators.required]],
      hora_fin: ['', []],
      observacion: ['', []],
      estado_tareo: [EstadoTareo.POR_INICIAR, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.setupFormReactions();
    this.loadDependencies();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.tareoId.set(id);
      this.loadTareo(id);
    }
  }

  private setupFormReactions(): void {
    this.form.get('estacion')?.valueChanges.subscribe((stationId) => {
      const normalizedStationId = typeof stationId === 'string' ? stationId : '';
      this.selectedStationId.set(normalizedStationId);

      const selectedActivityId = this.form.get('actividad')?.value;
      if (selectedActivityId && !this.filteredActivities().some((activity) => activity._id === selectedActivityId)) {
        this.form.patchValue({ actividad: '' }, { emitEvent: false });
      }
    });

    this.form.get('hora_ini')?.valueChanges.subscribe(() => this.updateCalculatedHours());
    this.form.get('hora_fin')?.valueChanges.subscribe(() => this.updateCalculatedHours());
  }

  private loadDependencies(): void {
    this.workersService.getWorkers().subscribe({
      next: (workers) => this.workers.set(workers),
      error: () => this.alertService.show('No se pudieron cargar los trabajadores.', 'error'),
    });

    this.stationsService.getStations().subscribe({
      next: (stations) => this.stations.set(stations),
      error: () => this.alertService.show('No se pudieron cargar las estaciones.', 'error'),
    });

    this.activitiesService.getActivities().subscribe({
      next: (activities) => this.activities.set(activities),
      error: () => this.alertService.show('No se pudieron cargar las actividades.', 'error'),
    });
  }

  private loadTareo(id: string): void {
    this.loading.set(true);
    this.tareosService
      .getTareoById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tareo) => {
          this.form.patchValue({
            trabajador: tareo.trabajador?._id,
            estacion: tareo.estacion_ref?._id || '',
            actividad: tareo.actividad?._id,
            numero_operacion: tareo.numero_operacion,
            chasis: tareo.chasis,
            fecha: new Date(tareo.fecha).toISOString().split('T')[0],
            hora_ini: new Date(tareo.hora_ini).toISOString().split('T')[1].slice(0, 5),
            hora_fin: tareo.hora_fin ? new Date(tareo.hora_fin).toISOString().split('T')[1].slice(0, 5) : '',
            observacion: tareo.observacion,
            estado_tareo: tareo.estado_tareo,
          });

          this.selectedStationId.set(tareo.estacion_ref?._id || '');
          this.updateCalculatedHours();
        },
        error: () => {
          this.alertService.show('No se pudo cargar la informacion del tareo.', 'error');
          void this.router.navigate(['/dashboard/tareos']);
        },
      });
  }

  private updateCalculatedHours(): void {
    const horaIni = this.form.get('hora_ini')?.value as string;
    const horaFin = this.form.get('hora_fin')?.value as string;

    if (!horaIni || !horaFin) {
      this.timeRangeError.set(null);
      this.calculatedHours.set('0.00');
      return;
    }

    if (horaIni > horaFin) {
      this.timeRangeError.set('La hora de inicio no puede ser mayor que la hora final.');
      this.calculatedHours.set('0.00');
      return;
    }

    const [iniHours, iniMinutes] = horaIni.split(':').map(Number);
    const [finHours, finMinutes] = horaFin.split(':').map(Number);
    const diffMinutes = finHours * 60 + finMinutes - (iniHours * 60 + iniMinutes);

    this.timeRangeError.set(null);

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    const formatted = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;

    this.calculatedHours.set(formatted);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.value;

    if (!this.isValidEstadoTareo(rawValue.estado_tareo)) {
      this.saving.set(false);
      this.alertService.show('Selecciona un estado de tareo valido antes de continuar.', 'error');
      return;
    }

    if (this.timeRangeError()) {
      this.saving.set(false);
      this.alertService.show(this.timeRangeError()!, 'error');
      return;
    }

    const selectedStation = this.stations().find((station) => station._id === rawValue.estacion);
    if (!selectedStation) {
      this.saving.set(false);
      this.alertService.show('Selecciona una estacion valida antes de continuar.', 'error');
      return;
    }

    const payload: CreateTareoPayload | UpdateTareoPayload = {
      ...rawValue,
      estacion: selectedStation.nombre,
      fecha: rawValue.fecha ? new Date(rawValue.fecha).toISOString() : undefined,
      hora_ini: rawValue.hora_ini ? new Date(`1970-01-01T${rawValue.hora_ini}:00Z`).toISOString() : undefined,
      hora_fin: rawValue.hora_fin ? new Date(`1970-01-01T${rawValue.hora_fin}:00Z`).toISOString() : undefined,
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        delete (payload as Record<string, unknown>)[key];
      }
    });

    const request = this.isEdit()
      ? this.tareosService.updateTareo(this.tareoId()!, payload as UpdateTareoPayload)
      : this.tareosService.createTareo(payload as CreateTareoPayload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.alertService.show(`Tareo ${this.isEdit() ? 'actualizado' : 'creado'} correctamente.`, 'success');
        void this.router.navigate(['/dashboard/tareos']);
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message || 'Ocurrio un error al procesar la solicitud.';
        this.alertService.show(message, 'error');
      },
    });
  }

  protected getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);

    if (!control || !control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('minlength')) {
      return `Debe tener al menos ${control.getError('minlength').requiredLength} caracteres.`;
    }

    return 'Valor invalido.';
  }

  protected getHoraFinError(): string | null {
    const fieldError = this.getFieldError('hora_fin');
    return fieldError || this.timeRangeError();
  }

  private isValidEstadoTareo(value: unknown): value is EstadoTareo {
    return Object.values(EstadoTareo).includes(value as EstadoTareo);
  }
}
