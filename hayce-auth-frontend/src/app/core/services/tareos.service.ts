import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppTareoItem,
  CreateTareoPayload,
  UpdateTareoPayload,
} from '../models/tareo.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class TareosService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE TAREOS
  // ==========================================
  getTareos(): Observable<AppTareoItem[]> {
    return this.graphql
      .query<{ tareos: TareoGraphql[] }>(
        `
          query Tareos {
            tareos {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
              }
              actividad {
                id
                nombre
                estacion {
                  id
                  nombre
                }
              }
            }
          }
        `,
      )
      .pipe(map((response) => (response.tareos ?? []).map((tareo) => this.mapTareo(tareo))));
  }

  // ==========================================
  // [ GET ] - OBTENER UN TAREO POR ID
  // ==========================================
  getTareoById(id: string): Observable<AppTareoItem> {
    return this.graphql
      .query<{ tareo: TareoGraphql }>(
        `
          query Tareo($id: String!) {
            tareo(id: $id) {
              id
              numero_operacion
              chasis
              fecha
              hora_ini
              hora_fin
              horas
              observacion
              estado_tareo
              estado
              estacion
              creado_por {
                id
                nombre
                email
              }
              trabajador {
                id
                nombres
                apellidos
              }
              actividad {
                id
                nombre
                estacion {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapTareo(response.tareo)));
  }

  // ==========================================
  // [ POST ] - REGISTRAR TAREO
  // ==========================================
  createTareo(payload: CreateTareoPayload): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ createTareo: TareoGraphql }>(
        `
          mutation CreateTareo($input: CreateTareoDto!) {
            createTareo(input: $input) {
              id
              numero_operacion
              chasis
              estacion
              estado_tareo
              trabajador {
                id
                nombres
                apellidos
              }
              creado_por {
                id
                nombre
                email
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapTareo(response.createTareo)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR TAREO
  // ==========================================
  updateTareo(id: string, payload: UpdateTareoPayload): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ updateTareo: TareoGraphql }>(
        `
          mutation UpdateTareo($id: String!, $input: UpdateTareoDto!) {
            updateTareo(id: $id, input: $input) {
              id
              numero_operacion
              chasis
              estacion
              estado_tareo
              trabajador {
                id
                nombres
                apellidos
              }
              creado_por {
                id
                nombre
                email
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapTareo(response.updateTareo)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA
  // ==========================================
  deleteTareo(id: string): Observable<AppTareoItem> {
    return this.graphql
      .mutate<{ removeTareo: TareoGraphql }>(
        `
          mutation RemoveTareo($id: String!) {
            removeTareo(id: $id) {
              id
              estado
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapTareo(response.removeTareo)));
  }

  private mapTareo(tareo: TareoGraphql): AppTareoItem {
    return {
      _id: tareo.id,
      numero_operacion: tareo.numero_operacion,
      chasis: tareo.chasis,
      fecha: tareo.fecha,
      hora_ini: tareo.hora_ini,
      hora_fin: tareo.hora_fin,
      horas: tareo.horas,
      observacion: tareo.observacion,
      estado_tareo: tareo.estado_tareo,
      estado: tareo.estado,
      estacion: tareo.estacion,
      creado_por: {
        _id: tareo.creado_por?.id,
        nombre: tareo.creado_por?.nombre,
        email: tareo.creado_por?.email,
      },
      trabajador: {
        _id: tareo.trabajador?.id,
        nombres: tareo.trabajador?.nombres,
        apellidos: tareo.trabajador?.apellidos,
      },
      actividad: {
        _id: tareo.actividad?.id,
        nombre: tareo.actividad?.nombre,
        estacion: {
          _id: tareo.actividad?.estacion?.id,
          nombre: tareo.actividad?.estacion?.nombre,
        }
      } as any,
      estacion_ref: {
        _id: tareo.actividad?.estacion?.id,
        nombre: tareo.actividad?.estacion?.nombre,
      },
    };
  }
}

interface TareoGraphql {
  id: string;
  numero_operacion: string;
  chasis: string;
  fecha: string;
  hora_ini: string;
  hora_fin?: string;
  horas: number;
  observacion?: string;
  estado_tareo: any;
  estado: boolean;
  estacion: string;
  creado_por?: {
    id: string;
    nombre: string;
    email: string;
  };
  trabajador?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  actividad?: {
    id: string;
    nombre: string;
    estacion?: {
      id: string;
      nombre: string;
    }
  };
}
