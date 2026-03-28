import { AppActivityItem } from './activity.models';
import { AppStationItem } from './station.models';
import { AppUserItem } from './user.models';
import { AppWorkerItem } from './worker.models';

// ==========================================
// [ ENUMS ] - ESTADOS DEL TAREO
// ==========================================
export enum EstadoTareo {
  POR_INICIAR = 'POR_INICIAR',
  EN_DESARROLLO = 'EN_DESARROLLO',
  FINALIZADO = 'FINALIZADO',
}

export const ESTADO_TAREO_LABELS: Record<EstadoTareo, string> = {
  [EstadoTareo.POR_INICIAR]: 'Por iniciar',
  [EstadoTareo.EN_DESARROLLO]: 'En desarrollo',
  [EstadoTareo.FINALIZADO]: 'Finalizado',
};

// ==========================================
// [ ENTIDAD PRINCIPAL ] - TAREO DEL SISTEMA
// ==========================================
export interface AppTareoItem {
  _id: string;
  trabajador: Partial<AppWorkerItem>;
  creado_por?: Partial<AppUserItem>;
  actividad: Partial<AppActivityItem>;
  estacion: string;
  estacion_ref?: Partial<AppStationItem>;
  numero_operacion: string;
  chasis: string;
  fecha: string;
  hora_ini: string;
  hora_fin?: string;
  horas: number;
  observacion?: string;
  estado_tareo: EstadoTareo;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// [ PAYLOADS ] - ESCRITURA EN API
// ==========================================
export interface CreateTareoPayload {
  trabajador: string;
  actividad: string;
  estacion: string;
  numero_operacion: string;
  chasis: string;
  fecha: string;
  hora_ini: string;
  hora_fin?: string;
  observacion?: string;
  estado_tareo?: EstadoTareo;
}

export interface UpdateTareoPayload extends Partial<CreateTareoPayload> {}
