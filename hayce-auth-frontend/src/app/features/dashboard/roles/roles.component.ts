import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { RolesService } from '../../../core/services/roles.service';
import { Role } from '../../../core/models/role.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-roles',
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
  templateUrl: './roles.component.html',
})
export class RolesComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly rolesService = inject(RolesService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  // ==========================================
  // [ ESTADO ] - SIGNALS LOCALES
  // ==========================================
  protected readonly roles = signal<Role[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly pendingId = signal<string | null>(null);

  // ==========================================
  // [ PERMISOS ] - CONTROL DE ACCESO
  // ==========================================
  protected readonly canCreate = this.authService.hasPermission('crear_rol');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_rol');
  protected readonly canDelete = this.authService.hasPermission('eliminar_rol');
  protected readonly canRestore = this.authService.hasPermission('eliminar_rol');

  // ==========================================
  // [ STREAM REACTIVO ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ DATOS DERIVADOS ] - FILTROS DE VISTA
  // ==========================================
  protected readonly filteredRoles = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.roles();
    }

    return this.roles().filter((role) => {
      const permissionsText = role.permisos.map((permission) => permission.nombre).join(' ').toLowerCase();
      return (
        role.nombre.toLowerCase().includes(term) ||
        (role.descripcion ?? '').toLowerCase().includes(term) ||
        permissionsText.includes(term)
      );
    });
  });

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  ngOnInit(): void {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.loading.set(true);
    this.rolesService
      .getRoles(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (roles) => this.roles.set(roles),
        error: () => this.alertService.show('No se pudieron cargar los roles.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.loadRoles();
  }

  protected confirmDelete(role: Role): void {
    this.alertService.confirm(`¿Deseas desactivar el rol "${role.nombre}"?`, () => {
      this.pendingId.set(role._id);
      this.rolesService
        .deleteRole(role._id)
        .pipe(finalize(() => this.pendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Rol desactivado correctamente.', 'success');
            this.loadRoles();
          },
          error: () => this.alertService.show('No se pudo desactivar el rol.', 'error'),
        });
    });
  }

  protected confirmRestore(role: Role): void {
    this.alertService.confirm(`¿Deseas restaurar el rol "${role.nombre}"?`, () => {
      this.pendingId.set(role._id);
      this.rolesService
        .restoreRole(role._id)
        .pipe(finalize(() => this.pendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Rol restaurado correctamente.', 'success');
            this.loadRoles();
          },
          error: () => this.alertService.show('No se pudo restaurar el rol.', 'error'),
        });
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
  protected getPermissionsPreview(role: Role): string {
    if (!role.permisos.length) {
      return 'Sin permisos asignados';
    }

    return role.permisos.slice(0, 3).map((permission) => permission.nombre).join(', ');
  }
}
