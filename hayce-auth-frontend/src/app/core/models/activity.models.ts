import { OrganizationItem } from './organization.models';
import { AppStationItem } from './station.models';
import { AppUserSummary } from './user.models';

// ==========================================
// [ ENTIDAD PRINCIPAL ] - ACTIVIDAD DEL SISTEMA
// ==========================================
export interface AppActivityItem {
  _id: string;
  nombre: string;
  descripcion: string;
  estacion: Partial<AppStationItem>;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  organization?: OrganizationItem | null;
  createdBy?: AppUserSummary | null;
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreateActivityPayload {
  nombre: string;
  descripcion: string;
  estacion: string; // ID de la estación
}

export interface UpdateActivityPayload {
  nombre?: string;
  descripcion?: string;
  estacion?: string;
}
