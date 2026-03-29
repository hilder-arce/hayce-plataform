import { OrganizationItem } from './organization.models';

// ==========================================
// [ ENTIDAD PRINCIPAL ] - USUARIO AUTENTICADO
// ==========================================
export interface AuthUser {
  id?: string;
  _id?: string;
  nombre: string;
  email: string;
  rol: string;
  permisos: Record<string, string[]>;
  estado: boolean;
  createdAt: string;
  esSuperAdmin: boolean;
  organization?: OrganizationItem | null;
  ownerAdmin?: {
    _id: string;
    nombre: string;
    email?: string;
  } | null;
}

// ==========================================
// [ ENTIDAD PRINCIPAL ] - SESION DEL USUARIO
// ==========================================
export interface UserSession {
  _id?: string;
  id?: string;
  usuario?: string;
  dispositivo: string;
  ip: string;
  bloqueado: boolean;
  bloqueadoEn: string | null;
  expiraEn: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// [ RESPUESTAS DE API ] - LOGIN Y MENSAJES
// ==========================================
export interface LoginRequest {
  email: string;
  password: string;
  dispositivo?: string;
  ubicacion?: string;
}

export interface AuthEnvelope {
  status: string;
  mensaje?: string;
  data: {
    usuario: AuthUser;
  };
}

export interface MessageResponse {
  mensaje?: string;
  message?: string;
}
