import { OrganizationItem } from './organization.models';
import { AppUserSummary } from './user.models';

// ==========================================
// [ ENTIDAD PRINCIPAL ] - ESTACION DEL SISTEMA
// ==========================================
export interface AppStationItem {
  _id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  organization?: OrganizationItem | null;
  createdBy?: AppUserSummary | null;
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreateStationPayload {
  nombre: string;
  descripcion: string;
  organization?: string;
}

export interface UpdateStationPayload {
  nombre?: string;
  descripcion?: string;
  organization?: string;
}
