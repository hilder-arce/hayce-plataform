import { OrganizationItem } from './organization.models';
import { Role } from './role.models';

// [ ENTIDAD PRINCIPAL ]
export interface AppUserItem {
  _id: string;
  nombre: string;
  email: string;
  rol: Role | string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
  esSuperAdmin?: boolean;
  organization?: OrganizationItem | null;
  createdBy?: AppUserSummary | null;
  ownerAdmin?: AppUserSummary | null;
}

// Alias for backward compatibility if needed, but better to use AppUserItem
export type User = AppUserItem;

// [ RESPUESTAS DE API ]
export interface UsersListResponse {
  items: User[];
  total: number;
}

// [ PAYLOADS DE FORMULARIO ]
export interface UserFormData {
  nombre: string;
  email: string;
  rol: string;
  password?: string;
  organization?: string;
}

export interface UserPasswordPayload {
  passwordActual?: string;
  passwordNuevo: string;
}

export interface AppUserSummary {
  _id: string;
  nombre: string;
  email?: string;
}
