import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { HayceLogoComponent } from '../../components/hayce-logo/hayce-logo.component';
import { CardComponent } from '../../components/card/card.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, HayceLogoComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ================================================ -->
    <!-- [ AUTH LAYOUT ] - CONTENEDOR DE AUTENTICACION    -->
    <!-- ================================================ -->
    <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <div class="w-full max-w-[28rem]">
        <!-- ================================================ -->
        <!-- [ BRAND ] - IDENTIDAD DEL SISTEMA                -->
        <!-- ================================================ -->
        <div class="mb-6 flex justify-center">
          <a routerLink="/login" class="inline-flex items-center">
            <app-hayce-logo />
          </a>
        </div>

        <!-- ================================================ -->
        <!-- [ SURFACE ] - TARJETA DEL FORMULARIO             -->
        <!-- ================================================ -->
        <app-card>
          <router-outlet />
        </app-card>

        <!-- ================================================ -->
        <!-- [ FOOTER ] - INFORMACION LEGAL                   -->
        <!-- ================================================ -->
        <footer class="mt-5 text-center text-xs text-slate-500">
          <p>&copy; {{ year }} HAYCE. Acceso institucional seguro.</p>
        </footer>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  // ==========================================
  // [ DATOS DERIVADOS ] - FECHA ACTUAL
  // ==========================================
  protected readonly year = new Date().getFullYear();
}
