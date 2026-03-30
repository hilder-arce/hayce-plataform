import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../core/models/user.models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  // ==========================================
  // [ ESTADO ] - SIGNALS LOCALES
  // ==========================================
  readonly searchTerm = signal('');
  readonly organizationFilter = signal('');
  readonly currentPage = signal(1);
  readonly showInactive = signal(false);
  readonly limit = 10;
  private readonly refreshTrigger = signal(0);

  // ==========================================
  // [ PERMISOS ] - CONTROL DE ACCESO
  // ==========================================
  readonly canCreate = this.authService.hasPermission('crear_usuario');
  readonly canUpdate = this.authService.hasPermission('actualizar_usuario');
  readonly canDelete = this.authService.hasPermission('eliminar_usuario');
  readonly canRestore = this.authService.hasPermission('eliminar_usuario');
  protected readonly isSuperAdmin = computed(
    () => !!this.authService.currentUser()?.esSuperAdmin,
  );

  // ==========================================
  // [ STREAM REACTIVO ] - CONSULTA PRINCIPAL
  // ==========================================
  private readonly state$ = combineLatest({
    search: toObservable(this.searchTerm).pipe(debounceTime(300)),
    page: toObservable(this.currentPage),
    inactive: toObservable(this.showInactive),
    refresh: toObservable(this.refreshTrigger),
  }).pipe(
    switchMap(({ search, page, inactive }) =>
      this.usersService.getUsers(page, this.limit, search, inactive).pipe(
        map((response) => ({
          items: response.items,
          total: response.total,
          loading: false,
          error: null,
        })),
        catchError(() => {
          this.alertService.show('Error al cargar usuarios', 'error');
          return of({
            items: [],
            total: 0,
            loading: false,
            error: 'Failed to load',
          });
        }),
      ),
    ),
  );

  // ==========================================
  // [ DATOS DERIVADOS ] - ESTADO DE LA VISTA
  // ==========================================
  readonly usersResource = toSignal(this.state$, {
    initialValue: {
      items: [],
      total: 0,
      loading: true,
      error: null,
    },
  });

  readonly totalPages = computed(() => Math.ceil(this.usersResource().total / this.limit));
  readonly organizationOptions = computed(() => {
    const organizations = new Map<string, string>();

    this.usersResource().items.forEach((user) => {
      if (user.organization?._id) {
        organizations.set(user.organization._id, user.organization.nombre);
      }
    });

    return [...organizations.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const selectedOrganizationId = this.organizationFilter();

    return this.usersResource().items.filter((user) => {
      const organizationName = user.organization?.nombre?.toLowerCase() ?? '';
      const createdByName = user.createdBy?.nombre?.toLowerCase() ?? '';
      const matchesSearch =
        !term ||
        user.nombre.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        this.getRoleName(user).toLowerCase().includes(term) ||
        organizationName.includes(term) ||
        createdByName.includes(term);

      const matchesOrganization =
        !selectedOrganizationId || user.organization?._id === selectedOrganizationId;

      return matchesSearch && matchesOrganization;
    });
  });

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onOrganizationFilterChange(organizationId: string): void {
    this.organizationFilter.set(organizationId);
  }

  toggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.currentPage.set(1);
  }

  changePage(page: number): void {
    this.currentPage.set(page);
  }

  deleteUser(id: string): void {
    this.alertService.confirm('¿Desactivar este usuario?', () => {
      this.usersService.deleteUser(id).subscribe({
        next: () => {
          this.alertService.show('Usuario desactivado', 'success');
          this.forceRefresh();
        },
        error: () => {
          this.alertService.show('Error al desactivar', 'error');
        },
      });
    });
  }

  restoreUser(id: string): void {
    this.alertService.confirm('¿Restaurar este usuario?', () => {
      this.usersService.restoreUser(id).subscribe({
        next: () => {
          this.alertService.show('Usuario restaurado', 'success');
          this.forceRefresh();
        },
        error: () => {
          this.alertService.show('Error al restaurar', 'error');
        },
      });
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
  protected getRoleName(user: User): string {
    return typeof user.rol === 'string' ? user.rol : user.rol?.nombre;
  }

  protected getOrganizationName(user: User): string {
    return user.organization?.nombre ?? 'Sistema';
  }

  protected getCreatedByName(user: User): string {
    return user.createdBy?.nombre ?? 'Sistema';
  }

  private forceRefresh(): void {
    this.refreshTrigger.update((value) => value + 1);
  }
}
