import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizationsService } from '../../../../core/services/organizations.service';
import { OrganizationItem } from '../../../../core/models/organization.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type OrganizationFormGroup = FormGroup<{
  nombre: FormControl<string>;
  slug: FormControl<string>;
}>;

@Component({
  selector: 'app-organization-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  template: `
    @if (!isSuperAdmin()) {
      <app-card>
        <div class="p-6 text-sm text-slate-600">
          Solo el superadmin puede administrar organizaciones.
        </div>
      </app-card>
    } @else {
      <div class="mb-6 flex items-start gap-3">
        <a
          routerLink="/dashboard/organizations"
          class="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <i class="icon text-xl">arrow_back</i>
        </a>

        <div class="space-y-2">
          <h1 class="font-body text-3xl font-semibold tracking-tight text-slate-900">
            {{ isEditMode() ? 'Editar organización' : 'Nueva organización' }}
          </h1>
          <p class="text-sm text-slate-500">Configura la identidad base del tenant.</p>
        </div>
      </div>

      <app-card [noPadding]="true">
        @if (loading()) {
          <div class="flex min-h-48 items-center justify-center">
            <app-spinner size="lg" />
          </div>
        } @else {
          <form [formGroup]="organizationForm" (ngSubmit)="onSubmit()" class="space-y-0">
            <div class="grid gap-5 border-b border-slate-200 px-5 py-6 md:grid-cols-2">
              <app-input
                label="Nombre"
                icon="apartment"
                placeholder="Ej. HAYCE Norte"
                formControlName="nombre"
                [error]="getFieldError('nombre')"
              />

              <app-input
                label="Slug"
                icon="tag"
                placeholder="Ej. hayce-norte"
                formControlName="slug"
                [error]="getFieldError('slug')"
              />
            </div>

            <div class="flex w-full flex-col gap-3 sm:flex-row sm:justify-end md:w-auto px-5 py-5 sm:px-6 sm:py-6">
              <app-button type="submit" variant="primary" class="w-full sm:w-auto" [loading]="loading()">
                {{ isEditMode() ? 'Guardar cambios' : 'Crear organización' }}
              </app-button>
              <a
                routerLink="/dashboard/organizations"
                class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Cancelar
              </a>

            </div>
          </form>
        }
      </app-card>
    }
  `,
})
export class OrganizationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly organizationsService = inject(OrganizationsService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly isEditMode = signal(false);
  protected organizationId: string | null = null;
  protected readonly organizationForm: OrganizationFormGroup = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
  });

  protected readonly isSuperAdmin = signal(!!this.authService.currentUser()?.esSuperAdmin);

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      this.loading.set(false);
      return;
    }

    this.route.paramMap
      .pipe(
        switchMap((params): Observable<OrganizationItem> => {
          this.organizationId = params.get('id');
          if (!this.organizationId) {
            this.loading.set(false);
            return EMPTY;
          }

          this.isEditMode.set(true);
          return this.organizationsService.getOrganizationById(this.organizationId);
        }),
      )
      .subscribe({
        next: (organization) => {
          this.organizationForm.patchValue({
            nombre: organization.nombre,
            slug: organization.slug,
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('No se pudo cargar la organización.', 'error');
          void this.router.navigate(['/dashboard/organizations']);
        },
      });
  }

  protected onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.organizationForm.getRawValue();
    const request = this.isEditMode()
      ? this.organizationsService.updateOrganization(this.organizationId!, payload)
      : this.organizationsService.createOrganization(payload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          this.isEditMode() ? 'Organización actualizada.' : 'Organización creada.',
          'success',
        );
        void this.router.navigate(['/dashboard/organizations']);
      },
      error: () => this.alertService.show('No se pudo guardar la organización.', 'error'),
    });
  }

  protected getFieldError(field: keyof OrganizationFormGroup['controls']): string | null {
    const control = this.organizationForm.controls[field];
    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (field === 'slug' && control.hasError('pattern')) {
      return 'Usa solo letras minúsculas, números y guiones.';
    }

    return null;
  }
}
