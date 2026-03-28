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
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreateWorkerPayload {
  nombres: string;
  apellidos: string;
  numero_telefono?: string;
  correo?: string;
}

export interface UpdateWorkerPayload {
  nombres?: string;
  apellidos?: string;
  numero_telefono?: string;
  correo?: string;
}
