import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { LoginComponent } from './features/auth/login/login';
import { AccountComponent } from './features/dashboard/account/account';
import { HelpComponent } from './features/dashboard/help/help';
import { DashboardHomeComponent } from './features/dashboard/home/dashboard-home';
import { NotificationsComponent } from './features/dashboard/notifications/notifications';
import { SettingsComponent } from './features/dashboard/settings/settings';
import { DashboardShellComponent } from './features/dashboard/shell/dashboard-shell';
import { AccessDeniedComponent } from './shared/components/access-denied/access-denied.component';
import { NotFoundComponent } from './shared/components/not-found/not-found';

export const routes: Routes = [
  // ==========================================
  // [ RUTAS PUBLICAS ] - NO REQUIEREN AUTENTICACION
  // ==========================================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard],
  },

  // ==========================================
  // [ RUTAS PROTEGIDAS ] - REQUIEREN AUTHGUARD
  // ==========================================
  {
    path: 'dashboard',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      // ==========================================
      // [ RUTAS DEL DASHBOARD ] - LAYOUT CON SIDEBAR
      // ==========================================
      {
        path: '',
        component: DashboardHomeComponent,
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
      },
      {
        path: 'account',
        component: AccountComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'help',
        component: HelpComponent,
      },
      {
        path: 'forbidden',
        component: AccessDeniedComponent,
      },
      {
        path: 'users',
        loadComponent: () => import('./features/dashboard/users/users.component').then((m) => m.UsersComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_usuarios'] },
      },
      {
        path: 'users/new',
        loadComponent: () => import('./features/dashboard/users/user-form/user-form.component').then((m) => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_usuario', 'listar_roles'] },
      },
      {
        path: 'users/edit/:id',
        loadComponent: () => import('./features/dashboard/users/user-form/user-form.component').then((m) => m.UserFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_usuario', 'listar_usuarios', 'listar_roles'] },
      },
      {
        path: 'modules',
        loadComponent: () => import('./features/dashboard/modules/modules.component').then((m) => m.ModulesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_modulos'] },
      },
      {
        path: 'modules/new',
        loadComponent: () => import('./features/dashboard/modules/module-form/module-form.component').then((m) => m.ModuleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_modulo'] },
      },
      {
        path: 'modules/edit/:id',
        loadComponent: () => import('./features/dashboard/modules/module-form/module-form.component').then((m) => m.ModuleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_modulo', 'listar_modulos'] },
      },
      {
        path: 'permissions',
        loadComponent: () => import('./features/dashboard/permissions/permissions.component').then((m) => m.PermissionsComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_permisos'] },
      },
      {
        path: 'permissions/new',
        loadComponent: () => import('./features/dashboard/permissions/permission-form/permission-form.component').then((m) => m.PermissionFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_permiso', 'listar_modulos'] },
      },
      {
        path: 'permissions/edit/:id',
        loadComponent: () => import('./features/dashboard/permissions/permission-form/permission-form.component').then((m) => m.PermissionFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_permisos', 'listar_permisos', 'listar_modulos'] },
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/dashboard/roles/roles.component').then((m) => m.RolesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_roles'] },
      },
      {
        path: 'roles/new',
        loadComponent: () => import('./features/dashboard/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_rol', 'listar_permisos'] },
      },
      {
        path: 'roles/edit/:id',
        loadComponent: () => import('./features/dashboard/roles/role-form/role-form.component').then((m) => m.RoleFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_rol', 'listar_roles', 'listar_permisos'] },
      },
      {
        path: 'stations',
        loadComponent: () => import('./features/dashboard/stations/stations.component').then((m) => m.StationsComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_estaciones'] },
      },
      {
        path: 'stations/new',
        loadComponent: () => import('./features/dashboard/stations/station-form/station-form.component').then((m) => m.StationFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_estacion'] },
      },
      {
        path: 'stations/edit/:id',
        loadComponent: () => import('./features/dashboard/stations/station-form/station-form.component').then((m) => m.StationFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_estacion', 'listar_estaciones'] },
      },
      {
        path: 'activities',
        loadComponent: () => import('./features/dashboard/activities/activities.component').then((m) => m.ActivitiesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_actividades'] },
      },
      {
        path: 'activities/new',
        loadComponent: () => import('./features/dashboard/activities/activity-form/activity-form.component').then((m) => m.ActivityFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_actividad', 'listar_estaciones'] },
      },
      {
        path: 'activities/edit/:id',
        loadComponent: () => import('./features/dashboard/activities/activity-form/activity-form.component').then((m) => m.ActivityFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_actividad', 'listar_actividades', 'listar_estaciones'] },
      },
      {
        path: 'workers',
        loadComponent: () => import('./features/dashboard/workers/workers.component').then((m) => m.WorkersComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_trabajadores'] },
      },
      {
        path: 'workers/new',
        loadComponent: () => import('./features/dashboard/workers/worker-form/worker-form.component').then((m) => m.WorkerFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_trabajador'] },
      },
      {
        path: 'tareos',
        loadComponent: () => import('./features/dashboard/tareos/tareos.component').then((m) => m.TareosComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['listar_tareos'] },
      },
      {
        path: 'tareos/new',
        loadComponent: () => import('./features/dashboard/tareos/tareo-form/tareo-form.component').then((m) => m.TareoFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['crear_tareo'] },
      },
      {
        path: 'tareos/edit/:id',
        loadComponent: () => import('./features/dashboard/tareos/tareo-form/tareo-form.component').then((m) => m.TareoFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['actualizar_tareo', 'listar_tareos'] },
      },
      ],
      },

      // ==========================================
      // [ RUTA FALLBACK ] - 404
      // ==========================================
      {
      path: '404',
      component: NotFoundComponent,
      },
      {
      path: '**',
      redirectTo: '404',
      },
      ];
