import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="id()" class="mb-1.5 block text-sm font-medium text-slate-700">
          {{ label() }}
        </label>
      }

      <div class="relative">
        <select
          [id]="id()"
          [value]="value()"
          [disabled]="disabled()"
          (change)="onSelect($event)"
          (blur)="onBlur()"
          class="block w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition"
          [class.border-slate-200]="!error()"
          [class.focus:border-blue-500]="!error()"
          [class.focus:ring-2]="true"
          [class.focus:ring-blue-100]="!error()"
          [class.border-orange-400]="error()"
          [class.focus:border-orange-500]="error()"
          [class.focus:ring-orange-100]="error()"
          [class.cursor-not-allowed]="disabled()"
          [class.opacity-50]="disabled()"
        >
          <option [value]="''" [disabled]="placeholderDisabled()">
            {{ placeholder() }}
          </option>

          @for (option of options(); track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>

        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <i class="icon text-lg">expand_more</i>
        </div>
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
export class SelectComponent implements ControlValueAccessor {
  label = input<string>('');
  placeholder = input<string>('Selecciona una opcion');
  hint = input<string>('');
  error = input<string | null>(null);
  options = input<SelectOption[]>([]);
  placeholderDisabled = input<boolean>(true);

  protected id = signal(`select-${Math.random().toString(36).slice(2, 11)}`);
  protected value = signal('');
  protected disabled = signal(false);

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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

  protected onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
