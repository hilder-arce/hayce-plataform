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
}

export interface UserPasswordPayload {
  passwordActual?: string;
  passwordNuevo: string;
}
