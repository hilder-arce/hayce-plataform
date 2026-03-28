import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ ALERT ] - MENSAJE CONTEXTUAL                   -->
    <!-- ================================================ -->
    <div
      role="alert"
      class="relative flex items-start gap-3 rounded-2xl border p-4 transition-all duration-300 animate-slide-in-right"
      [class]="alertClasses()"
    >
      <div class="shrink-0">
        <i class="icon text-xl">{{ iconName() }}</i>
      </div>

      <div class="flex-1 text-sm">
        @if (title()) {
          <h5 class="mb-1 font-semibold leading-none tracking-tight">{{ title() }}</h5>
        }
        @if (message()) {
          <p class="leading-relaxed opacity-90">{{ message() }}</p>
        } @else {
          <div class="leading-relaxed opacity-90">
            <ng-content></ng-content>
          </div>
        }
      </div>

      @if (dismissible()) {
        <button
          (click)="dismiss()"
          class="-mr-1 -mt-1 shrink-0 rounded-md p-1 transition-colors hover:bg-black/10 focus:ring-2 focus:ring-current focus:ring-offset-1 focus:ring-offset-transparent"
          aria-label="Dismiss"
        >
          <i class="icon">close</i>
        </button>
      }
    </div>
  `,
})
export class AlertComponent {
  variant = input<AlertVariant>('info');
  title = input<string | undefined>(undefined);
  message = input<string | undefined>(undefined);
  dismissible = input<boolean>(false);
  icon = input<string | undefined>(undefined);

  onDismiss = output<void>();

  protected alertClasses = computed(() => {
    switch (this.variant()) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-700';
    }
  });

  protected iconName = computed(() => {
    if (this.icon()) return this.icon();
    switch (this.variant()) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  });

  dismiss(): void {
    this.onDismiss.emit();
  }
}
