import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  User,
  UserFormData,
  UserPasswordPayload,
  UsersListResponse,
} from '../models/user.models';
import { GraphqlApiService } from './graphql-api.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly graphql = inject(GraphqlApiService);

  // ==========================================
  // [ GET ] - LISTAR USUARIOS PAGINADOS
  // ==========================================
  getUsers(
    page = 1,
    limit = 10,
    search = '',
    includeInactive = false,
  ): Observable<UsersListResponse> {
    const operation = includeInactive ? 'inactiveUsers' : 'users';
    return this.graphql
      .query<{ users?: UsersListResponseGraphql; inactiveUsers?: UsersListResponseGraphql }>(
        `
          query Users($page: Int!, $limit: Int!, $search: String) {
            ${operation}(page: $page, limit: $limit, search: $search) {
              total
              items {
                id
                nombre
                email
                estado
                createdAt
                updatedAt
                rol {
                  id
                  nombre
                }
              }
            }
          }
        `,
        { page, limit, search },
      )
      .pipe(map((response) => this.mapUsersPage(response[operation] ?? { items: [], total: 0 })));
  }

  // ==========================================
  // [ GET ] - OBTENER UN USUARIO POR ID
  // ==========================================
  getUserById(id: string): Observable<User> {
    return this.graphql
      .query<{ user: UserGraphql }>(
        `
          query User($id: String!) {
            user(id: $id) {
              id
              nombre
              email
              estado
              createdAt
              updatedAt
              rol {
                id
                nombre
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
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapUser(response.user)));
  }

  // ==========================================
  // [ POST ] - CREAR UN NUEVO USUARIO
  // ==========================================
  createUser(data: UserFormData): Observable<User> {
    return this.graphql
      .mutate<{ createUser: UserGraphql }>(
        `
          mutation CreateUser($input: CreateUserDto!) {
            createUser(input: $input) {
              id
              nombre
              email
              estado
              createdAt
              updatedAt
              rol {
                id
                nombre
              }
            }
          }
        `,
        { input: data },
      )
      .pipe(map((response) => this.mapUser(response.createUser)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR UN USUARIO
  // ==========================================
  updateUser(id: string, data: Partial<UserFormData>): Observable<User> {
    return this.graphql
      .mutate<{ updateUser: UserGraphql }>(
        `
          mutation UpdateUser($id: String!, $input: UpdateUserDto!) {
            updateUser(id: $id, input: $input) {
              id
              nombre
              email
              estado
              createdAt
              updatedAt
              rol {
                id
                nombre
              }
            }
          }
        `,
        { id, input: data },
      )
      .pipe(map((response) => this.mapUser(response.updateUser)));
  }

  // ==========================================
  // [ PATCH ] - ACTUALIZAR EL PERFIL DEL USUARIO ACTUAL
  // ==========================================
  updateMe(data: Partial<UserFormData>): Observable<User> {
    return this.graphql
      .mutate<{ updateMyProfile: UserGraphql }>(
        `
          mutation UpdateMyProfile($input: UpdateUserDto!) {
            updateMyProfile(input: $input) {
              id
              nombre
              email
              estado
              createdAt
              updatedAt
              rol {
                id
                nombre
              }
            }
          }
        `,
        { input: data },
      )
      .pipe(map((response) => this.mapUser(response.updateMyProfile)));
  }

  // ==========================================
  // [ PATCH ] - CAMBIAR LA CONTRASEÑA DEL USUARIO ACTUAL
  // ==========================================
  changeMyPassword(data: UserPasswordPayload): Observable<void> {
    return this.graphql
      .mutate<{ changeMyPassword: { message?: string; mensaje?: string } }>(
        `
          mutation ChangeMyPassword($input: ChangePasswordDto!) {
            changeMyPassword(input: $input) {
              message
              mensaje
            }
          }
        `,
        { input: data },
      )
      .pipe(map(() => void 0));
  }

  // ==========================================
  // [ PATCH ] - CAMBIAR LA CONTRASEÑA DE UN USUARIO
  // ==========================================
  changePassword(id: string, data: UserPasswordPayload): Observable<void> {
    return this.graphql
      .mutate<{ changeMyPassword: { message?: string; mensaje?: string } }>(
        `
          mutation ChangeMyPassword($input: ChangePasswordDto!) {
            changeMyPassword(input: $input) {
              message
              mensaje
            }
          }
        `,
        { input: data },
      )
      .pipe(map(() => void 0));
  }

  // ==========================================
  // [ PATCH ] - CAMBIAR LA CONTRASE?A DE UN USUARIO (ADMIN)
  // ==========================================
  adminChangePassword(id: string, passwordNuevo: string): Observable<void> {
    return this.graphql
      .mutate<{ adminChangePassword: { message?: string; mensaje?: string } }>(
        `
          mutation AdminChangePassword($id: String!, $input: AdminChangePasswordDto!) {
            adminChangePassword(id: $id, input: $input) {
              message
              mensaje
            }
          }
        `,
        { id, input: { passwordNuevo } },
      )
      .pipe(map(() => void 0));
  }

  // ==========================================
  // [ DELETE ] - DESACTIVAR UN USUARIO
  // ==========================================
  deleteUser(id: string): Observable<void> {
    return this.graphql
      .mutate<{ removeUser: UserGraphql }>(
        `
          mutation RemoveUser($id: String!) {
            removeUser(id: $id) {
              id
            }
          }
        `,
        { id },
      )
      .pipe(map(() => void 0));
  }

  // ==========================================
  // [ PATCH ] - RESTAURAR UN USUARIO INACTIVO
  // ==========================================
  restoreUser(id: string): Observable<void> {
    return this.graphql
      .mutate<{ restoreUser: UserGraphql }>(
        `
          mutation RestoreUser($id: String!) {
            restoreUser(id: $id) {
              id
            }
          }
        `,
        { id },
      )
      .pipe(map(() => void 0));
  }

  private mapUsersPage(page: UsersListResponseGraphql): UsersListResponse {
    return {
      total: page.total,
      items: page.items.map((user) => this.mapUser(user)),
    };
  }

  private mapUser(user: UserGraphql): User {
    return {
      _id: user.id,
      nombre: user.nombre,
      email: user.email,
      estado: user.estado,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      rol: typeof user.rol === 'string' ? user.rol : this.mapRole(user.rol),
    };
  }

  private mapRole(role: RoleGraphql) {
    return {
      _id: role.id,
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado,
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

interface UsersListResponseGraphql {
  items: UserGraphql[];
  total: number;
}

interface UserGraphql {
  id: string;
  nombre: string;
  email: string;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
  rol: RoleGraphql | string;
}

interface RoleGraphql {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: boolean;
  permisos?: PermissionGraphql[];
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
