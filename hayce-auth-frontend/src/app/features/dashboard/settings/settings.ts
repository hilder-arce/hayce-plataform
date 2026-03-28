import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, firstValueFrom, Subscription } from 'rxjs';

import { UserSession } from '../../../core/models/auth.models';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ButtonComponent, CardComponent, SpinnerComponent],
  templateUrl: './settings.html',
})
export class SettingsComponent implements OnInit, OnDestroy {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private sessionsSub?: Subscription;

  // ==========================================
  // [ ESTADO ] - SESIONES Y CARGA
  // ==========================================
  protected readonly sessions = signal<UserSession[]>([]);
  protected readonly loading = signal(false);
  protected readonly revokingId = signal<string | null>(null);

  // ==========================================
  // [ CICLO DE VIDA ] - SINCRONIA DE SESIONES
  // ==========================================
  ngOnInit(): void {
    this.loadSessions();

    this.sessionsSub = this.notificationsService.updateSessions$.subscribe(() => {
      this.loadSessions();
    });
  }

  ngOnDestroy(): void {
    this.sessionsSub?.unsubscribe();
  }

  // ==========================================
  // [ ACCIONES ] - CARGA Y CIERRE DE SESIONES
  // ==========================================
  protected loadSessions(): void {
    this.loading.set(true);

    firstValueFrom(this.authService.mySessions())
      .then((sessions) => {
        this.sessions.set(sessions);
      })
      .finally(() => this.loading.set(false));
  }

  protected revokeSession(sessionId: string): void {
    this.revokingId.set(sessionId);
    this.authService
      .revokeSession(sessionId)
      .pipe(finalize(() => this.revokingId.set(null)))
      .subscribe({
        next: () => {
          this.sessions.update((list) =>
            list.filter((session) => session._id !== sessionId && session.id !== sessionId),
          );
        },
      });
  }

  protected logoutAll(): void {
    this.alertService.confirm(
      'Esta acción cerrará todas las sesiones activas. ¿Deseas continuar?',
      () => {
        this.loading.set(true);
        this.authService
          .logoutAll()
          .pipe(finalize(() => this.loading.set(false)))
          .subscribe({
            next: () => {
              this.authService.clearSession();
              void this.router.navigate(['/login']);
            },
          });
      },
    );
  }

  protected getDeviceName(session: UserSession): string {
    return this.summarizeDevice(session.dispositivo);
  }

  protected getDeviceMeta(session: UserSession): string {
    return [session.ip ? `IP ${session.ip}` : '', `Inicio ${this.formatDate(session.createdAt)}`]
      .filter(Boolean)
      .join(' · ');
  }

  protected getSessionIcon(session: UserSession): string {
    const device = session.dispositivo.toLowerCase();

    if (device.includes('android') || device.includes('iphone') || device.includes('mobile')) {
      return 'smartphone';
    }

    return 'laptop_mac';
  }

  // ==========================================
  // [ PRIVADO ] - FORMATEO DE DISPOSITIVOS
  // ==========================================
  private summarizeDevice(device?: string): string {
    if (!device) return 'Dispositivo no identificado';

    const normalized = device.toLowerCase();
    const browser = this.detectBrowser(normalized);
    const os = this.detectOs(normalized);

    return [browser, os ? `en ${os}` : ''].filter(Boolean).join(' ');
  }

  private detectBrowser(device: string): string {
    if (device.includes('edg/')) return 'Microsoft Edge';
    if (device.includes('opr/') || device.includes('opera')) return 'Opera';
    if (device.includes('chrome/')) return 'Google Chrome';
    if (device.includes('firefox/')) return 'Mozilla Firefox';
    if (device.includes('safari/') && !device.includes('chrome/')) return 'Safari';
    return 'Navegador web';
  }

  private detectOs(device: string): string {
    if (device.includes('windows')) return 'Windows';
    if (device.includes('android')) return 'Android';
    if (device.includes('iphone') || device.includes('ipad') || device.includes('ios')) return 'iOS';
    if (device.includes('mac os') || device.includes('macintosh')) return 'macOS';
    if (device.includes('linux')) return 'Linux';
    return '';
  }

  private formatDate(value: string): string {
    const date = new Date(value);

    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }
}
