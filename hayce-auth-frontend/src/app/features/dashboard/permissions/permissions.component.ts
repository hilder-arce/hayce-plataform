import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { AppPermission } from '../../../core/models/permission.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-permissions',
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
  templateUrl: './permissions.component.html',
})
export class PermissionsComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly permissionsService = inject(PermissionsService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  // ==========================================
  // [ ESTADO ] - SIGNALS DE UI
  // ==========================================
  protected readonly permissions = signal<AppPermission[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly pendingId = signal<string | null>(null);

  // ==========================================
  // [ PERMISOS ] - CAPACIDADES DISPONIBLES
  // ==========================================
  protected readonly canCreate = this.authService.hasPermission('crear_permiso');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_permisos');
  protected readonly canDelete = this.authService.hasPermission('eliminar_permiso');
  protected readonly canRestore = this.authService.hasPermission('eliminar_permiso');

  // ==========================================
  // [ STREAM REACTIVO ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ DATOS DERIVADOS ] - FILTRO DE PERMISOS
  // ==========================================
  protected readonly filteredPermissions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.permissions();
    }

    return this.permissions().filter((permission) => {
      const moduleName = this.getModuleName(permission).toLowerCase();
      return (
        permission.nombre.toLowerCase().includes(term) ||
        permission.descripcion.toLowerCase().includes(term) ||
        moduleName.includes(term)
      );
    });
  });

  ngOnInit(): void {
    this.loadPermissions();
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  protected loadPermissions(): void {
    this.loading.set(true);
    this.permissionsService
      .getPermissions(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (permissions) => this.permissions.set(permissions),
        error: () => this.alertService.show('No se pudieron cargar los permisos.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.loadPermissions();
  }

  protected confirmDelete(permission: AppPermission): void {
    this.alertService.confirm(`Deseas desactivar el permiso "${permission.nombre}"?`, () => {
      this.pendingId.set(permission._id);
      this.permissionsService
        .deletePermission(permission._id)
        .pipe(finalize(() => this.pendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Permiso desactivado correctamente.', 'success');
            this.loadPermissions();
          },
          error: () => this.alertService.show('No se pudo desactivar el permiso.', 'error'),
        });
    });
  }

  protected confirmRestore(permission: AppPermission): void {
    this.alertService.confirm(`Deseas restaurar el permiso "${permission.nombre}"?`, () => {
      this.pendingId.set(permission._id);
      this.permissionsService
        .restorePermission(permission._id)
        .pipe(finalize(() => this.pendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Permiso restaurado correctamente.', 'success');
            this.loadPermissions();
          },
          error: () => this.alertService.show('No se pudo restaurar el permiso.', 'error'),
        });
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
  protected getModuleName(permission: AppPermission): string {
    return typeof permission.modulo === 'string' ? permission.modulo : permission.modulo.nombre;
  }
}
