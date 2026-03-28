import { AppPermission } from './permission.models';

// [ ENTIDAD PRINCIPAL ]
export interface Role {
  _id: string;
  nombre: string;
  descripcion?: string;
  permisos: AppPermission[];
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// [ PAYLOADS DE API ]
export interface CreateRolePayload {
  nombre: string;
  descripcion: string;
  permisos?: string[];
}

export interface UpdateRolePayload {
  nombre?: string;
  descripcion?: string;
  permisos?: string[];
  permisosEliminar?: string[];
}
