import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { Notification, NotificationPayload } from '../../../core/models/notification.models';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './notifications.html',
})
export class NotificationsComponent implements OnInit, OnDestroy {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly notificationService = inject(NotificationsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly viewedUnreadIds = new Set<string>();
  private liveNotificationSub?: Subscription;

  // ==========================================
  // [ ESTADO ] - LISTADO Y FILTROS
  // ==========================================
  protected notifications: Notification[] = [];
  protected total = 0;
  protected page = 1;
  protected hasMore = false;
  protected loading = false;

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  // ==========================================
  // [ CICLO DE VIDA ] - CARGA Y SOCKETS
  // ==========================================
  ngOnInit(): void {
    this.loadNotifications();

    this.liveNotificationSub = this.notificationService.liveNotification$.subscribe((notif) => {
      this.mergeLiveNotification(notif);
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => {
        this.resetAndLoad();
      });
  }

  ngOnDestroy(): void {
    this.liveNotificationSub?.unsubscribe();
    this.flushViewedNotifications();
  }

  // ==========================================
  // [ ACCIONES ] - PAGINACION Y MARCADO
  // ==========================================
  protected loadNotifications(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const search = this.searchControl.value || '';

    this.notificationService
      .getNotifications(this.page, 10, search)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((res) => {
        this.notifications = this.page === 1 ? res.items : [...this.notifications, ...res.items];
        this.total = res.total;
        this.hasMore = this.page < res.pages;
        this.trackViewedNotifications(res.items);
        this.cdr.detectChanges();
      });
  }

  protected loadMore(): void {
    if (this.hasMore && !this.loading) {
      this.page++;
      this.loadNotifications();
    }
  }

  protected resetAndLoad(): void {
    this.page = 1;
    this.notifications = [];
    this.loadNotifications();
  }

  protected markAsRead(notif: Notification): void {
    if (notif.leida) {
      return;
    }

    this.notificationService.markAsRead(notif._id).subscribe(() => {
      notif.leida = true;
      this.viewedUnreadIds.delete(notif._id);
      this.cdr.detectChanges();
    });
  }

  protected deleteNotif(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.delete(id).subscribe(() => {
      this.notifications = this.notifications.filter((n) => n._id !== id);
      this.total--;
      this.cdr.detectChanges();
    });
  }

  protected markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications = this.notifications.map((n) => ({ ...n, leida: true }));
      this.viewedUnreadIds.clear();
      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // [ PRESENTACION ] - TEXTOS E ICONOS
  // ==========================================
  protected getTitle(notif: Notification): string {
    switch (notif.tipo) {
      case 'login':
        return 'Inicio de sesión detectado';
      case 'sesion_revocada':
        return 'Sesión cerrada remotamente';
      case 'cambio_password':
        return 'Contraseña actualizada';
      case 'verificacion':
        return 'Código de verificación';
      case 'nuevo_usuario':
        return 'Nuevo usuario registrado';
      case 'nuevo_rol':
        return 'Nuevo rol creado';
      case 'nuevo_permiso':
        return 'Nuevo permiso creado';
      case 'cambio_rol':
        return 'Cargo actualizado';
      case 'cambio_permisos_rol':
        return 'Permisos del rol actualizados';
      default:
        return 'Notificación del sistema';
    }
  }

  protected getSummary(notif: Notification): string {
    const device = this.summarizeDevice(this.getString(notif.data, 'dispositivo'));

    switch (notif.tipo) {
      case 'login':
        return device
          ? `Se registró un acceso correcto desde ${device}.`
          : 'Se registró un acceso correcto a la cuenta.';
      case 'sesion_revocada':
        return device
          ? `Se revocó una sesión iniciada desde ${device}.`
          : 'Se revocó una sesión activa de la cuenta.';
      case 'cambio_password':
        return 'La contraseña de la cuenta fue actualizada correctamente.';
      case 'verificacion': {
        const code = this.getString(notif.data, 'codigo');
        return code ? `Código de verificación: ${code}` : notif.mensaje;
      }
      case 'nuevo_usuario': {
        const role = this.getString(notif.data, 'rol');
        return role ? `Se creó una cuenta con el rol ${role}.` : 'Se creó una nueva cuenta en el sistema.';
      }
      case 'nuevo_rol': {
        const roleName = this.getString(notif.data, 'nombreRol');
        return roleName ? `Se agregó el rol ${roleName}.` : 'Se agregó un nuevo rol al sistema.';
      }
      case 'nuevo_permiso': {
        const permissionName = this.getString(notif.data, 'nombrePermiso');
        return permissionName
          ? `Se agregó el permiso ${permissionName}.`
          : 'Se agregó un nuevo permiso al sistema.';
      }
      case 'cambio_rol': {
        const roleName = this.getString(notif.data, 'rolNuevo');
        return roleName ? `Ahora formas parte del cargo ${roleName}.` : notif.mensaje;
      }
      case 'cambio_permisos_rol': {
        const roleName = this.getString(notif.data, 'roleName');
        return roleName ? `Los permisos del rol ${roleName} fueron sincronizados.` : notif.mensaje;
      }
      default:
        return notif.mensaje;
    }
  }

  protected getMeta(notif: Notification): string {
    return [
      this.summarizeDevice(this.getString(notif.data, 'dispositivo')),
      this.getString(notif.data, 'ip') ? `IP ${this.getString(notif.data, 'ip')}` : '',
      this.getString(notif.data, 'ubicacion') ?? '',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected getIcon(notif: Notification): string {
    switch (notif.tipo) {
      case 'login':
        return 'login';
      case 'sesion_revocada':
        return 'gpp_bad';
      case 'cambio_password':
        return 'lock';
      case 'verificacion':
        return 'verified_user';
      case 'nuevo_usuario':
        return 'person_add';
      case 'nuevo_rol':
        return 'admin_panel_settings';
      case 'nuevo_permiso':
        return 'key';
      case 'cambio_rol':
        return 'workspace_premium';
      case 'cambio_permisos_rol':
        return 'verified';
      default:
        return 'notifications';
    }
  }

  protected getIconClasses(notif: Notification): string {
    switch (notif.tipo) {
      case 'verificacion':
        return 'bg-cyan-50 text-cyan-700';
      case 'login':
        return 'bg-amber-50 text-amber-700';
      case 'nuevo_usuario':
        return 'bg-green-50 text-green-700';
      case 'sesion_revocada':
        return 'bg-red-50 text-red-700';
      case 'cambio_password':
        return 'bg-violet-50 text-violet-700';
      case 'nuevo_rol':
        return 'bg-indigo-50 text-indigo-700';
      case 'nuevo_permiso':
        return 'bg-teal-50 text-teal-700';
      case 'cambio_rol':
      case 'cambio_permisos_rol':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  // ==========================================
  // [ PRIVADO ] - UTILIDADES Y SINCRONIA
  // ==========================================
  private summarizeDevice(device?: string): string {
    if (!device) return '';

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
    if (device.includes('mobile')) return 'Aplicación móvil';
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

  private trackViewedNotifications(items: Notification[]): void {
    items.forEach((notif) => {
      if (!notif.leida) {
        this.viewedUnreadIds.add(notif._id);
      }
    });
  }

  private flushViewedNotifications(): void {
    const ids = [...this.viewedUnreadIds];
    if (ids.length === 0) {
      return;
    }

    this.notificationService.markMultipleAsRead(ids);
    this.notifications = this.notifications.map((notif) =>
      ids.includes(notif._id) ? { ...notif, leida: true } : notif,
    );
    this.viewedUnreadIds.clear();
  }

  private mergeLiveNotification(notif: Notification): void {
    const search = (this.searchControl.value || '').trim().toLowerCase();
    if (search) {
      const searchable = `${notif.titulo} ${notif.mensaje}`.toLowerCase();
      if (!searchable.includes(search)) {
        return;
      }
    }

    const exists = this.notifications.some((item) => item._id === notif._id);
    if (exists) {
      return;
    }

    this.notifications = [notif, ...this.notifications];
    this.total++;
    this.trackViewedNotifications([notif]);
    this.cdr.detectChanges();
  }

  private getString(data: NotificationPayload | null | undefined, key: string): string | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const value = data[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }
}
