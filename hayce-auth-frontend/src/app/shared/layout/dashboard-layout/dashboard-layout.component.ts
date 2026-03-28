import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { HayceLogoComponent } from '../../components/hayce-logo/hayce-logo.component';

interface DashboardNavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  permissions?: string[];
}

const NAV_METADATA: Record<string, { label: string; icon: string; exact?: boolean }> = {
  '': { label: 'Inicio', icon: 'home', exact: true },
  notifications: { label: 'Notificaciones', icon: 'notifications' },
  account: { label: 'Mi cuenta', icon: 'person' },
  settings: { label: 'Configuración', icon: 'settings' },
  help: { label: 'Ayuda', icon: 'help' },
  users: { label: 'Usuarios', icon: 'group' },
  modules: { label: 'Módulos', icon: 'view_module' },
  permissions: { label: 'Permisos', icon: 'vpn_key' },
  roles: { label: 'Roles', icon: 'admin_panel_settings' },
  stations: { label: 'Estaciones', icon: 'location_on' },
  activities: { label: 'Actividades', icon: 'assignment' },
};

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, HayceLogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ LAYOUT ] - ESTRUCTURA PRINCIPAL DEL DASHBOARD  -->
    <!-- ================================================ -->
    <div class="relative min-h-screen bg-slate-50 text-slate-900">
      @if (sidebarOpen() && !isDesktopViewport()) {
        <button
          type="button"
          class="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
          (click)="closeSidebar()"
          aria-label="Cerrar menú lateral"
        ></button>
      }

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-slate-200 bg-white shadow-sm transition-transform duration-200 lg:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen() && !isDesktopViewport()"
      >
        <!-- ================================================ -->
        <!-- [ SIDEBAR ] - MARCA Y NAVEGACION                 -->
        <!-- ================================================ -->
        <div class="flex h-[4.5rem] items-center border-b border-slate-200 px-5">
          <a
            routerLink="/dashboard"
            class="flex items-center gap-3"
            (click)="closeSidebar()"
          >
            <app-hayce-logo />
          </a>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-5">
          <div class="space-y-1">
            @for (item of navItems(); track item.path) {
              <a
                [routerLink]="item.path"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                (click)="closeSidebar()"
              >
                <i class="icon text-lg">{{ item.icon }}</i>
                <span>{{ item.label }}</span>
              </a>
            }
          </div>
        </nav>

        <!-- ================================================ -->
        <!-- [ PERFIL ] - RESUMEN DEL USUARIO ACTIVO          -->
        <!-- ================================================ -->
        <div class="border-t border-slate-200 p-4">
          <div class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <app-avatar
              size="md"
              [initials]="userInitials()"
              [alt]="currentUser()?.nombre || 'Usuario'"
              status="online"
            />

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900">
                {{ currentUser()?.nombre || 'Usuario' }}
              </p>
              <p class="truncate text-xs text-slate-500">
                {{ currentUser()?.rol || 'Sin rol asignado' }}
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              [disabled]="loggingOut()"
              (click)="logout()"
              title="Cerrar sesión"
            >
              <i class="icon text-lg">logout</i>
            </button>
          </div>
        </div>
      </aside>

      <!-- ================================================ -->
      <!-- [ CONTENIDO ] - TOPBAR Y ROUTER OUTLET           -->
      <!-- ================================================ -->
      <div class="min-h-screen lg:pl-[17rem]">
        <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div class="flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6">
            <div class="flex min-w-0 items-center gap-3">
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                (click)="toggleSidebar()"
                aria-label="Abrir menú lateral"
              >
                <i class="icon text-xl">menu</i>
              </button>

              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Panel operativo
                </p>
                <p class="truncate text-sm font-medium text-slate-900">
                  {{ currentUser()?.rol || 'Usuario autenticado' }}
                </p>
              </div>
            </div>

            <div class="hidden items-center gap-3 sm:flex">
              <app-avatar
                size="sm"
                [initials]="userInitials()"
                [alt]="currentUser()?.nombre || 'Usuario'"
              />
              <div class="text-right">
                <p class="text-sm font-semibold text-slate-900">
                  {{ currentUser()?.nombre || 'Usuario' }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ currentUser()?.email || 'Sin correo disponible' }}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main class="w-full px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ==========================================
  // [ ESTADO ] - SIDEBAR Y SESION
  // ==========================================
  protected readonly currentUser = this.authService.currentUser;
  protected readonly sidebarOpen = signal(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  protected readonly loggingOut = signal(false);

  // ==========================================
  // [ DATOS DERIVADOS ] - NAVEGACION Y PERFIL
  // ==========================================
  protected readonly navItems = computed(() => {
    const dashboardRoute = routes.find((route) => route.path === 'dashboard');
    const children = dashboardRoute?.children ?? [];

    return children
      .filter((child) => {
        const path = child.path ?? '';
        if (!path || path.includes('/') || path === 'forbidden') {
          return path === '';
        }

        return Object.prototype.hasOwnProperty.call(NAV_METADATA, path);
      })
      .map((child) => {
        const path = child.path ?? '';
        const meta = NAV_METADATA[path];
        const permissions = Array.isArray(child.data?.['permissions'])
          ? child.data?.['permissions']
          : [];

        return {
          label: meta.label,
          path: path ? `/dashboard/${path}` : '/dashboard',
          icon: meta.icon,
          exact: meta.exact ?? false,
          permissions,
        } satisfies DashboardNavItem;
      })
      .filter((item) => item.permissions.length === 0 || this.authService.hasAllPermissions(item.permissions));
  });

  protected readonly userInitials = computed(() => {
    const fullName = this.currentUser()?.nombre?.trim() ?? '';
    if (!fullName) {
      return 'HY';
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  // ==========================================
  // [ LAYOUT ] - COMPORTAMIENTO RESPONSIVE
  // ==========================================
  protected isDesktopViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    this.sidebarOpen.set(this.isDesktopViewport());
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  protected closeSidebar(): void {
    if (!this.isDesktopViewport()) {
      this.sidebarOpen.set(false);
    }
  }

  // ==========================================
  // [ ACCIONES ] - SESION DEL USUARIO
  // ==========================================
  protected logout(): void {
    this.loggingOut.set(true);

    this.authService
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe(() => {
        void this.router.navigate(['/login']);
      });
  }
}
