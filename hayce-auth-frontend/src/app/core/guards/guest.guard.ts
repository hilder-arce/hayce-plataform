import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  const authService = inject(AuthService);
  const router = inject(Router);

  // ==========================================
  // [ STREAM REACTIVO ] - REDIRECCION DE INVITADOS
  // ==========================================
  return authService
    .ensureSession()
    .pipe(map((isAuthenticated) => (isAuthenticated ? router.createUrlTree(['/dashboard']) : true)));
};
