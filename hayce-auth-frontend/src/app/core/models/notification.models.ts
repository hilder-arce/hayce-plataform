// ==========================================
// [ RESPUESTAS ] - CARGA VARIABLE DE EVENTOS
// ==========================================
export interface NotificationPayload {
  [key: string]: unknown;
  dispositivo?: string;
  ip?: string;
  ubicacion?: string;
  codigo?: string;
  rol?: string;
  nombreRol?: string;
  nombrePermiso?: string;
  rolNuevo?: string;
  roleName?: string;
  actualizadoPor?: string;
  permisosAgregados?: string[];
  permisosEliminados?: string[];
  numero_operacion?: string;
  estacion?: string;
}

// ==========================================
// [ ENTIDAD PRINCIPAL ] - NOTIFICACIONES
// ==========================================
export interface Notification {
  _id: string;
  usuario: string;
  tipo:
    | 'login'
    | 'sesion_revocada'
    | 'cambio_password'
    | 'verificacion'
    | 'nuevo_usuario'
    | 'nuevo_rol'
    | 'nuevo_permiso'
    | 'cambio_rol'
    | 'cambio_permisos_rol'
    | 'recordatorio_tareo';
  titulo: string;
  mensaje: string;
  data: NotificationPayload | null;
  leida: boolean;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// [ RESPUESTAS DE API ] - EVENTOS Y CONTADORES
// ==========================================
export interface RolePermissionsUpdatedEvent {
  roleId: string;
  roleName: string;
  permisosAgregados: string[];
  permisosEliminados: string[];
  actualizadoPor: string;
  fecha: string;
}

export interface UnreadCountResponse {
  total: number;
}
