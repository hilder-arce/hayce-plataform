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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
            }
          }
        `,
      )
      .pipe(
        map((response) =>
          (response[operation] ?? []).map((station) => this.mapStation(station)),
        ),
      );
  }

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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
            }
          }
        `,
        { id },
      )
      .pipe(
        map((response) =>
          this.mapStation((response[operation] as StationGraphql)!),
        ),
      );
  }

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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapStation(response.createStation)));
  }

  updateStation(
    id: string,
    payload: UpdateStationPayload,
  ): Observable<AppStationItem> {
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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapStation(response.updateStation)));
  }

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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapStation(response.removeStation)));
  }

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
              organization {
                id
                nombre
                slug
                estado
              }
              createdBy {
                id
                nombre
                email
              }
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
      organization: station.organization
        ? {
            _id: station.organization.id,
            nombre: station.organization.nombre,
            slug: station.organization.slug,
            estado: station.organization.estado,
          }
        : null,
      createdBy: station.createdBy
        ? {
            _id: station.createdBy.id,
            nombre: station.createdBy.nombre,
            email: station.createdBy.email,
          }
        : null,
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
  organization?: {
    id: string;
    nombre: string;
    slug: string;
    estado: boolean;
  } | null;
  createdBy?: {
    id: string;
    nombre: string;
    email?: string;
  } | null;
}
