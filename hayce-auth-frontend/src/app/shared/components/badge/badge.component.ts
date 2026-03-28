import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'accent';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ BADGE ] - ESTADO SEMANTICO                     -->
    <!-- ================================================ -->
    <span [class]="badgeClasses()">
      @if (icon()) {
        <i class="icon -ml-0.5 mr-1.5 text-[1.1em]">{{ icon() }}</i>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }
  `],
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
  icon = input<string | undefined>(undefined);

  protected badgeClasses = computed(() => {
    const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200';

    const variants = {
      default: 'border-slate-200 bg-slate-100 text-slate-700',
      success: 'border-green-200 bg-green-50 text-green-600',
      warning: 'border-amber-200 bg-amber-50 text-amber-700',
      destructive: 'border-red-200 bg-red-50 text-red-600',
      info: 'border-sky-200 bg-sky-50 text-sky-600',
      accent: 'border-blue-200 bg-blue-50 text-blue-600',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
