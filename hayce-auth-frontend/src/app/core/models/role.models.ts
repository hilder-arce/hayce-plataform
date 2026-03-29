import { OrganizationItem } from './organization.models';
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
  organization?: OrganizationItem | null;
  createdBy?: {
    _id: string;
    nombre: string;
    email?: string;
  } | null;
  ownerAdmin?: {
    _id: string;
    nombre: string;
    email?: string;
  } | null;
}

// [ PAYLOADS DE API ]
export interface CreateRolePayload {
  nombre: string;
  descripcion: string;
  permisos?: string[];
  organization?: string;
}

export interface UpdateRolePayload {
  nombre?: string;
  descripcion?: string;
  permisos?: string[];
  permisosEliminar?: string[];
}
