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
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreateStationPayload {
  nombre: string;
  descripcion: string;
}

export interface UpdateStationPayload {
  nombre?: string;
  descripcion?: string;
}
