import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

interface HelpQuickLink {
  label: string;
  route: string;
  icon: string;
  permission?: string;
}

interface HelpSection {
  title: string;
  description: string;
  icon: string;
  bullets: string[];
  permissions?: string[];
}

@Component({
  selector: 'app-help',
  imports: [CommonModule],
  templateUrl: './help.html',
})
export class HelpComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // ==========================================
  // [ ESTADO ] - USUARIO ACTUAL
  // ==========================================
  protected readonly currentUser = this.authService.currentUser;

  // ==========================================
  // [ DATOS DERIVADOS ] - AYUDA SEGUN PERMISOS
  // ==========================================
  private readonly allQuickLinks: HelpQuickLink[] = [
    { label: 'Inicio', route: '/dashboard', icon: 'home' },
    { label: 'Usuarios', route: '/dashboard/users', icon: 'group', permission: 'listar_usuarios' },
    { label: 'Roles', route: '/dashboard/roles', icon: 'security', permission: 'listar_roles' },
    { label: 'Módulos', route: '/dashboard/modules', icon: 'view_module', permission: 'listar_modulos' },
    { label: 'Permisos', route: '/dashboard/permissions', icon: 'vpn_key', permission: 'listar_permisos' },
    { label: 'Notificaciones', route: '/dashboard/notifications', icon: 'notifications' },
    { label: 'Configuración', route: '/dashboard/settings', icon: 'settings' },
    { label: 'Mi cuenta', route: '/dashboard/account', icon: 'person' },
  ];

  private readonly allSections: HelpSection[] = [
    {
      title: 'Inicio y navegación',
      description: 'Ubica los accesos principales del sistema y comprende cómo se organiza el panel lateral.',
      icon: 'dashboard',
      bullets: [
        'El panel lateral muestra solo los módulos autorizados para tu rol actual.',
        'Las notificaciones reflejan eventos relevantes de seguridad y cambios de acceso.',
        'Si un administrador actualiza tu cargo o permisos, el sistema sincroniza tu panel automáticamente.',
      ],
    },
    {
      title: 'Gestión de usuarios',
      description: 'Administra altas, cambios de datos, roles y estado operativo de las cuentas.',
      icon: 'manage_accounts',
      permissions: ['listar_usuarios'],
      bullets: [
        'Consulta nombre, correo, rol y estado de cada usuario en la vista principal.',
        'Si tu rol lo permite, puedes crear cuentas nuevas o editar información existente.',
        'La contraseña de otro usuario solo puede ser cambiada directamente por un administrador.',
      ],
    },
    {
      title: 'Roles y estructura de acceso',
      description: 'Define perfiles operativos y agrupa permisos según responsabilidades del equipo.',
      icon: 'admin_panel_settings',
      permissions: ['listar_roles'],
      bullets: [
        'Cada rol agrupa permisos concretos para simplificar la administración.',
        'Un cambio de rol o permisos afecta en tiempo real a los usuarios conectados.',
        'Si modificas un rol, revisa que los accesos visibles coincidan con el alcance esperado.',
      ],
    },
    {
      title: 'Módulos del sistema',
      description: 'Organiza las unidades funcionales que estructuran permisos y navegación.',
      icon: 'grid_view',
      permissions: ['listar_modulos'],
      bullets: [
        'Los módulos ayudan a ordenar capacidades y permisos dentro del sistema.',
        'Usa nombres claros y descripciones operativas para que el equipo los identifique con facilidad.',
        'Crear o editar módulos impacta la forma en que se clasifican permisos y ayuda contextual.',
      ],
    },
    {
      title: 'Permisos operativos',
      description: 'Controla acciones específicas que un usuario o rol puede ejecutar en cada módulo.',
      icon: 'key',
      permissions: ['listar_permisos'],
      bullets: [
        'Los permisos habilitan acciones puntuales como listar, crear, actualizar o eliminar.',
        'En la edición, el módulo asociado queda bloqueado para mantener trazabilidad.',
        'Conviene usar nombres técnicos consistentes para facilitar auditoría y soporte.',
      ],
    },
    {
      title: 'Seguridad y sesiones',
      description: 'Revisa actividad, sesiones activas y eventos sensibles asociados a tu cuenta.',
      icon: 'shield',
      bullets: [
        'Desde configuración puedes revisar sesiones activas y cerrar accesos que ya no correspondan.',
        'Los cambios de contraseña, revocaciones y accesos recientes se notifican dentro de la plataforma.',
        'Si pierdes acceso a una vista, el sistema muestra una pantalla de permisos insuficientes en lugar de datos vacíos.',
      ],
    },
  ];

  protected readonly quickLinks = computed(() =>
    this.allQuickLinks.filter((link) => !link.permission || this.authService.hasPermission(link.permission)),
  );

  protected readonly sections = computed(() =>
    this.allSections.filter(
      (section) =>
        !section.permissions ||
        section.permissions.every((permission) => this.authService.hasPermission(permission)),
    ),
  );

  protected readonly roleLabel = computed(() => this.currentUser()?.rol ?? 'Usuario');

  // ==========================================
  // [ ACCIONES ] - NAVEGACION
  // ==========================================
  protected navigate(route: string): void {
    void this.router.navigate([route]);
  }
}
