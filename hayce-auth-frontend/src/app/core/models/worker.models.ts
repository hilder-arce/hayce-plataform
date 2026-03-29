import { OrganizationItem } from './organization.models';
import { AppUserSummary } from './user.models';

// ==========================================
// [ ENTIDAD PRINCIPAL ] - TRABAJADOR DEL SISTEMA
// ==========================================
export interface AppWorkerItem {
  _id: string;
  nombres: string;
  apellidos: string;
  numero_telefono?: string;
  correo?: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  organization?: OrganizationItem | null;
  createdBy?: AppUserSummary | null;
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreateWorkerPayload {
  nombres: string;
  apellidos: string;
  numero_telefono?: string;
  correo?: string;
  organization?: string;
}

export interface UpdateWorkerPayload {
  nombres?: string;
  apellidos?: string;
  numero_telefono?: string;
  correo?: string;
  organization?: string;
}
