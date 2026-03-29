import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RoleCelebrationService } from '../../../core/services/role-celebration.service';

interface QuickAction {
  label: string;
  icon: string;
  hint: string;
  route: string;
  requiredPermission?: string;
  colorClass: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
}

@Component({
  selector: 'app-dashboard-home',
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
})
export class DashboardHomeComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly roleCelebrationService = inject(RoleCelebrationService);

  // ==========================================
  // [ ESTADO ] - SESION Y ACCESOS RAPIDOS
  // ==========================================
  protected readonly currentUser = this.authService.currentUser;
  protected readonly roleCelebration = this.roleCelebrationService.message;
  protected readonly today = new Date();

  protected loadingProfile = true;
  protected quickActions: QuickAction[] = [];

  // ==========================================
  // [ CICLO DE VIDA ] - CARGA DE PERFIL
  // ==========================================
  ngOnInit(): void {
    const currentUser = this.currentUser();
    if (currentUser) {
      this.quickActions = this.buildQuickActions();
      this.loadingProfile = false;
      return;
    }

    this.authService
      .ensureSession()
      .pipe(finalize(() => (this.loadingProfile = false)))
      .subscribe({
        next: (isAuthenticated) => {
          if (!isAuthenticated) {
            this.authService.clearSession();
            void this.router.navigate(['/login']);
            return;
          }

          this.quickActions = this.buildQuickActions();
        },
        error: () => {
          this.authService.clearSession();
          void this.router.navigate(['/login']);
        },
      });
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  protected goTo(route: string): void {
    void this.router.navigate([route]);
  }

  protected dismissRoleCelebration(): void {
    this.roleCelebrationService.clear();
  }

  protected getTodayLabel(): string {
    return new Intl.DateTimeFormat('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(this.today);
  }

  protected getGreeting(): string {
    const hour = this.today.getHours();
    
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // ==========================================
  // [ PRIVADO ] - CONFIGURACION DE ACCESOS
  // ==========================================
  private buildQuickActions(): QuickAction[] {
    const baseActions: QuickAction[] = [
      {
        label: 'Mi Perfil',
        icon: 'account_circle',
        hint: 'Actualizar datos personales y configuración de la cuenta.',
        route: '/dashboard/account',
        colorClass: 'gray',
      },
      {
        label: 'Crear Rol',
        icon: 'group_add',
        hint: 'Definir un nuevo esquema de acceso para la operación.',
        route: '/dashboard/roles/new',
        requiredPermission: 'crear_rol',
        colorClass: 'red',
      },
      {
        label: 'Crear Usuario',
        icon: 'person_add',
        hint: 'Registrar una nueva cuenta de acceso en la plataforma.',
        route: '/dashboard/users/new',
        requiredPermission: 'crear_usuario',
        colorClass: 'purple',
      },
      {
        label: 'Crear Módulo',
        icon: 'app_registration',
        hint: 'Incorporar un nuevo componente funcional al sistema.',
        route: '/dashboard/modules/new',
        requiredPermission: 'crear_modulo',
        colorClass: 'blue',
      },
      {
        label: 'Crear Permiso',
        icon: 'vpn_key',
        hint: 'Registrar una nueva capacidad operativa o restricción.',
        route: '/dashboard/permissions/new',
        requiredPermission: 'crear_permiso',
        colorClass: 'green',
      },
    ];

    return baseActions.filter(
      (action) => !action.requiredPermission || this.authService.hasPermission(action.requiredPermission),
    );
  }
}
