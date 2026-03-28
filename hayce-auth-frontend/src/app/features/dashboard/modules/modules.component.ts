import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModulesService } from '../../../core/services/modules.service';
import { AppModuleItem } from '../../../core/models/module.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './modules.component.html',
})
export class ModulesComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly modulesService = inject(ModulesService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);

  // ==========================================
  // [ ESTADO ] - SIGNALS DE UI
  // ==========================================
  protected readonly modules = signal<AppModuleItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly showInactive = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly modulePendingId = signal<string | null>(null);

  // ==========================================
  // [ PERMISOS ] - CAPACIDADES DISPONIBLES
  // ==========================================
  protected readonly canCreate = this.authService.hasPermission('crear_modulo');
  protected readonly canUpdate = this.authService.hasPermission('actualizar_modulo');
  protected readonly canDelete = this.authService.hasPermission('eliminar_modulo');
  protected readonly canRestore = this.authService.hasPermission('eliminar_modulo');

  // ==========================================
  // [ STREAM REACTIVO ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ DATOS DERIVADOS ] - FILTRO DE MODULOS
  // ==========================================
  protected readonly filteredModules = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.modules();
    }

    return this.modules().filter(
      (item) =>
        item.nombre.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term),
    );
  });

  ngOnInit(): void {
    this.loadModules();
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  protected loadModules(): void {
    this.loading.set(true);
    this.modulesService
      .getModules(this.showInactive())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (modules) => this.modules.set(modules),
        error: () => this.alertService.show('No se pudieron cargar los modulos.', 'error'),
      });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected onToggleInactive(): void {
    this.showInactive.update((value) => !value);
    this.loadModules();
  }

  protected confirmDelete(module: AppModuleItem): void {
    this.alertService.confirm(`Deseas desactivar el modulo "${module.nombre}"?`, () => {
      this.modulePendingId.set(module._id);
      this.modulesService
        .deleteModule(module._id)
        .pipe(finalize(() => this.modulePendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Modulo desactivado correctamente.', 'success');
            this.loadModules();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo desactivar el modulo.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  protected confirmRestore(module: AppModuleItem): void {
    this.alertService.confirm(`Deseas restaurar el modulo "${module.nombre}"?`, () => {
      this.modulePendingId.set(module._id);
      this.modulesService
        .restoreModule(module._id)
        .pipe(finalize(() => this.modulePendingId.set(null)))
        .subscribe({
          next: () => {
            this.alertService.show('Modulo restaurado correctamente.', 'success');
            this.loadModules();
          },
          error: (error: HttpErrorResponse) => {
            const message = error.error?.message || 'No se pudo restaurar el modulo.';
            this.alertService.show(message, 'error');
          },
        });
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
}
