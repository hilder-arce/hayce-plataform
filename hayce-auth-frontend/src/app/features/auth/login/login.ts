import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';

type LoginFormGroup = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
  remember: FormControl<boolean>;
}>;

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    InputComponent,
  ],
  templateUrl: './login.html',
})
export class LoginComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==========================================
  // [ ESTADO ] - FORMULARIO Y UI
  // ==========================================
  protected showPassword = false;
  protected isSubmitting = false;
  protected submitted = false;
  protected loginError = '';

  protected readonly loginForm: LoginFormGroup = this.formBuilder.nonNullable.group({
    // Correo institucional: requerido y con formato valido
    email: ['', [Validators.required, Validators.email]],
    // Contrasena de acceso: requerida y minimo 6 caracteres
    password: ['', [Validators.required, Validators.minLength(6)]],
    // Persistencia local de sesion
    remember: [true],
  });

  // ==========================================
  // [ DATOS DERIVADOS ] - ERRORES DE VALIDACION
  // ==========================================
  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  protected isFieldInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  protected getEmailError(): string {
    const { email } = this.loginForm.controls;
    if (email.hasError('required')) return 'El correo es obligatorio.';
    if (email.hasError('email')) return 'Ingresa un correo válido.';
    return '';
  }

  protected getPasswordError(): string {
    const { password } = this.loginForm.controls;
    if (password.hasError('required')) return 'La contraseña es obligatoria.';
    if (password.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres.';
    return '';
  }

  // ==========================================
  // [ ACCIONES ] - ENVIO DEL FORMULARIO
  // ==========================================
  protected submit(): void {
    this.submitted = true;
    this.loginError = '';

    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService
      .login({
        email,
        password,
        dispositivo: navigator.userAgent,
        ubicacion: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          const backendMessage = (error.error?.message || error.error?.mensaje) as
            | string
            | string[]
            | undefined;
          this.loginError = Array.isArray(backendMessage)
            ? backendMessage.join(' ')
            : backendMessage || 'No se pudo iniciar sesión. Verifica tu conexión.';
          this.cdr.detectChanges();
        },
      });
  }
}
