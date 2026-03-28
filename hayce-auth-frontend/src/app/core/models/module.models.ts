// ==========================================
// [ ENTIDAD PRINCIPAL ] - MODULO DEL SISTEMA
// ==========================================
export interface AppModuleItem {
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
export interface CreateModulePayload {
  nombre: string;
  descripcion: string;
}

export interface UpdateModulePayload {
  nombre?: string;
  descripcion?: string;
}
