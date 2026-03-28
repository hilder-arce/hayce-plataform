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
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

type EmailFormGroup = FormGroup<{
  email: FormControl<string>;
}>;

type VerifyFormGroup = FormGroup<{
  codigo: FormControl<string>;
}>;

type ResetFormGroup = FormGroup<{
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==========================================
  // [ ESTADO ] - FLUJO DE RECUPERACION
  // ==========================================
  protected step = 1;
  protected loading = false;
  protected submitted = false;
  protected errorMessage = '';
  protected infoMessage = '';

  protected readonly emailForm: EmailFormGroup = this.formBuilder.nonNullable.group({
    // Correo de recuperacion: requerido y con formato valido
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly verifyForm: VerifyFormGroup = this.formBuilder.nonNullable.group({
    // Codigo recibido por el usuario: requerido y de 6 digitos
    codigo: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  protected readonly resetForm: ResetFormGroup = this.formBuilder.nonNullable.group({
    // Nueva contrasena: requerida y minimo 8 caracteres
    password: ['', [Validators.required, Validators.minLength(8)]],
    // Confirmacion de la nueva contrasena
    confirmPassword: ['', [Validators.required]],
  });

  // ==========================================
  // [ DATOS DERIVADOS ] - VALIDACIONES POR PASO
  // ==========================================
  protected isEmailInvalid(): boolean {
    const control = this.emailForm.controls.email;
    return control.invalid && (control.touched || this.submitted);
  }

  protected getEmailError(): string {
    const { email } = this.emailForm.controls;
    if (email.hasError('required')) return 'El correo electrónico es obligatorio.';
    if (email.hasError('email')) return 'Ingresa un formato de correo válido.';
    return '';
  }

  protected isCodigoInvalid(): boolean {
    const control = this.verifyForm.controls.codigo;
    return control.invalid && (control.touched || this.submitted);
  }

  protected getCodigoError(): string {
    const { codigo } = this.verifyForm.controls;
    if (codigo.hasError('required')) return 'El código de verificación es obligatorio.';
    if (codigo.hasError('minlength') || codigo.hasError('maxlength')) {
      return 'El código debe tener 6 dígitos.';
    }
    return '';
  }

  protected isPasswordInvalid(field: 'password' | 'confirmPassword'): boolean {
    const control = this.resetForm.controls[field];
    return control.invalid && (control.touched || this.submitted);
  }

  protected getPasswordError(): string {
    const { password } = this.resetForm.controls;
    if (password.hasError('required')) return 'La nueva contraseña es obligatoria.';
    if (password.hasError('minlength')) return 'Debe tener al menos 8 caracteres.';
    return '';
  }

  protected getConfirmPasswordError(): string {
    const { confirmPassword } = this.resetForm.controls;
    if (confirmPassword.hasError('required')) return 'Debes confirmar la contraseña.';
    return '';
  }

  // ==========================================
  // [ ACCIONES ] - ENVIO POR PASOS
  // ==========================================
  protected submitEmail(): void {
    this.submitted = true;
    if (this.emailForm.invalid || this.loading) return;

    this.errorMessage = '';
    this.infoMessage = '';
    this.loading = true;

    const email = this.emailForm.getRawValue().email;

    this.authService
      .forgotPassword(email)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.infoMessage = this.resolveInfoMessage(response);
          this.step = 2;
          this.submitted = false;
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  protected submitCode(): void {
    this.submitted = true;
    if (this.verifyForm.invalid || this.loading) return;

    this.errorMessage = '';
    this.infoMessage = '';
    this.loading = true;

    const email = this.emailForm.getRawValue().email;
    const codigo = this.verifyForm.getRawValue().codigo;

    this.authService
      .verifyCode(email, codigo)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.infoMessage = this.resolveInfoMessage(response);
          this.step = 3;
          this.submitted = false;
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  protected submitPassword(): void {
    this.submitted = true;
    if (this.resetForm.invalid || this.loading) return;

    const { password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.errorMessage = '';
    this.infoMessage = '';
    this.loading = true;

    const email = this.emailForm.getRawValue().email;
    const codigo = this.verifyForm.getRawValue().codigo;

    this.authService
      .resetPassword(email, codigo, password)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.infoMessage = this.resolveInfoMessage(response);
          this.cdr.detectChanges();
          setTimeout(() => void this.router.navigate(['/login']), 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  protected goToStep(step: number): void {
    this.step = step;
    this.submitted = false;
    this.errorMessage = '';
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
  private extractMessage(error: HttpErrorResponse): string {
    const backendMessage = (error.error?.message || error.error?.mensaje) as
      | string
      | string[]
      | undefined;
    return Array.isArray(backendMessage)
      ? backendMessage.join(' ')
      : backendMessage || 'No fue posible completar la solicitud.';
  }

  private resolveInfoMessage(response: { message?: string; mensaje?: string }): string {
    return response.message || response.mensaje || 'Operación completada correctamente.';
  }
}
