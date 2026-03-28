import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppPermission,
  CreatePermissionPayload,
  UpdatePermissionPayload,
} from '../models/permission.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE PERMISOS ACTIVOS O INACTIVOS
  // ==========================================
  getPermissions(includeInactive = false): Observable<AppPermission[]> {
    const operation = includeInactive ? 'inactivePermissions' : 'permissions';
    return this.graphql
      .query<{ permissions?: PermissionGraphql[]; inactivePermissions?: PermissionGraphql[] }>(
        `
          query Permissions {
            ${operation} {
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
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((permission) => this.mapPermission(permission))));
  }

  // ==========================================
  // [ GET ] - OBTENER UN PERMISO POR IDENTIFICADOR
  // ==========================================
  getPermissionById(id: string, inactive = false): Observable<AppPermission> {
    const operation = inactive ? 'inactivePermission' : 'permission';
    return this.graphql
      .query<{ permission?: PermissionGraphql; inactivePermission?: PermissionGraphql }>(
        `
          query Permission($id: String!) {
            ${operation}(id: $id) {
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
        `,
        { id },
      )
      .pipe(map((response) => this.mapPermission((response[operation] as PermissionGraphql)!)));
  }

  // ==========================================
  // [ POST ] - CREAR UN NUEVO PERMISO
  // ==========================================
  createPermission(payload: CreatePermissionPayload): Observable<AppPermission> {
    return this.graphql
      .mutate<{ createPermission: PermissionGraphql }>(
        `
          mutation CreatePermission($input: CreatePermissionDto!) {
            createPermission(input: $input) {
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
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapPermission(response.createPermission)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UN PERMISO EXISTENTE
  // ==========================================
  updatePermission(id: string, payload: UpdatePermissionPayload): Observable<AppPermission> {
    return this.graphql
      .mutate<{ updatePermission: PermissionGraphql }>(
        `
          mutation UpdatePermission($id: String!, $input: UpdatePermissionDto!) {
            updatePermission(id: $id, input: $input) {
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
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapPermission(response.updatePermission)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UN PERMISO
  // ==========================================
  deletePermission(id: string): Observable<AppPermission> {
    return this.graphql
      .mutate<{ removePermission: PermissionGraphql }>(
        `
          mutation RemovePermission($id: String!) {
            removePermission(id: $id) {
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
        `,
        { id },
      )
      .pipe(map((response) => this.mapPermission(response.removePermission)));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UN PERMISO INACTIVO
  // ==========================================
  restorePermission(id: string): Observable<AppPermission> {
    return this.graphql
      .mutate<{ restorePermission: PermissionGraphql }>(
        `
          mutation RestorePermission($id: String!) {
            restorePermission(id: $id) {
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
        `,
        { id },
      )
      .pipe(map((response) => this.mapPermission(response.restorePermission)));
  }

  private mapPermission(permission: PermissionGraphql): AppPermission {
    return {
      _id: permission.id,
      nombre: permission.nombre,
      descripcion: permission.descripcion,
      estado: permission.estado,
      modulo: permission.modulo
        ? { _id: permission.modulo.id, nombre: permission.modulo.nombre }
        : '',
    };
  }
}

interface PermissionGraphql {
  id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  modulo?: {
    id: string;
    nombre: string;
  };
}
