import { AppStationItem } from './station.models';

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
