import { inject, Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notification, RolePermissionsUpdatedEvent, UnreadCountResponse } from '../models/notification.models';
import { SOCKET_URL } from '../constants/api-routes.const';
import { GraphqlApiService } from './graphql-api.service';

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly graphql = inject(GraphqlApiService);
  private socket: Socket | null = null;
  private readonly _logoutSubject = new Subject<void>();
  private readonly _updateSessionsSubject = new Subject<void>();
  private readonly _liveNotificationSubject = new Subject<Notification>();
  private readonly _rolePermissionsUpdatedSubject = new Subject<RolePermissionsUpdatedEvent>();

  // Estados reactivos (Signals)
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _unreadCount = signal<number>(0);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly logout$ = this._logoutSubject.asObservable();
  readonly updateSessions$ = this._updateSessionsSubject.asObservable();
  readonly liveNotification$ = this._liveNotificationSubject.asObservable();
  readonly rolePermissionsUpdated$ = this._rolePermissionsUpdatedSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback a polling si websocket falla
    });

    this.socket.on('notification', (notif: Notification) => {
      // Si recibimos una nueva por socket, la agregamos al inicio de la lista local
      this._notifications.update(list => [notif, ...list]);
      this._unreadCount.update(count => count + 1);
      this._liveNotificationSubject.next(notif);
    });

    this.socket.on('logout_session', () => {
      this._logoutSubject.next();
    });

    this.socket.on('update_sessions', () => {
      this._updateSessionsSubject.next();
    });

    this.socket.on('role_permissions_updated', (payload: RolePermissionsUpdatedEvent) => {
      this._rolePermissionsUpdatedSubject.next(payload);
    });

    // Cargar las notificaciones iniciales (las 10 más recientes) al conectar
    this.getNotifications(1, 10).subscribe(res => {
      this._notifications.set(res.items);
    });

    this.getUnreadCount().subscribe(res => this._unreadCount.set(res.total));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  // --- MÉTODOS HTTP CON PAGINACIÓN Y BÚSQUEDA ---

  getNotifications(page = 1, limit = 10, search = ''): Observable<PaginatedNotifications> {
    return this.graphql
      .query<{ myNotifications: NotificationsPageGraphql }>(
        `
          query MyNotifications($page: Int!, $limit: Int!, $search: String) {
            myNotifications(page: $page, limit: $limit, search: $search) {
              total
              page
              pages
              items {
                id
                usuario {
                  id
                }
                tipo
                titulo
                mensaje
                leida
                estado
                createdAt
                updatedAt
              }
            }
          }
        `,
        { page, limit, search },
      )
      .pipe(map((response) => this.mapNotificationsPage(response.myNotifications)));
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.graphql.query<{ unreadNotifications: UnreadCountResponse }>(
      `
        query UnreadNotifications {
          unreadNotifications {
            total
          }
        }
      `,
    ).pipe(map((response) => response.unreadNotifications));
  }

  markAsRead(id: string): Observable<void> {
    return this.graphql.mutate<{ markNotificationAsRead: { message?: string } }>(
      `
        mutation MarkNotificationAsRead($id: String!) {
          markNotificationAsRead(id: $id) {
            message
          }
        }
      `,
      { id },
    ).pipe(
      map(() => void 0),
      tap(() => {
        this._unreadCount.update(count => Math.max(0, count - 1));
        this._notifications.update(list => list.map(n => n._id === id ? { ...n, leida: true } : n));
      })
    );
  }

  markMultipleAsRead(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    
    // Ejecutar todas las peticiones en paralelo
    ids.forEach(id => {
      this.markAsRead(id).subscribe();
    });
  }

  markAllAsRead(): Observable<void> {
    return this.graphql.mutate<{ markAllNotificationsAsRead: { message?: string } }>(
      `
        mutation MarkAllNotificationsAsRead {
          markAllNotificationsAsRead {
            message
          }
        }
      `,
    ).pipe(
      map(() => void 0),
      tap(() => {
        this._unreadCount.set(0);
        this._notifications.update(list => list.map(n => ({ ...n, leida: true })));
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.graphql.mutate<{ removeNotification: { message?: string } }>(
      `
        mutation RemoveNotification($id: String!) {
          removeNotification(id: $id) {
            message
          }
        }
      `,
      { id },
    ).pipe(map(() => void 0));
  }

  private mapNotificationsPage(page: NotificationsPageGraphql): PaginatedNotifications {
    return {
      total: page.total,
      page: page.page,
      pages: page.pages,
      items: page.items.map((notification) => ({
        _id: notification.id,
        usuario: notification.usuario?.id ?? '',
        tipo: notification.tipo,
        titulo: notification.titulo,
        mensaje: notification.mensaje,
        data: null,
        leida: notification.leida,
        estado: notification.estado,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })),
    };
  }
}

interface NotificationsPageGraphql {
  items: NotificationGraphql[];
  total: number;
  page: number;
  pages: number;
}

interface NotificationGraphql {
  id: string;
  usuario?: { id: string };
  tipo: Notification['tipo'];
  titulo: string;
  mensaje: string;
  leida: boolean;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

