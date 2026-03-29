import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize, Subscription } from 'rxjs';

import { routes } from '../../../app.routes';
import { Notification, RolePermissionsUpdatedEvent } from '../../../core/models/notification.models';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { RoleCelebrationService } from '../../../core/services/role-celebration.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { HayceLogoComponent } from '../../../shared/components/hayce-logo/hayce-logo.component';

interface ShellNavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  permissions?: string[];
}

const SHELL_NAV_METADATA: Record<string, { label: string; icon: string; exact?: boolean }> = {
  '': { label: 'Inicio', icon: 'home', exact: true },
  organizations: { label: 'Organizaciones', icon: 'apartment' },
  users: { label: 'Usuarios', icon: 'group' },
  roles: { label: 'Roles', icon: 'security' },
  stations: { label: 'Estaciones', icon: 'location_on' },
  activities: { label: 'Actividades', icon: 'assignment' },
  tareos: { label: 'Tareos', icon: 'edit_note' },
  workers: { label: 'Trabajadores', icon: 'engineering' },
  modules: { label: 'Módulos', icon: 'view_module' },
  permissions: { label: 'Permisos', icon: 'vpn_key' },
};

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AvatarComponent,
    HayceLogoComponent,
  ],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShellComponent implements OnInit, OnDestroy {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationsService);
  private readonly alertService = inject(AlertService);
  private readonly roleCelebrationService = inject(RoleCelebrationService);
  private readonly router = inject(Router);
  private logoutSub?: Subscription;
  private liveNotificationSub?: Subscription;
  private rolePermissionsUpdatedSub?: Subscription;

  // ==========================================
  // [ ESTADO ] - SESION, SIDEBAR Y UI
  // ==========================================
  protected readonly currentUser = this.authService.currentUser;
  protected readonly unreadCount = this.notificationService.unreadCount;
  protected readonly liveNotifications = signal<Notification[]>([]);

  protected readonly sidebarOpen = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  protected userMenuOpen = false;
  protected leavingSession = false;

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

        return Object.prototype.hasOwnProperty.call(SHELL_NAV_METADATA, path);
      })
      .map((child) => {
        const path = child.path ?? '';
        const meta = SHELL_NAV_METADATA[path];
        const permissions = Array.isArray(child.data?.['permissions'])
          ? child.data?.['permissions']
          : [];

        return {
          label: meta.label,
          path: path ? `/dashboard/${path}` : '/dashboard',
          icon: meta.icon,
          exact: meta.exact ?? false,
          permissions,
        } satisfies ShellNavItem;
      })
      .filter((item) => item.path !== '/dashboard/organizations' || this.currentUser()?.esSuperAdmin)
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
  // [ LAYOUT ] - SIDEBAR RESPONSIVE
  // ==========================================
  protected isDesktopViewport(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.userMenuOpen = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isDesktopViewport()) {
      this.sidebarOpen.set(true);
      return;
    }

    this.sidebarOpen.set(false);
  }

  // ==========================================
  // [ STREAM REACTIVO ] - SOCKETS Y SESION
  // ==========================================
  ngOnInit(): void {
    this.notificationService.connect();

    this.liveNotificationSub = this.notificationService.liveNotification$.subscribe((notif) => {
      this.queueLiveNotification(notif);
      this.handleRoleChangeNotification(notif);
    });

    this.rolePermissionsUpdatedSub = this.notificationService.rolePermissionsUpdated$.subscribe((event) => {
      this.handleRolePermissionsUpdated(event);
    });

    this.logoutSub = this.notificationService.logout$.subscribe(() => {
      this.alertService.show(
        'Esta sesión fue cerrada por una acción de seguridad. Serás redirigido para volver a autenticarte.',
        'warning',
        3200,
      );

      setTimeout(() => {
        this.authService.clearSession();
        void this.router.navigate(['/login']);
      }, 3400);
    });
  }

  ngOnDestroy(): void {
    this.notificationService.disconnect();
    this.logoutSub?.unsubscribe();
    this.liveNotificationSub?.unsubscribe();
    this.rolePermissionsUpdatedSub?.unsubscribe();
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    if (!this.isDesktopViewport()) {
      this.sidebarOpen.set(false);
    }
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  protected goToNotifications(): void {
    void this.router.navigate(['/dashboard/notifications']);
  }

  protected getToastBadge(notification: Notification): string {
    switch (notification.tipo) {
      case 'login':
        return 'Seguridad';
      case 'sesion_revocada':
        return 'Acceso';
      case 'cambio_password':
        return 'Cuenta';
      case 'cambio_rol':
        return 'Cargo';
      case 'cambio_permisos_rol':
        return 'Permisos';
      default:
        return 'Sistema';
    }
  }

  protected getToastTitle(notification: Notification): string {
    switch (notification.tipo) {
      case 'login':
        return 'Inicio de sesión registrado';
      case 'sesion_revocada':
        return 'Sesión finalizada';
      case 'cambio_password':
        return 'Contraseña actualizada';
      case 'cambio_rol':
        return 'Cargo actualizado';
      case 'cambio_permisos_rol':
        return 'Permisos del rol actualizados';
      default:
        return notification.titulo;
    }
  }

  protected getToastMessage(notification: Notification): string {
    if (notification.tipo === 'login') {
      return 'Se detectó un acceso correcto a tu cuenta.';
    }

    if (notification.tipo === 'sesion_revocada') {
      return 'El acceso de esta sesión fue deshabilitado por una acción de seguridad.';
    }

    if (notification.tipo === 'cambio_rol') {
      const roleName = this.getRoleChangeName(notification.data);
      return `Ahora formas parte del cargo ${roleName}.`;
    }

    if (notification.tipo === 'cambio_permisos_rol') {
      const roleName = this.getRolePermissionsName(notification.data);
      return `Los permisos del rol ${roleName} fueron sincronizados.`;
    }

    return notification.mensaje;
  }

  protected getToastMeta(notification: Notification): string {
    if (notification.tipo === 'login' || notification.tipo === 'sesion_revocada') {
      const device = this.summarizeDevice(this.getString(notification.data, 'dispositivo'));
      const ip = this.getString(notification.data, 'ip');

      return [device, ip ? `IP ${ip}` : ''].filter(Boolean).join(' · ');
    }

    return '';
  }

  protected getToastContainerClasses(notification: Notification): string {
    switch (notification.tipo) {
      case 'login':
        return 'border-cyan-200 bg-cyan-50 text-cyan-700';
      case 'sesion_revocada':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'cambio_password':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700';
      case 'cambio_rol':
      case 'cambio_permisos_rol':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      default:
        return 'border-slate-200 bg-white text-slate-700';
    }
  }

  protected getToastIcon(notification: Notification): string {
    switch (notification.tipo) {
      case 'login':
        return 'shield';
      case 'sesion_revocada':
        return 'gpp_bad';
      case 'cambio_password':
        return 'lock';
      case 'cambio_rol':
        return 'workspace_premium';
      case 'cambio_permisos_rol':
        return 'verified_user';
      default:
        return 'notifications';
    }
  }

  protected hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  protected logout(): void {
    this.leavingSession = true;
    this.authService
      .logout()
      .pipe(finalize(() => (this.leavingSession = false)))
      .subscribe(() => {
        void this.router.navigate(['/login']);
      });
  }

  // ==========================================
  // [ PRIVADO ] - FLUJO DE NOTIFICACIONES
  // ==========================================
  private queueLiveNotification(notification: Notification): void {
    this.liveNotifications.update((list) => [notification, ...list]);
    setTimeout(() => {
      this.liveNotifications.update((list) => list.filter((item) => item._id !== notification._id));
    }, 4500);
  }

  private handleRoleChangeNotification(notification: Notification): void {
    if (notification.tipo !== 'cambio_rol') {
      return;
    }

    const roleName = this.getRoleChangeName(notification.data);
    const updatedBy = this.getString(notification.data, 'actualizadoPor');
    const suffix = updatedBy ? ` por ${updatedBy}` : '';

    this.authService.me().subscribe({
      next: () => {
        const activeAccess = this.getActiveAccessContext();
        const canAccessCurrentRoute = activeAccess
          ? activeAccess.permissions.length === 0 || this.authService.hasAllPermissions(activeAccess.permissions)
          : true;

        this.roleCelebrationService.setMessage({
          title: `Felicitaciones por tu nuevo cargo: ${roleName}`,
          body: `Tu acceso fue actualizado${suffix}. El panel ahora refleja los permisos y accesos de este rol.`,
          roleName,
        });

        this.alertService.show(
          canAccessCurrentRoute
            ? `Un administrador actualizó tu rol a ${roleName}. El panel lateral y tus accesos ya fueron sincronizados.`
            : `Un administrador actualizó tu rol a ${roleName}. Tu acceso cambió y serás llevado al panel principal.`,
          'success',
          4200,
        );

        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.authService.clearSession();
        void this.router.navigate(['/login']);
      },
    });
  }

  private handleRolePermissionsUpdated(event: RolePermissionsUpdatedEvent): void {
    this.authService.me().subscribe({
      next: () => {
        this.roleCelebrationService.setMessage({
          title: `Permisos actualizados para el rol ${event.roleName}`,
          body: 'Un administrador sincronizó los permisos de tu rol. El panel lateral y los accesos visibles ya fueron recalculados.',
          roleName: event.roleName,
        });

        this.queueLiveNotification({
          _id: `role-permissions-${Date.now()}`,
          usuario: this.currentUser()?.id ?? this.currentUser()?._id ?? '',
          tipo: 'cambio_permisos_rol',
          titulo: 'Permisos del rol actualizados',
          mensaje: `Un administrador actualizó los permisos del rol ${event.roleName}.`,
          data: {
            roleName: event.roleName,
            actualizadoPor: event.actualizadoPor,
            permisosAgregados: event.permisosAgregados,
            permisosEliminados: event.permisosEliminados,
          },
          leida: false,
          estado: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        this.alertService.show(
          `Un administrador actualizó los permisos del rol ${event.roleName}. El panel lateral fue actualizado y ser?s llevado al dashboard.`,
          'success',
          4200,
        );

        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.authService.clearSession();
        void this.router.navigate(['/login']);
      },
    });
  }

  private summarizeDevice(device?: string): string {
    if (!device) {
      return 'Dispositivo no identificado';
    }

    const normalized = device.toLowerCase();
    const browser = this.detectBrowser(normalized);
    const os = this.detectOs(normalized);

    return [browser, os ? `en ${os}` : ''].filter(Boolean).join(' ');
  }

  private detectBrowser(device: string): string {
    if (device.includes('edg/')) return 'Microsoft Edge';
    if (device.includes('opr/') || device.includes('opera')) return 'Opera';
    if (device.includes('chrome/')) return 'Google Chrome';
    if (device.includes('firefox/')) return 'Mozilla Firefox';
    if (device.includes('safari/') && !device.includes('chrome/')) return 'Safari';
    return 'Navegador web';
  }

  private detectOs(device: string): string {
    if (device.includes('windows')) return 'Windows';
    if (device.includes('android')) return 'Android';
    if (device.includes('iphone') || device.includes('ipad') || device.includes('ios')) return 'iOS';
    if (device.includes('mac os') || device.includes('macintosh')) return 'macOS';
    if (device.includes('linux')) return 'Linux';
    return '';
  }

  private getBlockedAccessContext(): { from: string; permissions: string[] } | null {
    if (!this.router.url.startsWith('/dashboard/forbidden')) {
      return null;
    }

    const tree = this.router.parseUrl(this.router.url);
    const from = tree.queryParams['from'] ?? '/dashboard';
    const permissionsParam = tree.queryParams['permissions'] ?? '';
    const permissions = String(permissionsParam)
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean);

    return {
      from,
      permissions,
    };
  }

  private getActiveAccessContext(): { from: string; permissions: string[] } | null {
    if (this.router.url.startsWith('/dashboard/forbidden')) {
      return this.getBlockedAccessContext();
    }

    const from = this.router.url.split('?')[0];
    return {
      from,
      permissions: this.resolvePermissionsForUrl(from),
    };
  }

  private resolvePermissionsForUrl(url: string): string[] {
    const dashboardRoute = this.router.config.find((route) => route.path === 'dashboard');
    const children = dashboardRoute?.children ?? [];
    const normalizedUrl = url.replace(/^\//, '');
    const urlSegments = normalizedUrl.split('/').filter(Boolean);

    if (urlSegments[0] !== 'dashboard') {
      return [];
    }

    const childSegments = urlSegments.slice(1);

    for (const route of children) {
      const path = route.path ?? '';
      if (!path || path === 'forbidden') {
        continue;
      }

      const routeSegments = path.split('/').filter(Boolean);
      if (!this.matchesRoute(routeSegments, childSegments)) {
        continue;
      }

      const permissions = route.data?.['permissions'];
      if (Array.isArray(permissions)) {
        return permissions.filter(
          (permission): permission is string => typeof permission === 'string' && permission.trim().length > 0,
        );
      }

      if (typeof permissions === 'string' && permissions.trim().length > 0) {
        return [permissions];
      }

      return [];
    }

    return [];
  }

  private matchesRoute(routeSegments: string[], urlSegments: string[]): boolean {
    if (routeSegments.length !== urlSegments.length) {
      return false;
    }

    return routeSegments.every((segment, index) => segment.startsWith(':') || segment === urlSegments[index]);
  }

  private getString(data: unknown, key: string): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const value = (data as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private getRoleChangeName(data: unknown): string {
    return this.getString(data, 'rolNuevo') ?? 'un nuevo cargo';
  }

  private getRolePermissionsName(data: unknown): string {
    return this.getString(data, 'roleName') ?? 'tu rol';
  }
}
