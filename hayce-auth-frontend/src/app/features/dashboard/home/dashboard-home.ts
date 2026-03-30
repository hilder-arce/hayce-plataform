import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RoleCelebrationService } from '../../../core/services/role-celebration.service';

interface QuickAction {
  key:
    | 'profile'
    | 'create-role'
    | 'create-user'
    | 'create-module'
    | 'create-permission'
    | 'create-organization'
    | 'create-station'
    | 'create-activity'
    | 'create-worker'
    | 'create-tareo';
  label: string;
  icon: string;
  hint: string;
  route: string;
  requiredPermissions?: string[];
  superAdminOnly?: boolean;
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
        key: 'create-tareo',
        label: 'Crear Tareo',
        icon: 'fact_check',
        hint: 'Generar un nuevo tareo para el control operativo del equipo.',
        route: '/dashboard/tareos/new',
        requiredPermissions: ['crear_tareo'],
        colorClass: 'purple',
      },
      {
        key: 'create-activity',
        label: 'Crear Actividad',
        icon: 'playlist_add',
        hint: 'Configurar una nueva actividad y vincularla con sus estaciones.',
        route: '/dashboard/activities/new',
        requiredPermissions: ['crear_actividad', 'listar_estaciones'],
        colorClass: 'blue',
      },
      {
        key: 'create-station',
        label: 'Crear Estación',
        icon: 'add_location_alt',
        hint: 'Registrar una estación operativa dentro de la estructura activa.',
        route: '/dashboard/stations/new',
        requiredPermissions: ['crear_estacion'],
        colorClass: 'orange',
      },
      {
        key: 'create-worker',
        label: 'Crear Trabajador',
        icon: 'badge',
        hint: 'Registrar un nuevo trabajador para la operación diaria.',
        route: '/dashboard/workers/new',
        requiredPermissions: ['crear_trabajador'],
        colorClass: 'green',
      },
      {
        key: 'create-user',
        label: 'Crear Usuario',
        icon: 'person_add',
        hint: 'Registrar una nueva cuenta de acceso en la plataforma.',
        route: '/dashboard/users/new',
        requiredPermissions: ['crear_usuario', 'listar_roles'],
        colorClass: 'purple',
      },
      {
        key: 'create-role',
        label: 'Crear Rol',
        icon: 'group_add',
        hint: 'Definir un nuevo esquema de acceso para la operación.',
        route: '/dashboard/roles/new',
        requiredPermissions: ['crear_rol', 'listar_permisos'],
        colorClass: 'red',
      },
      {
        key: 'create-module',
        label: 'Crear Módulo',
        icon: 'app_registration',
        hint: 'Incorporar un nuevo componente funcional al sistema.',
        route: '/dashboard/modules/new',
        requiredPermissions: ['crear_modulo'],
        colorClass: 'blue',
      },
      {
        key: 'create-permission',
        label: 'Crear Permiso',
        icon: 'vpn_key',
        hint: 'Registrar una nueva capacidad operativa o restricción.',
        route: '/dashboard/permissions/new',
        requiredPermissions: ['crear_permiso', 'listar_modulos'],
        colorClass: 'green',
      },
      {
        key: 'create-organization',
        label: 'Crear Organización',
        icon: 'domain_add',
        hint: 'Crear una nueva organización y preparar su espacio de trabajo.',
        route: '/dashboard/organizations/new',
        superAdminOnly: true,
        colorClass: 'orange',
      },
      {
        key: 'profile',
        label: 'Mi Perfil',
        icon: 'account_circle',
        hint: 'Actualizar datos personales y configuración de la cuenta.',
        route: '/dashboard/account',
        colorClass: 'gray',
      },
    ];

    const currentUser = this.currentUser();
    if (currentUser?.esSuperAdmin) {
      const allowedActions = new Set<QuickAction['key']>([
        'profile',
        'create-user',
        'create-role',
        'create-module',
        'create-permission',
        'create-organization',
      ]);

      return baseActions.filter((action) => allowedActions.has(action.key));
    }

    return baseActions.filter((action) => {
      if (action.superAdminOnly) {
        return false;
      }

      return (
        !action.requiredPermissions ||
        this.authService.hasAllPermissions(action.requiredPermissions)
      );
    });
  }
}
