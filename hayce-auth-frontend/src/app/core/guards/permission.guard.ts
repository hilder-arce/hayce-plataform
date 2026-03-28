import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

function normalizePermissions(route: ActivatedRouteSnapshot): string[] {
  const permissions = route.data['permissions'];

  if (Array.isArray(permissions)) {
    return permissions.filter(
      (permission): permission is string => typeof permission === 'string' && permission.trim().length > 0,
    );
  }

  if (typeof permissions === 'string' && permissions.trim().length > 0) {
    return [permissions];
  }

  return [];
}

export const permissionGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  const authService = inject(AuthService);
  const router = inject(Router);

  // ==========================================
  // [ DATOS DERIVADOS ] - NORMALIZACION DE PERMISOS
  // ==========================================
  const requiredPermissions = normalizePermissions(route);
  if (requiredPermissions.length === 0) {
    return true;
  }

  // ==========================================
  // [ ACCIONES ] - EVALUACION DE ACCESO
  // ==========================================
  if (authService.hasAllPermissions(requiredPermissions)) {
    return true;
  }

  return router.createUrlTree(['/dashboard/forbidden'], {
    queryParams: {
      from: state.url,
      permissions: requiredPermissions.join(','),
    },
  });
};
