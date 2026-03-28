import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppModuleItem,
  CreateModulePayload,
  UpdateModulePayload,
} from '../models/module.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class ModulesService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE MODULOS ACTIVOS O INACTIVOS
  // ==========================================
  getModules(includeInactive = false): Observable<AppModuleItem[]> {
    const operation = includeInactive ? 'inactiveModules' : 'modules';
    return this.graphql
      .query<{ modules?: ModuleGraphql[]; inactiveModules?: ModuleGraphql[] }>(
        `
          query Modules {
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
      .pipe(map((response) => (response[operation] ?? []).map((module) => this.mapModule(module))));
  }

  // ==========================================
  // [ GET ] - OBTENER UN MODULO POR IDENTIFICADOR
  // ==========================================
  getModuleById(id: string, inactive = false): Observable<AppModuleItem> {
    const operation = inactive ? 'inactiveModule' : 'module';
    return this.graphql
      .query<{ module?: ModuleGraphql; inactiveModule?: ModuleGraphql }>(
        `
          query Module($id: String!) {
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
      .pipe(map((response) => this.mapModule((response[operation] as ModuleGraphql)!)));
  }

  // ==========================================
  // [ POST ] - CREAR UN NUEVO MODULO
  // ==========================================
  createModule(payload: CreateModulePayload): Observable<AppModuleItem> {
    return this.graphql
      .mutate<{ createModule: ModuleGraphql }>(
        `
          mutation CreateModule($input: CreateModuleDto!) {
            createModule(input: $input) {
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
      .pipe(map((response) => this.mapModule(response.createModule)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UN MODULO EXISTENTE
  // ==========================================
  updateModule(id: string, payload: UpdateModulePayload): Observable<AppModuleItem> {
    return this.graphql
      .mutate<{ updateModule: ModuleGraphql }>(
        `
          mutation UpdateModule($id: String!, $input: UpdateModuleDto!) {
            updateModule(id: $id, input: $input) {
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
      .pipe(map((response) => this.mapModule(response.updateModule)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UN MODULO
  // ==========================================
  deleteModule(id: string): Observable<AppModuleItem> {
    return this.graphql
      .mutate<{ removeModule: ModuleGraphql }>(
        `
          mutation RemoveModule($id: String!) {
            removeModule(id: $id) {
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
      .pipe(map((response) => this.mapModule(response.removeModule)));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UN MODULO INACTIVO
  // ==========================================
  restoreModule(id: string): Observable<AppModuleItem> {
    return this.graphql
      .mutate<{ restoreModule: ModuleGraphql }>(
        `
          mutation RestoreModule($id: String!) {
            restoreModule(id: $id) {
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
      .pipe(map((response) => this.mapModule(response.restoreModule)));
  }

  private mapModule(module: ModuleGraphql): AppModuleItem {
    return {
      _id: module.id,
      nombre: module.nombre,
      descripcion: module.descripcion,
      estado: module.estado,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }
}

interface ModuleGraphql {
  id: string;
  nombre: string;
  descripcion: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}
