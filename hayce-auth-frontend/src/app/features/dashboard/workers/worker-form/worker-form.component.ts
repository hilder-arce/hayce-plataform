import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { WorkersService } from '../../../../core/services/workers.service';
import { CreateWorkerPayload, UpdateWorkerPayload } from '../../../../core/models/worker.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-worker-form',
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
  templateUrl: './worker-form.component.html',
})
export class WorkerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly workersService = inject(WorkersService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form: FormGroup;
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly workerId = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      numero_telefono: ['', [Validators.pattern(/^[0-9+ ]*$/)]],
      correo: ['', [Validators.email]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.workerId.set(id);
      this.loadWorker(id);
    }
  }

  private loadWorker(id: string): void {
    this.loading.set(true);
    this.workersService
      .getWorkerById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (worker) => {
          this.form.patchValue({
            nombres: worker.nombres,
            apellidos: worker.apellidos,
            numero_telefono: worker.numero_telefono,
            correo: worker.correo,
          });
        },
        error: () => {
          this.alertService.show('No se pudo cargar la información del trabajador.', 'error');
          void this.router.navigate(['/dashboard/workers']);
        },
      });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.value;
    
    // Limpiar valores vacíos para que no fallen las validaciones del servidor
    const payload = Object.fromEntries(
      Object.entries(rawValue).map(([key, value]) => [key, value === '' ? null : value])
    );

    const request = this.isEdit()
      ? this.workersService.updateWorker(this.workerId()!, payload as unknown as UpdateWorkerPayload)
      : this.workersService.createWorker(payload as unknown as CreateWorkerPayload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Trabajador ${this.isEdit() ? 'actualizado' : 'creado'} correctamente.`,
          'success'
        );
        void this.router.navigate(['/dashboard/workers']);
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message || 'Ocurrió un error al procesar la solicitud.';
        this.alertService.show(message, 'error');
      },
    });
  }
}
