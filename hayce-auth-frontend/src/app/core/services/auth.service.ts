import { HttpContext } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';

import { SKIP_AUTH_REDIRECT } from '../interceptors/permission-denied.interceptor';
import {
  AuthUser,
  LoginRequest,
  MessageResponse,
  UserSession,
} from '../models/auth.models';
import { OrganizationItem } from '../models/organization.models';
import { GraphqlApiService } from './graphql-api.service';

const USER_CACHE_KEY = 'hayce_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly graphql = inject(GraphqlApiService);
  private readonly userState = signal<AuthUser | null>(this.restoreUser());
  private sessionValidated = false;
  private sessionCheck$: Observable<boolean> | null = null;

  readonly currentUser = this.userState.asReadonly();

  login(payload: LoginRequest): Observable<AuthUser> {
    return this.graphql
      .mutate<{ login: { status: string } }>(
        `
          mutation Login($input: LoginDto!) {
            login(input: $input) {
              status
            }
          }
        `,
        { input: payload },
      )
      .pipe(switchMap(() => this.me()));
  }

  me(): Observable<AuthUser> {
    return this.fetchMe();
  }

  private fetchMe(skipAuthRedirect = false): Observable<AuthUser> {
    return this.graphql
      .query<{ me: MeGraphql }>(
        `
          query Me {
            me {
              id
              nombre
              email
              rol
              esSuperAdmin
              estado
              createdAt
              organization {
                id
                nombre
                slug
                estado
              }
              ownerAdmin {
                id
                nombre
                email
              }
              permisos {
                modulo
                permisos
              }
            }
          }
        `,
        undefined,
        new HttpContext().set(SKIP_AUTH_REDIRECT, skipAuthRedirect),
      )
      .pipe(
        map((response) => this.mapAuthUser(response.me)),
        tap((user) => {
          this.sessionValidated = true;
          this.setSession(user);
        }),
      );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.graphql
      .mutate<{ forgotPassword: MessageResponse }>(
        `
          mutation ForgotPassword($input: ForgotPasswordDto!) {
            forgotPassword(input: $input) {
              message
              mensaje
            }
          }
        `,
        { input: { email } },
      )
      .pipe(map((response) => response.forgotPassword));
  }

  verifyCode(email: string, codigo: string): Observable<MessageResponse> {
    return this.graphql
      .mutate<{ verifyCode: MessageResponse }>(
        `
          mutation VerifyCode($input: VerifyCodeDto!) {
            verifyCode(input: $input) {
              message
              mensaje
            }
          }
        `,
        { input: { email, codigo } },
      )
      .pipe(map((response) => response.verifyCode));
  }

  resetPassword(email: string, codigo: string, password: string): Observable<MessageResponse> {
    return this.graphql
      .mutate<{ resetPassword: MessageResponse }>(
        `
          mutation ResetPassword($input: ResetPasswordDto!) {
            resetPassword(input: $input) {
              message
              mensaje
            }
          }
        `,
        { input: { email, codigo, password } },
      )
      .pipe(map((response) => response.resetPassword));
  }

  mySessions(): Observable<UserSession[]> {
    return this.graphql
      .query<{ mySessions: Array<{
        id: string;
        dispositivo: string;
        ip: string;
        bloqueado: boolean;
        bloqueadoEn: string | null;
        expiraEn: string;
        estado: boolean;
        createdAt: string;
        updatedAt: string;
      }> }>(
        `
          query MySessions {
            mySessions {
              id
              dispositivo
              ip
              bloqueado
              bloqueadoEn
              expiraEn
              estado
              createdAt
              updatedAt
            }
          }
        `,
      )
      .pipe(map((response) => response.mySessions.map((session) => ({ ...session, _id: session.id }))));
  }

  revokeSession(sessionId: string): Observable<MessageResponse> {
    return this.graphql
      .mutate<{ revokeSession: MessageResponse }>(
        `
          mutation RevokeSession($id: String!) {
            revokeSession(id: $id) {
              message
              mensaje
            }
          }
        `,
        { id: sessionId },
      )
      .pipe(map((response) => response.revokeSession));
  }

  logoutAll(): Observable<MessageResponse> {
    return this.graphql
      .mutate<{ logoutAll: MessageResponse }>(
        `
          mutation LogoutAll {
            logoutAll {
              message
              mensaje
            }
          }
        `,
      )
      .pipe(map((response) => response.logoutAll));
  }

  logout(): Observable<void> {
    return this.graphql
      .mutate<{ logout: MessageResponse }>(
        `
          mutation Logout {
            logout {
              message
              mensaje
            }
          }
        `,
      )
      .pipe(
        map(() => void 0),
        tap(() => this.clearSession()),
        catchError(() => {
          this.clearSession();
          return of(void 0);
        }),
      );
  }

  ensureSession(): Observable<boolean> {
    if (this.sessionValidated && this.userState()) {
      return of(true);
    }

    if (this.sessionCheck$) {
      return this.sessionCheck$;
    }

    this.sessionCheck$ = this.fetchMe(true).pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
      finalize(() => {
        this.sessionCheck$ = null;
      }),
      shareReplay(1),
    );

    return this.sessionCheck$;
  }

  clearSession(): void {
    this.sessionValidated = false;
    this.sessionCheck$ = null;
    this.userState.set(null);
    localStorage.removeItem(USER_CACHE_KEY);
  }

  hasPermission(permission: string): boolean {
    const user = this.userState();
    if (!user) return false;
    if (user.esSuperAdmin) return true;

    return this.getPermissionSet(user).has(permission);
  }

  hasAllPermissions(permissions: string[]): boolean {
    const user = this.userState();
    if (!user) return false;
    if (user.esSuperAdmin) return true;

    const grantedPermissions = this.getPermissionSet(user);
    return permissions.every((permission) => grantedPermissions.has(permission));
  }

  private setSession(user: AuthUser): void {
    this.userState.set(user);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }

  private restoreUser(): AuthUser | null {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as AuthUser;
    } catch {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }
  }

  private getPermissionSet(user: AuthUser): Set<string> {
    const allPermissions = new Set<string>();

    if (user.permisos) {
      Object.values(user.permisos).forEach((perms) => {
        if (Array.isArray(perms)) {
          perms.forEach((permission) => allPermissions.add(permission));
        }
      });
    }

    return allPermissions;
  }

  private mapAuthUser(user: MeGraphql): AuthUser {
    return {
      id: user.id,
      _id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      esSuperAdmin: user.esSuperAdmin,
      estado: user.estado,
      createdAt: user.createdAt,
      organization: user.organization
        ? this.mapOrganization(user.organization)
        : null,
      ownerAdmin: user.ownerAdmin
        ? {
            _id: user.ownerAdmin.id,
            nombre: user.ownerAdmin.nombre,
            email: user.ownerAdmin.email,
          }
        : null,
      permisos: Object.fromEntries(
        (user.permisos ?? []).map((group) => [group.modulo, group.permisos]),
      ),
    };
  }

  private mapOrganization(organization: {
    id: string;
    nombre: string;
    slug: string;
    estado: boolean;
  }): OrganizationItem {
    return {
      _id: organization.id,
      nombre: organization.nombre,
      slug: organization.slug,
      estado: organization.estado,
    };
  }
}

interface MeGraphql {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  esSuperAdmin: boolean;
  estado: boolean;
  createdAt: string;
  organization?: {
    id: string;
    nombre: string;
    slug: string;
    estado: boolean;
  } | null;
  ownerAdmin?: {
    id: string;
    nombre: string;
    email?: string;
  } | null;
  permisos: Array<{ modulo: string; permisos: string[] }>;
}
