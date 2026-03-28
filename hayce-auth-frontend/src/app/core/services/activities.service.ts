import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppActivityItem,
  CreateActivityPayload,
  UpdateActivityPayload,
} from '../models/activity.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE ACTIVIDADES ACTIVAS O INACTIVAS
  // ==========================================
  getActivities(includeInactive = false): Observable<AppActivityItem[]> {
    const operation = includeInactive ? 'inactiveActivities' : 'activities';
    return this.graphql
      .query<{ activities?: ActivityGraphql[]; inactiveActivities?: ActivityGraphql[] }>(
        `
          query Activities {
            ${operation} {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
              estacion {
                id
                nombre
              }
            }
          }
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((activity) => this.mapActivity(activity))));
  }

  // ==========================================
  // [ GET ] - OBTENER UNA ACTIVIDAD POR IDENTIFICADOR
  // ==========================================
  getActivityById(id: string, inactive = false): Observable<AppActivityItem> {
    const operation = inactive ? 'inactiveActivity' : 'activity';
    return this.graphql
      .query<{ activity?: ActivityGraphql; inactiveActivity?: ActivityGraphql }>(
        `
          query Activity($id: String!) {
            ${operation}(id: $id) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
              estacion {
                id
                nombre
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapActivity((response[operation] as ActivityGraphql)!)));
  }

  // ==========================================
  // [ POST ] - CREAR UNA NUEVA ACTIVIDAD
  // ==========================================
  createActivity(payload: CreateActivityPayload): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ createActivity: ActivityGraphql }>(
        `
          mutation CreateActivity($input: CreateActivityDto!) {
            createActivity(input: $input) {
              id
              nombre
              descripcion
              estado
              estacion {
                id
                nombre
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapActivity(response.createActivity)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UNA ACTIVIDAD EXISTENTE
  // ==========================================
  updateActivity(id: string, payload: UpdateActivityPayload): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ updateActivity: ActivityGraphql }>(
        `
          mutation UpdateActivity($id: String!, $input: UpdateActivityDto!) {
            updateActivity(id: $id, input: $input) {
              id
              nombre
              descripcion
              estado
              estacion {
                id
                nombre
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapActivity(response.updateActivity)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UNA ACTIVIDAD
  // ==========================================
  deleteActivity(id: string): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ removeActivity: ActivityGraphql }>(
        `
          mutation RemoveActivity($id: String!) {
            removeActivity(id: $id) {
              id
              estado
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapActivity(response.removeActivity)));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UNA ACTIVIDAD INACTIVA
  // ==========================================
  restoreActivity(id: string): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ restoreActivity: ActivityGraphql }>(
        `
          mutation RestoreActivity($id: String!) {
            restoreActivity(id: $id) {
              id
              estado
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapActivity(response.restoreActivity)));
  }

  private mapActivity(activity: ActivityGraphql): AppActivityItem {
    return {
      _id: activity.id,
      nombre: activity.nombre,
      descripcion: activity.descripcion,
      estado: activity.estado,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      estacion: {
        _id: activity.estacion?.id,
        nombre: activity.estacion?.nombre,
      },
    };
  }
}

interface ActivityGraphql {
  id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
  estacion?: {
    id: string;
    nombre: string;
  };
}
