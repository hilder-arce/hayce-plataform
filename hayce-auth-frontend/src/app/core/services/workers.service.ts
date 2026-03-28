import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  AppWorkerItem,
  CreateWorkerPayload,
  UpdateWorkerPayload,
} from '../models/worker.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class WorkersService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTADO DE TRABAJADORES ACTIVOS O INACTIVOS
  // ==========================================
  getWorkers(includeInactive = false): Observable<AppWorkerItem[]> {
    const operation = includeInactive ? 'inactiveWorkers' : 'workers';
    return this.graphql
      .query<{ workers?: WorkerGraphql[]; inactiveWorkers?: WorkerGraphql[] }>(
        `
          query Workers {
            ${operation} {
              id
              nombres
              apellidos
              numero_telefono
              correo
              estado
              createdAt
              updatedAt
            }
          }
        `,
      )
      .pipe(map((response) => (response[operation] ?? []).map((worker) => this.mapWorker(worker))));
  }

  // ==========================================
  // [ GET ] - OBTENER UN TRABAJADOR POR IDENTIFICADOR
  // ==========================================
  getWorkerById(id: string, inactive = false): Observable<AppWorkerItem> {
    const operation = inactive ? 'inactiveWorker' : 'worker';
    return this.graphql
      .query<{ worker?: WorkerGraphql; inactiveWorker?: WorkerGraphql }>(
        `
          query Worker($id: String!) {
            ${operation}(id: $id) {
              id
              nombres
              apellidos
              numero_telefono
              correo
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapWorker((response[operation] as WorkerGraphql)!)));
  }

  // ==========================================
  // [ POST ] - CREAR UN NUEVO TRABAJADOR
  // ==========================================
  createWorker(payload: CreateWorkerPayload): Observable<AppWorkerItem> {
    return this.graphql
      .mutate<{ createWorker: WorkerGraphql }>(
        `
          mutation CreateWorker($input: CreateWorkerDto!) {
            createWorker(input: $input) {
              id
              nombres
              apellidos
              numero_telefono
              correo
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { input: payload },
      )
      .pipe(map((response) => this.mapWorker(response.createWorker)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UN TRABAJADOR EXISTENTE
  // ==========================================
  updateWorker(id: string, payload: UpdateWorkerPayload): Observable<AppWorkerItem> {
    return this.graphql
      .mutate<{ updateWorker: WorkerGraphql }>(
        `
          mutation UpdateWorker($id: String!, $input: UpdateWorkerDto!) {
            updateWorker(id: $id, input: $input) {
              id
              nombres
              apellidos
              numero_telefono
              correo
              estado
              createdAt
              updatedAt
            }
          }
        `,
        { id, input: payload },
      )
      .pipe(map((response) => this.mapWorker(response.updateWorker)));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UN TRABAJADOR
  // ==========================================
  deleteWorker(id: string): Observable<AppWorkerItem> {
    return this.graphql
      .mutate<{ removeWorker: WorkerGraphql }>(
        `
          mutation RemoveWorker($id: String!) {
            removeWorker(id: $id) {
              id
              estado
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapWorker(response.removeWorker)));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UN TRABAJADOR INACTIVO
  // ==========================================
  restoreWorker(id: string): Observable<AppWorkerItem> {
    return this.graphql
      .mutate<{ restoreWorker: WorkerGraphql }>(
        `
          mutation RestoreWorker($id: String!) {
            restoreWorker(id: $id) {
              id
              estado
            }
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapWorker(response.restoreWorker)));
  }

  private mapWorker(worker: WorkerGraphql): AppWorkerItem {
    return {
      _id: worker.id,
      nombres: worker.nombres,
      apellidos: worker.apellidos,
      numero_telefono: worker.numero_telefono,
      correo: worker.correo,
      estado: worker.estado,
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt,
    };
  }
}

interface WorkerGraphql {
  id: string;
  nombres: string;
  apellidos: string;
  numero_telefono?: string;
  correo?: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}
