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
                ...UserFields
              }
            }
          }

          fragment UserFields on User {
            id
            nombre
            email
            estado
            esSuperAdmin
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
            rol {
              id
              nombre
              descripcion
              estado
              organization {
                id
                nombre
                slug
                estado
              }
            }
          }
        `,
        { page, limit, search },
      )
      .pipe(map((response) => this.mapUsersPage(response[operation] ?? { items: [], total: 0 })));
  }

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
              esSuperAdmin
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
              rol {
                id
                nombre
                descripcion
                estado
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
          }
        `,
        { id },
      )
      .pipe(map((response) => this.mapUser(response.user)));
  }

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
              esSuperAdmin
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
              esSuperAdmin
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
              esSuperAdmin
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

  changePassword(id: string, data: UserPasswordPayload): Observable<void> {
    void id;
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
      esSuperAdmin: user.esSuperAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organization: user.organization
        ? {
            _id: user.organization.id,
            nombre: user.organization.nombre,
            slug: user.organization.slug,
            estado: user.organization.estado,
          }
        : null,
      createdBy: user.createdBy
        ? {
            _id: user.createdBy.id,
            nombre: user.createdBy.nombre,
            email: user.createdBy.email,
          }
        : null,
      ownerAdmin: user.ownerAdmin
        ? {
            _id: user.ownerAdmin.id,
            nombre: user.ownerAdmin.nombre,
            email: user.ownerAdmin.email,
          }
        : null,
      rol: typeof user.rol === 'string' ? user.rol : this.mapRole(user.rol),
    };
  }

  private mapRole(role: RoleGraphql) {
    return {
      _id: role.id,
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado,
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

interface UsersListResponseGraphql {
  items: UserGraphql[];
  total: number;
}

interface UserGraphql {
  id: string;
  nombre: string;
  email: string;
  estado: boolean;
  esSuperAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
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
  rol: RoleGraphql | string;
}

interface RoleGraphql {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: boolean;
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
