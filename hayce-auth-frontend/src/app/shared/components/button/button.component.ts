import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SpinnerComponent } from '../spinner/spinner.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'hero';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.block]': 'fullWidth()',
    '[class.inline-block]': '!fullWidth()',
    '[class.w-full]': 'fullWidth()',
    '[class.w-fit]': '!fullWidth()',
  },
  template: `
    <!-- ================================================ -->
    <!-- [ BUTTON ] - ACCION REUTILIZABLE                 -->
    <!-- ================================================ -->
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="containerClasses()"
      (click)="onClick.emit($event)"
    >
      @if (loading()) {
        <span class="flex items-center justify-center gap-2">
          <app-spinner [size]="spinnerSize()" [color]="spinnerColor()" />
          <span class="leading-none">
            <ng-content></ng-content>
          </span>
        </span>
      } @else {
        <span class="flex items-center justify-center gap-2">
          @if (icon()) {
            <i class="icon text-[1.1em]">{{ icon() }}</i>
          }
          <ng-content></ng-content>
        </span>
      }
    </button>
  `,
  styles: [``],
})
export class ButtonComponent {

  
  // ==========================================
  // [ ESTADO PUBLICO ] - INPUTS Y OUTPUTS
  // ==========================================
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  icon = input<string | undefined>(undefined);

  onClick = output<MouseEvent>();

  // ==========================================
  // [ DATOS DERIVADOS ] - CLASES Y SPINNER
  // ==========================================
  protected containerClasses = computed(() => {
    const base =
      'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm',
      secondary: 'border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      outline: 'border border-slate-300 bg-white text-slate-900 hover:border-blue-500 hover:text-blue-600',
      hero: 'bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_52%,#60a5fa_100%)] text-white shadow-[0_14px_30px_-14px_rgba(37,99,235,0.85)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-16px_rgba(37,99,235,0.9)] active:translate-y-0',
    };

    const sizes = {
      sm: 'rounded-lg px-3 py-1.5 text-xs',
      md: 'rounded-xl px-4 py-2 text-sm',
      lg: 'min-h-14 rounded-2xl px-6 py-3 text-base',
    };

    const width = this.fullWidth() ? 'w-full' : '';

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]} ${width}`;
  });

  protected spinnerSize = computed(() => {
    return this.size() === 'lg' ? 'md' : 'sm';
  });

  protected spinnerColor = computed(() => {
    if (this.variant() === 'primary' || this.variant() === 'destructive' || this.variant() === 'hero') {
      return 'white';
    }

    return 'primary';
  });
}
