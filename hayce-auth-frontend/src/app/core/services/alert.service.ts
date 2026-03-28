import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AppAlertItem {
  id: number;
  type: AlertType;
  title: string;
  message: string;
  icon: string;
  duration: number;
}

export interface AppConfirmDialog {
  id: number;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  // ==========================================
  // [ ESTADO ] - STREAMS REACTIVOS GLOBALES
  // ==========================================
  private readonly alertsSubject = new BehaviorSubject<AppAlertItem[]>([]);
  private readonly confirmSubject = new BehaviorSubject<AppConfirmDialog | null>(null);
  private alertSequence = 0;
  private confirmSequence = 0;

  readonly alerts$ = this.alertsSubject.asObservable();
  readonly confirm$ = this.confirmSubject.asObservable();

  // ==========================================
  // [ ACCIONES ] - ATAJOS DE ALERTA
  // ==========================================
  success(message: string, duration = 3000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000): void {
    this.show(message, 'error', duration);
  }

  // ==========================================
  // [ ALERTAS ] - TOASTS REACTIVOS
  // ==========================================
  show(message: string, type: AlertType, duration = 3000): void {
    const alertId = ++this.alertSequence;
    const alert: AppAlertItem = {
      id: alertId,
      type,
      title: this.getHeading(type),
      message,
      icon: this.getIcon(type),
      duration,
    };

    this.alertsSubject.next([...this.alertsSubject.value, alert]);

    window.setTimeout(() => {
      this.dismiss(alertId);
    }, duration);
  }

  dismiss(id: number): void {
    this.alertsSubject.next(this.alertsSubject.value.filter((item) => item.id !== id));
  }

  // ==========================================
  // [ CONFIRMACION ] - DIALOGO REACTIVO
  // ==========================================
  confirm(message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.confirmSubject.next({
      id: ++this.confirmSequence,
      title: 'Confirmación',
      message,
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      onConfirm,
      onCancel,
    });
  }

  resolveConfirm(confirmed: boolean): void {
    const dialog = this.confirmSubject.value;
    if (!dialog) {
      return;
    }

    this.confirmSubject.next(null);

    if (confirmed) {
      dialog.onConfirm();
      return;
    }

    dialog.onCancel?.();
  }

  // ==========================================
  // [ PRIVADO ] - METADATOS DE ALERTA
  // ==========================================
  private getHeading(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'Operación completada';
      case 'error':
        return 'No se pudo completar la acción';
      case 'warning':
        return 'Sesión finalizada';
      case 'info':
      default:
        return 'Información del sistema';
    }
  }

  private getIcon(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'shield';
      case 'info':
      default:
        return 'info';
    }
  }
}
