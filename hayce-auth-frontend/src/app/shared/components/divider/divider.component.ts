import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <!-- ================================================ -->
      <!-- [ DIVIDER ] - SEPARADOR CON ETIQUETA             -->
      <!-- ================================================ -->
      <div class="my-6 flex w-full items-center">
        <div class="grow border-t" [class]="borderClasses()"></div>
        <span class="mx-4 shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500">
          {{ label() }}
        </span>
        <div class="grow border-t" [class]="borderClasses()"></div>
      </div>
    } @else {
      <!-- ================================================ -->
      <!-- [ DIVIDER ] - SEPARADOR SIMPLE                   -->
      <!-- ================================================ -->
      <div role="separator" [class]="separatorClasses()"></div>
    }
  `,
})
export class DividerComponent {
  label = input<string | undefined>(undefined);
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  color = input<'subtle' | 'strong'>('subtle');

  protected borderClasses = computed(() => {
    return this.color() === 'strong' ? 'border-slate-300' : 'border-slate-200';
  });

  protected separatorClasses = computed(() => {
    const colorClass = this.color() === 'strong' ? 'bg-slate-300' : 'bg-slate-200';

    if (this.orientation() === 'vertical') {
      return `mx-2 h-full w-px ${colorClass}`;
    }

    return `my-4 h-px w-full ${colorClass}`;
  });
}
