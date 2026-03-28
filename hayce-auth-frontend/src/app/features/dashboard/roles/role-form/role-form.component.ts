import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { RolesService } from '../../../../core/services/roles.service';
import { AppPermission } from '../../../../core/models/permission.models';
import { CreateRolePayload, Role, UpdateRolePayload } from '../../../../core/models/role.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type RoleFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  permisos: FormControl<string[]>;
}>;

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly rolesService = inject(RolesService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly alertService = inject(AlertService);

  // ==========================================
  // [ ESTADO ] - FORMULARIO Y SIGNALS
  // ==========================================
  protected readonly loading = signal(true);
  protected readonly permissionsLoading = signal(true);
  protected readonly isEditMode = signal(false);
  protected readonly permissions = signal<AppPermission[]>([]);
  protected readonly permissionSearch = signal('');
  protected roleId: string | null = null;
  private originalPermissionIds = new Set<string>();

  protected readonly roleForm: RoleFormGroup = this.fb.nonNullable.group({
    // Identidad del rol: requerido y minimo 3 caracteres
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    // Descripcion operativa: requerido y minimo 10 caracteres
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    // Relacion con permisos: lista de ids seleccionados
    permisos: [[] as string[]],
  });

  // ==========================================
  // [ PERMISOS ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ STREAM REACTIVO ] - CARGA INICIAL
  // ==========================================
  ngOnInit(): void {
    this.loadPermissions();

    this.route.paramMap
      .pipe(
        switchMap((params): Observable<Role> => {
          this.roleId = params.get('id');
          if (!this.roleId) {
            this.loading.set(false);
            return EMPTY;
          }

          this.isEditMode.set(true);
          return this.rolesService.getRoleById(this.roleId);
        }),
      )
      .subscribe({
        next: (role) => {
          const permissionIds = role.permisos
            .map((permission) => permission._id)
            .filter((id): id is string => !!id);

          this.originalPermissionIds = new Set(permissionIds);
          this.roleForm.patchValue({
            nombre: role.nombre,
            descripcion: role.descripcion ?? '',
            permisos: permissionIds,
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('No se pudo cargar el rol solicitado.', 'error');
          void this.router.navigate(['/dashboard/roles']);
        },
      });
  }

  private loadPermissions(): void {
    this.permissionsService
      .getPermissions(false)
      .pipe(finalize(() => this.permissionsLoading.set(false)))
      .subscribe({
        next: (permissions) => this.permissions.set(permissions),
        error: () => this.alertService.show('No se pudieron cargar los permisos activos.', 'error'),
      });
  }

  // ==========================================
  // [ DATOS DERIVADOS ] - FILTROS Y MENSAJES
  // ==========================================
  protected readonly filteredPermissions = computed(() => {
    const term = this.permissionSearch().trim().toLowerCase();
    if (!term) {
      return this.permissions();
    }

    return this.permissions().filter((permission) => {
      const moduleName = typeof permission.modulo === 'string' ? permission.modulo : permission.modulo.nombre;
      return (
        permission.nombre.toLowerCase().includes(term) ||
        permission.descripcion.toLowerCase().includes(term) ||
        moduleName.toLowerCase().includes(term)
      );
    });
  });

  protected getFieldError(field: keyof RoleFormGroup['controls']): string | null {
    const control = this.roleForm.controls[field];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (field === 'nombre') {
      if (control.hasError('required')) {
        return 'El nombre del rol es obligatorio.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 3 caracteres.';
      }
    }

    if (field === 'descripcion') {
      if (control.hasError('required')) {
        return 'La descripcion del rol es obligatoria.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 10 caracteres.';
      }
    }

    return null;
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  protected onPermissionSearch(term: string): void {
    this.permissionSearch.set(term);
  }

  protected isPermissionSelected(permissionId: string): boolean {
    const selected = this.roleForm.controls.permisos.value ?? [];
    return selected.includes(permissionId);
  }

  protected togglePermission(permissionId: string): void {
    const selected = [...(this.roleForm.controls.permisos.value ?? [])];
    const index = selected.indexOf(permissionId);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(permissionId);
    }

    this.roleForm.controls.permisos.setValue(selected);
    this.roleForm.controls.permisos.markAsDirty();
  }

  protected onSubmit(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const selectedPermissions = this.roleForm.controls.permisos.value ?? [];
    const request = this.isEditMode()
      ? this.rolesService.updateRole(this.roleId!, this.buildUpdatePayload(selectedPermissions))
      : this.rolesService.createRole(this.buildCreatePayload(selectedPermissions));

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Rol ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente.`,
          'success',
        );
        void this.router.navigate(['/dashboard/roles']);
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error?.message || `No se pudo ${this.isEditMode() ? 'actualizar' : 'crear'} el rol.`;
        this.alertService.show(message, 'error');
      },
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
  protected getModuleName(permission: AppPermission): string {
    return typeof permission.modulo === 'string' ? permission.modulo : permission.modulo.nombre;
  }

  private buildCreatePayload(selectedPermissions: string[]): CreateRolePayload {
    return {
      nombre: this.roleForm.controls.nombre.value,
      descripcion: this.roleForm.controls.descripcion.value,
      permisos: selectedPermissions,
    };
  }

  private buildUpdatePayload(selectedPermissions: string[]): UpdateRolePayload {
    const added = selectedPermissions.filter((id) => !this.originalPermissionIds.has(id));
    const removed = [...this.originalPermissionIds].filter((id) => !selectedPermissions.includes(id));

    return {
      nombre: this.roleForm.controls.nombre.value,
      descripcion: this.roleForm.controls.descripcion.value,
      permisos: added,
      permisosEliminar: removed,
    };
  }
}
