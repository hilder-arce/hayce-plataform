import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { OrganizationItem } from '../../../core/models/organization.models';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationsService } from '../../../core/services/organizations.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  template: `
    @if (!isSuperAdmin()) {
      <app-card>
        <div class="p-8 text-sm text-slate-600">
          Solo el superadmin puede administrar organizaciones.
        </div>
      </app-card>
    } @else {
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="space-y-2">
          <h1 class="font-body text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
            Organizaciones
          </h1>
          <p class="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Crea espacios de trabajo aislados y asigna el administrador principal de cada organizacion.
          </p>
        </div>

        <div class="hidden md:flex md:w-auto md:justify-end">
          <app-button variant="primary" icon="add" routerLink="/dashboard/organizations/new">
            Nueva organizacion
          </app-button>
        </div>
      </div>

      <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex w-full flex-col gap-3 md:max-w-3xl md:flex-row">
            <div class="w-full md:max-w-md">
              <app-input
                placeholder="Buscar por organizacion, slug o admin principal..."
                icon="search"
                [ngModel]="searchTerm()"
                (ngModelChange)="onSearch($event)"
              />
            </div>
          </div>

          <div class="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end">
            <div class="flex w-full items-center justify-between gap-3 md:w-auto md:justify-start">
              <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-2 focus:ring-blue-200"
                  [checked]="showInactive()"
                  (change)="toggleInactive()"
                />
                <span>Mostrar inactivas</span>
              </label>

              <div class="text-sm text-slate-500">
                <span class="font-semibold text-slate-900">{{ activeOrganizationsCount() }}</span>
                activas
                <span class="mx-2 text-slate-300">/</span>
                <span class="font-semibold text-slate-900">{{ organizations().length }}</span>
                totales
              </div>

              <div class="md:hidden">
                <app-button variant="primary" icon="add" size="sm" routerLink="/dashboard/organizations/new">
                  Nueva organizacion
                </app-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-card [noPadding]="true">
        <div class="overflow-x-auto">
          <table class="min-w-max w-full border-collapse text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th class="px-6 py-4">Organizacion</th>
                <th class="px-6 py-4">Admin principal</th>
                <th class="px-6 py-4">Creada por</th>
                <th class="px-6 py-4">Cobertura</th>
                <th class="px-6 py-4">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-200">
        @if (loading()) {
              <tr>
                <td colspan="6" class="px-6 py-14 text-center">
                  <div class="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <app-spinner size="lg" />
                    <p class="text-sm">Cargando organizaciones...</p>
                  </div>
                </td>
              </tr>
        } @else if (filteredOrganizations().length === 0) {
              <tr>
                <td colspan="6" class="px-6 py-16">
                  <div class="flex flex-col items-center justify-center gap-4 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <i class="icon text-3xl">apartment</i>
                    </div>
                    <div class="space-y-2">
                      <h3 class="font-body text-xl font-semibold tracking-tight text-slate-900">
                        No se encontraron organizaciones
                      </h3>
                      <p class="max-w-xl text-sm leading-6 text-slate-500">
                        Ajusta la busqueda o crea una nueva organizacion para iniciar su estructura.
                      </p>
                    </div>

                    <app-button variant="outline" routerLink="/dashboard/organizations/new">
                      Crear mi primera organizacion
                    </app-button>
                  </div>
                </td>
              </tr>
        } @else {
              @for (organization of paginatedOrganizations(); track organization._id) {
                <tr class="transition-colors hover:bg-slate-50/80">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <i class="icon">domain</i>
                      </div>

                      <div class="min-w-0">
                        <div class="truncate font-medium uppercase tracking-[0.08em] text-slate-900">
                          {{ organization.nombre }}
                        </div>
                        <div class="truncate text-xs text-slate-500">
                          {{ organization.slug }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    @if (organization.principalAdmin) {
                      <div class="space-y-1">
                        <div class="font-medium text-slate-900">
                          {{ organization.principalAdmin.nombre }}
                        </div>
                        <div class="text-xs text-slate-500">
                          Usuario principal configurado
                        </div>
                      </div>
                    } @else {
                      <div class="space-y-1">
                        <div class="font-medium text-amber-600">Pendiente de asignacion</div>
                        <div class="text-xs text-slate-500">
                          Crea el primer administrador para habilitar su gestion interna.
                        </div>
                      </div>
                    }
                  </td>

                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-slate-700">
                      {{ organization.createdBy?.nombre || 'Superadmin' }}
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-2">
                      <span class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                        <i class="icon text-sm text-slate-500">group</i>
                        {{ organization.userCount ?? 0 }} usuarios
                      </span>
                      <span class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                        <i class="icon text-sm text-slate-500">security</i>
                        {{ organization.roleCount ?? 0 }} roles
                      </span>
                    </div>
                  </td>

                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                      [class.bg-emerald-50]="organization.estado"
                      [class.text-emerald-700]="organization.estado"
                      [class.bg-red-50]="!organization.estado"
                      [class.text-red-700]="!organization.estado"
                    >
                      {{ organization.estado ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>

                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <app-button
                        variant="ghost"
                        size="sm"
                        icon="person_add"
                        (onClick)="goToCreatePrincipalAdmin(organization)"
                      >
                        {{ organization.principalAdmin ? 'Nuevo usuario' : 'Crear admin principal' }}
                      </app-button>

                      <app-button
                        variant="ghost"
                        size="sm"
                        icon="edit"
                        [routerLink]="['/dashboard/organizations/edit', organization._id]"
                      />

                      @if (organization.estado) {
                        <app-button
                          variant="ghost"
                          size="sm"
                          icon="block"
                          class="text-red-600 hover:bg-red-50 hover:text-red-700"
                          (onClick)="deleteOrganization(organization)"
                        />
                      } @else {
                        <app-button
                          variant="ghost"
                          size="sm"
                          icon="restore"
                          class="text-green-600 hover:bg-green-50 hover:text-green-700"
                          (onClick)="restoreOrganization(organization)"
                        />
                      }
                    </div>
                  </td>
                </tr>
              }
        }
            </tbody>
          </table>
        </div>

        <div footer class="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="text-sm text-slate-500">
            Mostrando
            <span class="font-semibold text-slate-900">{{ paginatedOrganizations().length }}</span>
            de
            <span class="font-semibold text-slate-900">{{ filteredOrganizations().length }}</span>
            organizaciones
          </div>

          <div class="flex items-center justify-between gap-3 sm:justify-end">
            <app-button
              variant="ghost"
              size="sm"
              [disabled]="currentPage() === 1"
              (onClick)="changePage(currentPage() - 1)"
            >
              Anterior
            </app-button>

            <div class="min-w-[4.5rem] text-center text-sm font-medium text-slate-700">
              {{ currentPage() }} / {{ totalPages() }}
            </div>

            <app-button
              variant="ghost"
              size="sm"
              [disabled]="currentPage() >= totalPages()"
              (onClick)="changePage(currentPage() + 1)"
            >
              Siguiente
            </app-button>
          </div>
        </div>
      </app-card>
    }
  `,
})
export class OrganizationsComponent {
  private readonly organizationsService = inject(OrganizationsService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly organizations = signal<OrganizationItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchTerm = signal('');
  protected readonly showInactive = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = 10;
  protected readonly isSuperAdmin = computed(
    () => !!this.authService.currentUser()?.esSuperAdmin,
  );

  protected readonly filteredOrganizations = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    return this.organizations().filter((organization) => {
      const matchesStatus = this.showInactive() || organization.estado;
      if (!matchesStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        organization.nombre.toLowerCase().includes(term) ||
        organization.slug.toLowerCase().includes(term) ||
        (organization.principalAdmin?.nombre?.toLowerCase() ?? '').includes(term)
      );
    });
  });

  protected readonly activeOrganizationsCount = computed(
    () => this.organizations().filter((organization) => organization.estado).length,
  );

  protected readonly totalPages = computed(
    () => Math.ceil(this.filteredOrganizations().length / this.pageSize) || 1,
  );

  protected readonly paginatedOrganizations = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredOrganizations().slice(start, start + this.pageSize);
  });

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  protected toggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.currentPage.set(1);
  }

  protected changePage(page: number): void {
    this.currentPage.set(page);
  }

  ngOnInit(): void {
    if (!this.isSuperAdmin()) {
      this.loading.set(false);
      return;
    }

    this.loadOrganizations();
  }

  protected deleteOrganization(organization: OrganizationItem): void {
    this.alertService.confirm(`¿Desactivar "${organization.nombre}"?`, () => {
      this.organizationsService.deleteOrganization(organization._id).subscribe({
        next: () => {
          this.alertService.show('Organizacion desactivada.', 'success');
          this.loadOrganizations();
        },
        error: () => this.alertService.show('No se pudo desactivar la organizacion.', 'error'),
      });
    });
  }

  protected restoreOrganization(organization: OrganizationItem): void {
    this.alertService.confirm(`¿Restaurar "${organization.nombre}"?`, () => {
      this.organizationsService.restoreOrganization(organization._id).subscribe({
        next: () => {
          this.alertService.show('Organizacion restaurada.', 'success');
          this.loadOrganizations();
        },
        error: () => this.alertService.show('No se pudo restaurar la organizacion.', 'error'),
      });
    });
  }

  protected goToCreatePrincipalAdmin(organization: OrganizationItem): void {
    void this.router.navigate(['/dashboard/users/new'], {
      queryParams: {
        organization: organization._id,
        presetRole: 'Administrador',
      },
    });
  }

  private loadOrganizations(): void {
    this.loading.set(true);
    forkJoin([
      this.organizationsService.getOrganizations(),
      this.organizationsService.getOrganizations(true),
    ])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([activeOrganizations, inactiveOrganizations]) =>
          this.organizations.set([...activeOrganizations, ...inactiveOrganizations]),
        error: () => this.alertService.show('No se pudieron cargar las organizaciones.', 'error'),
      });
  }
}
