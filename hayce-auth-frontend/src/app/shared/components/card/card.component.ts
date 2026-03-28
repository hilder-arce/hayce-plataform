import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ CARD ] - SUPERFICIE REUTILIZABLE               -->
    <!-- ================================================ -->
    <div class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      @if (title() || subtitle()) {
        <div class="border-b border-slate-200 px-6 pb-4 pt-6">
          @if (title()) {
            <h3 class="mb-1 text-lg font-semibold text-slate-900">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="text-sm text-slate-500">{{ subtitle() }}</p>
          }
          <ng-content select="[header-actions]"></ng-content>
        </div>
      }

      <div [class]="bodyClasses()">
        <ng-content></ng-content>
      </div>

      <div class="empty:hidden flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent {
  title = input<string | undefined>(undefined);
  subtitle = input<string | undefined>(undefined);
  noPadding = input<boolean>(false);

  protected bodyClasses = computed(() => {
    return this.noPadding() ? '' : 'p-6';
  });
}
