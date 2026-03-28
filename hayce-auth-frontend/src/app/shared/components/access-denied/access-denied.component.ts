import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './access-denied.component.html',
})
export class AccessDeniedComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS DE RUTA
  // ==========================================
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // ==========================================
  // [ DATOS DERIVADOS ] - CONTENIDO DE LA VISTA
  // ==========================================
  protected readonly blockedRoute = computed(() => {
    const value = this.route.snapshot.queryParamMap.get('from') ?? '/dashboard';
    return value.replace('/dashboard/', '').replace('/dashboard', 'inicio') || 'inicio';
  });

  protected readonly requiredPermissions = computed(() => {
    const value = this.route.snapshot.queryParamMap.get('permissions') ?? '';
    return value
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean);
  });

  // ==========================================
  // [ ACCIONES ] - NAVEGACION
  // ==========================================
  protected goHome(): void {
    void this.router.navigate(['/dashboard']);
  }

  protected goBack(): void {
    void this.router.navigate(['/dashboard']);
  }
}
