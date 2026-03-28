// TIPOS
export interface NotifyPayload {
  tipo: string;
  titulo: string;
  mensaje: string;
  data?: Record<string, any>;
  email?: {
    subject: string;
    html: string;
  };
}
