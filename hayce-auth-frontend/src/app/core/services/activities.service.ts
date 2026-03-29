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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
            }
          }
        `,
      )
      .pipe(
        map((response) =>
          (response[operation] ?? []).map((activity) => this.mapActivity(activity)),
        ),
      );
  }

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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(
        map((response) =>
          this.mapActivity((response[operation] as ActivityGraphql)!),
        ),
      );
  }

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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapActivity(response.createActivity)));
  }

  updateActivity(
    id: string,
    payload: UpdateActivityPayload,
  ): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ updateActivity: ActivityGraphql }>(
        `
          mutation UpdateActivity($id: String!, $input: UpdateActivityDto!) {
            updateActivity(id: $id, input: $input) {
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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapActivity(response.updateActivity)));
  }

  deleteActivity(id: string): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ removeActivity: ActivityGraphql }>(
        `
          mutation RemoveActivity($id: String!) {
            removeActivity(id: $id) {
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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapActivity(response.removeActivity)));
  }

  restoreActivity(id: string): Observable<AppActivityItem> {
    return this.graphql
      .mutate<{ restoreActivity: ActivityGraphql }>(
        `
          mutation RestoreActivity($id: String!) {
            restoreActivity(id: $id) {
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
              estacion {
                id
                nombre
                organization {
                  id
                  nombre
                  slug
                  estado
                }
              }
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
      organization: activity.organization
        ? {
            _id: activity.organization.id,
            nombre: activity.organization.nombre,
            slug: activity.organization.slug,
            estado: activity.organization.estado,
          }
        : null,
      createdBy: activity.createdBy
        ? {
            _id: activity.createdBy.id,
            nombre: activity.createdBy.nombre,
            email: activity.createdBy.email,
          }
        : null,
      estacion: {
        _id: activity.estacion?.id,
        nombre: activity.estacion?.nombre,
        organization: activity.estacion?.organization
          ? {
              _id: activity.estacion.organization.id,
              nombre: activity.estacion.organization.nombre,
              slug: activity.estacion.organization.slug,
              estado: activity.estacion.organization.estado,
            }
          : null,
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
  estacion?: {
    id: string;
    nombre: string;
    organization?: {
      id: string;
      nombre: string;
      slug: string;
      estado: boolean;
    } | null;
  };
}
