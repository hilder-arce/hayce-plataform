import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { AlertService } from './core/services/alert.service';
import { ThemeService } from './core/services/theme.service';
import { AlertComponent } from './shared/components/alert/alert.component';
import { ButtonComponent } from './shared/components/button/button.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AlertComponent, ButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly themeService = inject(ThemeService);
  private readonly alertService = inject(AlertService);

  // ==========================================
  // [ ESTADO ] - ALERTAS Y CONFIRMACIONES
  // ==========================================
  protected readonly alerts = toSignal(this.alertService.alerts$, { initialValue: [] });
  protected readonly confirmDialog = toSignal(this.alertService.confirm$, { initialValue: null });

  ngOnInit(): void {
    this.themeService.init();
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI GLOBAL
  // ==========================================
  protected dismissAlert(id: number): void {
    this.alertService.dismiss(id);
  }

  protected resolveConfirm(confirmed: boolean): void {
    this.alertService.resolveConfirm(confirmed);
  }
}
