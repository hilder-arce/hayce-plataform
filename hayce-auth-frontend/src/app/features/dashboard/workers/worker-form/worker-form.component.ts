import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { OrganizationItem } from '../../../../core/models/organization.models';
import { CreateWorkerPayload, UpdateWorkerPayload } from '../../../../core/models/worker.models';
import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizationsService } from '../../../../core/services/organizations.service';
import { WorkersService } from '../../../../core/services/workers.service';
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
  private readonly organizationsService = inject(OrganizationsService);
  private readonly authService = inject(AuthService);

  protected readonly form: FormGroup;
  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly workerId = signal<string | null>(null);
  protected readonly organizations = signal<OrganizationItem[]>([]);
  protected readonly isSuperAdmin = computed(
    () => !!this.authService.currentUser()?.esSuperAdmin,
  );

  constructor() {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      numero_telefono: ['', [Validators.pattern(/^[0-9+ ]*$/)]],
      correo: ['', [Validators.email]],
      organization: [''],
    });
  }

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.form.get('organization')?.addValidators([Validators.required]);
      this.organizationsService.getOrganizations().subscribe({
        next: (organizations) =>
          this.organizations.set(organizations.filter((item) => item.estado)),
        error: () =>
          this.alertService.show('No se pudieron cargar las organizaciones.', 'error'),
      });
    }

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
            organization: worker.organization?._id ?? '',
          });
        },
        error: () => {
          this.alertService.show('No se pudo cargar la informacion del trabajador.', 'error');
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
    const payload = Object.fromEntries(
      Object.entries(rawValue).map(([key, value]) => [key, value === '' ? null : value]),
    );

    const request = this.isEdit()
      ? this.workersService.updateWorker(
          this.workerId()!,
          payload as unknown as UpdateWorkerPayload,
        )
      : this.workersService.createWorker(payload as unknown as CreateWorkerPayload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Trabajador ${this.isEdit() ? 'actualizado' : 'creado'} correctamente.`,
          'success',
        );
        void this.router.navigate(['/dashboard/workers']);
      },
      error: (error: HttpErrorResponse) => {
        const message = error.error?.message || 'Ocurrio un error al procesar la solicitud.';
        this.alertService.show(message, 'error');
      },
    });
  }
}
