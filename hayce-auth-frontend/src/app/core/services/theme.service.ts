import { Injectable, signal } from '@angular/core';

type ThemeMode = 'device' | 'light' | 'dark';

const THEME_KEY = 'hayce_theme_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly modeState = signal<ThemeMode>(this.readMode());

  readonly mode = this.modeState.asReadonly();

  init(): void {
    this.applyTheme(this.modeState());
    this.mediaQuery.addEventListener('change', () => {
      if (this.modeState() === 'device') {
        this.applyTheme('device');
      }
    });
  }

  setMode(mode: ThemeMode): void {
    this.modeState.set(mode);
    localStorage.setItem(THEME_KEY, mode);
    this.applyTheme(mode);
  }

  private readMode(): ThemeMode {
    const mode = localStorage.getItem(THEME_KEY);
    return mode === 'light' || mode === 'dark' || mode === 'device' ? mode : 'device';
  }

  private applyTheme(mode: ThemeMode): void {
    const useDark = mode === 'dark' || (mode === 'device' && this.mediaQuery.matches);
    document.documentElement.classList.toggle('dark', useDark);
    document.documentElement.setAttribute('data-theme', mode);
  }
}
