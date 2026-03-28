import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white' | 'accent' | 'danger';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ SPINNER ] - CARGA REUTILIZABLE                 -->
    <!-- ================================================ -->
    <div
      role="status"
      class="inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
      [class]="sizeClasses()"
      [style.color]="colorStyle()"
    >
      <span class="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class SpinnerComponent {
  size = input<SpinnerSize>('md');
  color = input<SpinnerColor>('primary');

  protected sizeClasses = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-4 w-4 border-2';
      case 'md': return 'h-6 w-6 border-[3px]';
      case 'lg': return 'h-8 w-8 border-4';
      default: return 'h-6 w-6 border-[3px]';
    }
  });

  protected colorStyle = computed(() => {
    switch (this.color()) {
      case 'primary': return 'var(--color-accent)';
      case 'white': return '#ffffff';
      case 'accent': return 'var(--color-accent-strong)';
      case 'danger': return 'var(--color-danger)';
      default: return 'var(--color-accent)';
    }
  });
}
