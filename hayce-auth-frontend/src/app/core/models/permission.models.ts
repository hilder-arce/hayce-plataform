// ==========================================
// [ ENTIDAD PRINCIPAL ] - OPCION DE MODULO
// ==========================================
export interface ModuleOption {
  _id: string;
  nombre: string;
  descripcion?: string;
}

// ==========================================
// [ ENTIDAD PRINCIPAL ] - PERMISO DEL SISTEMA
// ==========================================
export interface AppPermission {
  _id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  modulo: { _id?: string; nombre: string } | string;
}

// ==========================================
// [ RESPUESTAS DE API ] - PAYLOADS DE ESCRITURA
// ==========================================
export interface CreatePermissionPayload {
  nombre: string;
  descripcion: string;
  modulo: string;
}

export interface UpdatePermissionPayload {
  nombre?: string;
  descripcion?: string;
}
