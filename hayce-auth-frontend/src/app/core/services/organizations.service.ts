import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { OrganizationFormData, OrganizationItem } from '../models/organization.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class OrganizationsService {
  private readonly graphql = inject(GraphqlApiService);

  getOrganizations(includeInactive = false): Observable<OrganizationItem[]> {
    const operation = includeInactive ? 'inactiveOrganizations' : 'organizations';

    return this.graphql
      .query<{ organizations?: OrganizationGraphql[]; inactiveOrganizations?: OrganizationGraphql[] }>(
        `
          query Organizations {
            ${operation} {
              id
              nombre
              slug
              estado
              userCount
              roleCount
              createdAt
              updatedAt
              createdBy {
                id
                nombre
                email
              }
              principalAdmin {
                id
                nombre
                email
              }
            }
          }
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((item) => this.mapOrganization(item))));
  }

  getOrganizationById(id: string): Observable<OrganizationItem> {
    return this.graphql
      .query<{ organization: OrganizationGraphql }>(
        `
          query Organization($id: String!) {
            organization(id: $id) {
              id
              nombre
              slug
              estado
              userCount
              roleCount
              createdAt
              updatedAt
              createdBy {
                id
                nombre
                email
              }
              principalAdmin {
                id
                nombre
                email
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapOrganization(response.organization)));
  }

  createOrganization(payload: OrganizationFormData): Observable<OrganizationItem> {
    return this.graphql
      .mutate<{ createOrganization: OrganizationGraphql }>(
        `
          mutation CreateOrganization($input: CreateOrganizationDto!) {
            createOrganization(input: $input) {
              id
              nombre
              slug
              estado
              userCount
              roleCount
              createdAt
              updatedAt
              createdBy {
                id
                nombre
                email
              }
              principalAdmin {
                id
                nombre
                email
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapOrganization(response.createOrganization)));
  }

  updateOrganization(id: string, payload: Partial<OrganizationFormData>): Observable<OrganizationItem> {
    return this.graphql
      .mutate<{ updateOrganization: OrganizationGraphql }>(
        `
          mutation UpdateOrganization($id: String!, $input: UpdateOrganizationDto!) {
            updateOrganization(id: $id, input: $input) {
              id
              nombre
              slug
              estado
              userCount
              roleCount
              createdAt
              updatedAt
              createdBy {
                id
                nombre
                email
              }
              principalAdmin {
                id
                nombre
                email
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapOrganization(response.updateOrganization)));
  }

  deleteOrganization(id: string): Observable<void> {
    return this.graphql
      .mutate<{ removeOrganization: { id: string } }>(
        `
          mutation RemoveOrganization($id: String!) {
            removeOrganization(id: $id) {
              id
            }
          }
        `,
        { id },
      )
      .pipe(map(() => void 0));
  }

  restoreOrganization(id: string): Observable<void> {
    return this.graphql
      .mutate<{ restoreOrganization: { id: string } }>(
        `
          mutation RestoreOrganization($id: String!) {
            restoreOrganization(id: $id) {
              id
            }
          }
        `,
        { id },
      )
      .pipe(map(() => void 0));
  }

  private mapOrganization(item: OrganizationGraphql): OrganizationItem {
    return {
      _id: item.id,
      nombre: item.nombre,
      slug: item.slug,
      estado: item.estado,
      userCount: item.userCount ?? 0,
      roleCount: item.roleCount ?? 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdBy: item.createdBy
        ? {
            _id: item.createdBy.id,
            nombre: item.createdBy.nombre,
            email: item.createdBy.email,
          }
        : null,
      principalAdmin: item.principalAdmin
        ? {
            _id: item.principalAdmin.id,
            nombre: item.principalAdmin.nombre,
            email: item.principalAdmin.email,
          }
        : null,
    };
  }
}

interface OrganizationGraphql {
  id: string;
  nombre: string;
  slug: string;
  estado: boolean;
  userCount?: number;
  roleCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    nombre: string;
    email?: string;
  } | null;
  principalAdmin?: {
    id: string;
    nombre: string;
    email?: string;
  } | null;
}
