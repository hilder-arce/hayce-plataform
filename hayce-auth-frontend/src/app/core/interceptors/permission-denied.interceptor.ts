import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

export const permissionDeniedInterceptor: HttpInterceptorFn = (req, next) => {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  const router = inject(Router);
  const authService = inject(AuthService);

  // ==========================================
  // [ STREAM REACTIVO ] - REDIRECCION 401/403
  // ==========================================
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.context.get(SKIP_AUTH_REDIRECT) &&
        !router.url.startsWith('/login') &&
        !router.url.startsWith('/forgot-password')
      ) {
        authService.clearSession();
        void router.navigate(['/login']);
      }

      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        !router.url.startsWith('/dashboard/forbidden')
      ) {
        void router.navigate(['/dashboard/forbidden'], {
          queryParams: {
            from: router.url,
          },
        });
      }

      return throwError(() => error);
    }),
  );
};
