import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CreateRolePayload, Role, UpdateRolePayload } from '../models/role.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly graphql = inject(GraphqlApiService);

  getRoles(includeInactive = false): Observable<Role[]> {
    const operation = includeInactive ? 'inactiveRoles' : 'roles';
    return this.graphql
      .query<{ roles?: RoleGraphql[]; inactiveRoles?: RoleGraphql[] }>(
        `
          query Roles {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((role) => this.mapRole(role))));
  }

  getRoleById(id: string, inactive = false): Observable<Role> {
    const operation = inactive ? 'inactiveRole' : 'role';
    return this.graphql
      .query<{ role?: RoleGraphql; inactiveRole?: RoleGraphql }>(
        `
          query Role($id: String!) {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapRole((response[operation] as RoleGraphql)!)));
  }

  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.graphql
      .mutate<{ createRole: RoleGraphql }>(
        `
          mutation CreateRole($input: CreateRoleDto!) {
            createRole(input: $input) {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapRole(response.createRole)));
  }

  updateRole(id: string, payload: UpdateRolePayload): Observable<Role> {
    return this.graphql
      .mutate<{ updateRole: RoleGraphql }>(
        `
          mutation UpdateRole($id: String!, $input: UpdateRoleDto!) {
            updateRole(id: $id, input: $input) {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapRole(response.updateRole)));
  }

  deleteRole(id: string): Observable<Role> {
    return this.graphql
      .mutate<{ removeRole: RoleGraphql }>(
        `
          mutation RemoveRole($id: String!) {
            removeRole(id: $id) {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapRole(response.removeRole)));
  }

  restoreRole(id: string): Observable<Role> {
    return this.graphql
      .mutate<{ restoreRole: RoleGraphql }>(
        `
          mutation RestoreRole($id: String!) {
            restoreRole(id: $id) {
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
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                id
                nombre
                descripcion
                estado
                modulo {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapRole(response.restoreRole)));
  }

  private mapRole(role: RoleGraphql): Role {
    return {
      _id: role.id,
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      organization: role.organization
        ? {
            _id: role.organization.id,
            nombre: role.organization.nombre,
            slug: role.organization.slug,
            estado: role.organization.estado,
          }
        : null,
      createdBy: role.createdBy
        ? {
            _id: role.createdBy.id,
            nombre: role.createdBy.nombre,
            email: role.createdBy.email,
          }
        : null,
      ownerAdmin: role.ownerAdmin
        ? {
            _id: role.ownerAdmin.id,
            nombre: role.ownerAdmin.nombre,
            email: role.ownerAdmin.email,
          }
        : null,
      permisos: (role.permisos ?? []).map((permission) => ({
        _id: permission.id,
        nombre: permission.nombre,
        descripcion: permission.descripcion,
        estado: permission.estado,
        modulo: permission.modulo
          ? { _id: permission.modulo.id, nombre: permission.modulo.nombre }
          : '',
      })),
    };
  }
}

interface RoleGraphql {
  id: string;
  nombre: string;
  descripcion?: string;
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
  ownerAdmin?: {
    id: string;
    nombre: string;
    email?: string;
  } | null;
  permisos?: Array<{
    id: string;
    nombre: string;
    descripcion: string;
    estado: boolean;
    modulo?: {
      id: string;
      nombre: string;
    };
  }>;
}
