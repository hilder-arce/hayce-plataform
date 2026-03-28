import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppStationItem,
  CreateStationPayload,
  UpdateStationPayload,
} from '../models/station.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class StationsService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE ESTACIONES ACTIVAS O INACTIVAS
  // ==========================================
  getStations(includeInactive = false): Observable<AppStationItem[]> {
    const operation = includeInactive ? 'inactiveStations' : 'stations';
    return this.graphql
      .query<{ stations?: StationGraphql[]; inactiveStations?: StationGraphql[] }>(
        `
          query Stations {
            ${operation} {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((station) => this.mapStation(station))));
  }

  // ==========================================
  // [ GET ] - OBTENER UNA ESTACION POR IDENTIFICADOR
  // ==========================================
  getStationById(id: string, inactive = false): Observable<AppStationItem> {
    const operation = inactive ? 'inactiveStation' : 'station';
    return this.graphql
      .query<{ station?: StationGraphql; inactiveStation?: StationGraphql }>(
        `
          query Station($id: String!) {
            ${operation}(id: $id) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapStation((response[operation] as StationGraphql)!)));
  }

  // ==========================================
  // [ POST ] - CREAR UNA NUEVA ESTACION
  // ==========================================
  createStation(payload: CreateStationPayload): Observable<AppStationItem> {
    return this.graphql
      .mutate<{ createStation: StationGraphql }>(
        `
          mutation CreateStation($input: CreateStationDto!) {
            createStation(input: $input) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapStation(response.createStation)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UNA ESTACION EXISTENTE
  // ==========================================
  updateStation(id: string, payload: UpdateStationPayload): Observable<AppStationItem> {
    return this.graphql
      .mutate<{ updateStation: StationGraphql }>(
        `
          mutation UpdateStation($id: String!, $input: UpdateStationDto!) {
            updateStation(id: $id, input: $input) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapStation(response.updateStation)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UNA ESTACION
  // ==========================================
  deleteStation(id: string): Observable<AppStationItem> {
    return this.graphql
      .mutate<{ removeStation: StationGraphql }>(
        `
          mutation RemoveStation($id: String!) {
            removeStation(id: $id) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapStation(response.removeStation)));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UNA ESTACION INACTIVA
  // ==========================================
  restoreStation(id: string): Observable<AppStationItem> {
    return this.graphql
      .mutate<{ restoreStation: StationGraphql }>(
        `
          mutation RestoreStation($id: String!) {
            restoreStation(id: $id) {
              id
              nombre
              descripcion
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapStation(response.restoreStation)));
  }

  private mapStation(station: StationGraphql): AppStationItem {
    return {
      _id: station.id,
      nombre: station.nombre,
      descripcion: station.descripcion,
      estado: station.estado,
      createdAt: station.createdAt,
      updatedAt: station.updatedAt,
    };
  }
}

interface StationGraphql {
  id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}
