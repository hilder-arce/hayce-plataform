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
import { ModulesService } from '../../../../core/services/modules.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { AppModuleItem } from '../../../../core/models/module.models';
import {
  AppPermission,
  CreatePermissionPayload,
  UpdatePermissionPayload,
} from '../../../../core/models/permission.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type PermissionFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  modulo: FormControl<string>;
}>;

@Component({
  selector: 'app-permission-form',
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
  templateUrl: './permission-form.component.html',
})
export class PermissionFormComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly permissionsService = inject(PermissionsService);
  private readonly modulesService = inject(ModulesService);
  private readonly alertService = inject(AlertService);

  // ==========================================
  // [ ESTADO ] - FORMULARIO Y SIGNALS
  // ==========================================
  protected readonly loading = signal(true);
  protected readonly modulesLoading = signal(true);
  protected readonly isEditMode = signal(false);
  protected readonly modules = signal<AppModuleItem[]>([]);
  protected permissionId: string | null = null;

  protected readonly permissionForm: PermissionFormGroup = this.fb.nonNullable.group({
    // Nombre tecnico del permiso: requerido y minimo 3 caracteres
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    // Descripcion operativa: requerida y minimo 10 caracteres
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    // Relacion obligatoria con un modulo
    modulo: ['', [Validators.required]],
  });

  // ==========================================
  // [ PERMISOS ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ STREAM REACTIVO ] - CARGA INICIAL
  // ==========================================
  ngOnInit(): void {
    this.loadModules();

    this.route.paramMap
      .pipe(
        switchMap((params): Observable<AppPermission> => {
          this.permissionId = params.get('id');
          if (!this.permissionId) {
            this.loading.set(false);
            return EMPTY;
          }

          this.isEditMode.set(true);
          this.permissionForm.controls.modulo.disable();
          return this.permissionsService.getPermissionById(this.permissionId);
        }),
      )
      .subscribe({
        next: (permission) => {
          this.permissionForm.patchValue({
            nombre: permission.nombre,
            descripcion: permission.descripcion,
            modulo:
              typeof permission.modulo === 'string' ? permission.modulo : permission.modulo._id ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('No se pudo cargar el permiso solicitado.', 'error');
          void this.router.navigate(['/dashboard/permissions']);
        },
      });
  }

  private loadModules(): void {
    this.modulesService
      .getModules(false)
      .pipe(finalize(() => this.modulesLoading.set(false)))
      .subscribe({
        next: (modules) => this.modules.set(modules),
        error: () => this.alertService.show('No se pudieron cargar los modulos activos.', 'error'),
      });
  }

  // ==========================================
  // [ DATOS DERIVADOS ] - MENSAJES DE ERROR
  // ==========================================
  protected getFieldError(field: keyof PermissionFormGroup['controls']): string | null {
    const control = this.permissionForm.controls[field];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (field === 'nombre') {
      if (control.hasError('required')) {
        return 'El nombre tecnico es obligatorio.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 3 caracteres.';
      }
    }

    if (field === 'modulo') {
      if (control.hasError('required')) {
        return 'Debes seleccionar un modulo.';
      }
    }

    if (field === 'descripcion') {
      if (control.hasError('required')) {
        return 'La descripcion es obligatoria.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 10 caracteres.';
      }
    }

    return null;
  }

  // ==========================================
  // [ ACCIONES ] - ENVIO DEL FORMULARIO
  // ==========================================
  protected onSubmit(): void {
    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.permissionForm.getRawValue();
    const request: Observable<AppPermission> = this.isEditMode()
      ? this.permissionsService.updatePermission(this.permissionId!, payload as UpdatePermissionPayload)
      : this.permissionsService.createPermission(payload as CreatePermissionPayload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Permiso ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente.`,
          'success',
        );
        void this.router.navigate(['/dashboard/permissions']);
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error?.message ||
          `No se pudo ${this.isEditMode() ? 'actualizar' : 'crear'} el permiso.`;
        this.alertService.show(message, 'error');
      },
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
}
