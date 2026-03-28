import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ AVATAR ] - IDENTIDAD DE USUARIO                -->
    <!-- ================================================ -->
    <div class="relative inline-block">
      <div
        class="relative overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-50 transition-all duration-300 group-hover:ring-blue-200"
        [class]="sizeClasses()"
      >
        @if (src() && !hasError()) {
          <img
            [src]="src()"
            [alt]="alt()"
            class="h-full w-full object-cover transition-opacity duration-300"
            (error)="onError()"
          />
        } @else {
          <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 font-bold text-slate-600 select-none">
            {{ displayInitials() }}
          </div>
        }
      </div>

      @if (status()) {
        <span
          class="absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-50"
          [class]="statusClasses()"
        ></span>
      }
    </div>
  `,
})
export class AvatarComponent {
  src = input<string | null | undefined>(undefined);
  alt = input<string>('User avatar');
  initials = input<string>('');
  size = input<AvatarSize>('md');
  status = input<UserStatus | undefined>(undefined);

  protected hasError = signal(false);

  protected sizeClasses = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-8 w-8 text-xs';
      case 'md': return 'h-10 w-10 text-sm';
      case 'lg': return 'h-12 w-12 text-base';
      case 'xl': return 'h-16 w-16 text-xl';
      default: return 'h-10 w-10 text-sm';
    }
  });

  protected statusClasses = computed(() => {
    const base = 'h-3 w-3';
    switch (this.status()) {
      case 'online': return `${base} bg-green-500`;
      case 'offline': return `${base} bg-slate-300`;
      case 'busy': return `${base} bg-red-500`;
      case 'away': return `${base} bg-amber-500`;
      default: return '';
    }
  });

  protected displayInitials = computed(() => {
    return (this.initials() || '').substring(0, 2).toUpperCase();
  });

  onError(): void {
    this.hasError.set(true);
  }
}
