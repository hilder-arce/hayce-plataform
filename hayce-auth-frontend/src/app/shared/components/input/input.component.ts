import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ INPUT ] - CAMPO REUTILIZABLE                   -->
    <!-- ================================================ -->
    <div class="w-full">
      @if (label()) {
        <label [for]="id()" class="mb-1.5 block text-sm font-medium text-slate-700">
          {{ label() }}
        </label>
      }

      <div class="group relative">
        @if (icon()) {
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <i class="icon text-lg">{{ icon() }}</i>
          </div>
        }

        <input
          [id]="id()"
          [type]="currentType()"
          [placeholder]="placeholder()"
          [value]="value()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          class="block w-full rounded-xl border bg-white p-2.5 text-sm text-slate-900 outline-none transition-colors duration-200"
          [class.pl-10]="icon()"
          [class.pr-10]="type() === 'password'"
          [class.border-slate-200]="!error()"
          [class.focus:border-blue-500]="!error()"
          [class.focus:ring-2]="true"
          [class.focus:ring-blue-100]="!error()"
          [class.border-orange-400]="error()"
          [class.focus:border-orange-500]="error()"
          [class.focus:ring-orange-100]="error()"
          [class.cursor-not-allowed]="disabled()"
          [class.opacity-50]="disabled()"
        />

        @if (type() === 'password') {
          <button
            type="button"
            (click)="togglePassword()"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-slate-700"
          >
            <i class="icon text-lg">{{ showPassword() ? 'visibility_off' : 'visibility' }}</i>
          </button>
        }
      </div>

      @if (error()) {
        <p class="mt-1.5 flex items-center gap-1 text-xs text-orange-500">
          <i class="icon text-[1.1em]">error</i>
          {{ error() }}
        </p>
      } @else if (hint()) {
        <p class="mt-1.5 text-xs text-slate-500">{{ hint() }}</p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  // ==========================================
  // [ ESTADO PUBLICO ] - INPUTS
  // ==========================================
  label = input<string>('');
  placeholder = input<string>('');
  type = input<string>('text');
  hint = input<string>('');
  error = input<string | null>(null);
  icon = input<string>('');

  // ==========================================
  // [ ESTADO ] - VALOR Y VISIBILIDAD
  // ==========================================
  protected id = signal(`input-${Math.random().toString(36).substr(2, 9)}`);
  protected value = signal('');
  protected disabled = signal(false);
  protected showPassword = signal(false);

  protected currentType = computed(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }

    return this.type();
  });

  // ==========================================
  // [ CONTROL VALUE ACCESSOR ] - CONTRATO
  // ==========================================
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS INTERNOS
  // ==========================================
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }
}
