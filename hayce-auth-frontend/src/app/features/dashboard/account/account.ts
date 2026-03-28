import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, effect, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';

type AccountEditMode = 'none' | 'profile' | 'password';

type ProfileFormGroup = FormGroup<{
  nombre: FormControl<string>;
  email: FormControl<string>;
}>;

type PasswordFormGroup = FormGroup<{
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

interface ProfileSnapshot {
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, CardComponent, InputComponent],
  templateUrl: './account.html',
})
export class AccountComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==========================================
  // [ ESTADO ] - USUARIO, FORMULARIOS Y UI
  // ==========================================
  protected readonly user = this.authService.currentUser;
  protected readonly editMode = signal<AccountEditMode>('none');

  protected profileForm!: ProfileFormGroup;
  protected passwordForm!: PasswordFormGroup;

  protected readonly loadingProfile = signal(false);
  protected readonly loadingPassword = signal(false);

  protected submittedProfile = false;
  protected submittedPassword = false;
  protected profileError = '';
  protected passwordError = '';

  private initialProfileValue: ProfileSnapshot = {
    nombre: '',
    email: '',
  };

  constructor() {
    // ==========================================
    // [ STREAM REACTIVO ] - SINCRONIA DE PERFIL
    // ==========================================
    effect(() => {
      const currentUser = this.user();
      if (currentUser && this.editMode() === 'none') {
        this.profileForm?.patchValue(
          {
            nombre: currentUser.nombre ?? '',
            email: currentUser.email ?? '',
          },
          { emitEvent: false },
        );
        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // [ CICLO DE VIDA ] - INICIALIZACION
  // ==========================================
  ngOnInit(): void {
    this.initForms();
  }

  // ==========================================
  // [ VALIDACIONES ] - ERRORES DE CAMPOS
  // ==========================================
  protected isProfileFieldInvalid(controlName: keyof ProfileSnapshot): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.submittedProfile);
  }

  protected isPasswordFieldInvalid(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
    const control = this.passwordForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.submittedPassword);
  }

  protected getNombreError(): string {
    const control = this.profileForm.controls.nombre;
    if (control.hasError('required')) return 'El nombre es obligatorio.';
    if (control.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres.';
    return '';
  }

  protected getPasswordFieldError(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.passwordForm.controls[controlName];
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (controlName === 'confirmPassword' && this.passwordForm.hasError('mismatch')) {
      return 'Las contraseñas no coinciden.';
    }
    return '';
  }

  // ==========================================
  // [ ACCIONES ] - FLUJOS DE EDICION
  // ==========================================
  protected enableProfileEdit(): void {
    this.editMode.set('profile');
    this.initialProfileValue = this.profileForm.getRawValue();
    this.profileForm.controls.nombre.enable();
    this.passwordForm.disable();
    this.submittedProfile = false;
    this.profileError = '';
    this.cdr.detectChanges();
  }

  protected enablePasswordEdit(): void {
    this.editMode.set('password');
    this.passwordForm.enable();
    this.profileForm.disable();
    this.passwordForm.reset();
    this.submittedPassword = false;
    this.passwordError = '';
    this.cdr.detectChanges();
  }

  protected cancelEdit(): void {
    const currentUser = this.user();
    this.editMode.set('none');

    this.profileForm.patchValue({
      nombre: currentUser?.nombre ?? '',
      email: currentUser?.email ?? '',
    });
    this.profileForm.disable();

    this.passwordForm.reset();
    this.passwordForm.disable();

    this.submittedProfile = false;
    this.submittedPassword = false;
    this.profileError = '';
    this.passwordError = '';
    this.cdr.detectChanges();
  }

  protected hasProfileChanged(): boolean {
    if (this.editMode() !== 'profile') {
      return false;
    }

    const currentValues = this.profileForm.getRawValue();
    return currentValues.nombre !== this.initialProfileValue.nombre;
  }

  protected updateProfile(): void {
    this.submittedProfile = true;
    this.profileError = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    if (!this.hasProfileChanged()) {
      this.cancelEdit();
      return;
    }

    this.loadingProfile.set(true);
    this.cdr.detectChanges();

    this.usersService
      .updateMe(this.profileForm.getRawValue())
      .pipe(
        finalize(() => {
          this.loadingProfile.set(false);
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success('¡Perfil actualizado con éxito!');
          this.authService.me().subscribe(() => {
            this.cancelEdit();
          });
        },
        error: (error: HttpErrorResponse) => {
          const backendMessage = (error.error?.message || error.error?.mensaje) as string | string[] | undefined;
          this.profileError = Array.isArray(backendMessage)
            ? backendMessage.join(' ')
            : backendMessage || 'No se pudo actualizar el perfil.';
          this.cdr.detectChanges();
        },
      });
  }

  protected updatePassword(): void {
    this.submittedPassword = true;
    this.passwordError = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.loadingPassword.set(true);
    this.cdr.detectChanges();

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();

    this.usersService
      .changeMyPassword({
        passwordActual: currentPassword,
        passwordNuevo: newPassword,
      })
      .pipe(
        finalize(() => {
          this.loadingPassword.set(false);
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.alertService.success('Contraseña actualizada correctamente.');
          this.cancelEdit();
        },
        error: (error: HttpErrorResponse) => {
          const backendMessage = (error.error?.message || error.error?.mensaje) as string | string[] | undefined;
          this.passwordError = Array.isArray(backendMessage)
            ? backendMessage.join(' ')
            : backendMessage || 'Error al cambiar la contraseña.';
          this.cdr.detectChanges();
        },
      });
  }

  // ==========================================
  // [ PRIVADO ] - CREACION DE FORMULARIOS
  // ==========================================
  private initForms(): void {
    const currentUser = this.user();

    this.profileForm = this.fb.nonNullable.group({
      nombre: this.fb.nonNullable.control(
        { value: currentUser?.nombre ?? '', disabled: true },
        [Validators.required, Validators.minLength(3)],
      ),
      email: this.fb.nonNullable.control({ value: currentUser?.email ?? '', disabled: true }),
    });

    this.passwordForm = this.fb.nonNullable.group(
      {
        currentPassword: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required]),
        newPassword: this.fb.nonNullable.control({ value: '', disabled: true }, [
          Validators.required,
          Validators.minLength(6),
        ]),
        confirmPassword: this.fb.nonNullable.control({ value: '', disabled: true }, [Validators.required]),
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private passwordMatchValidator(control: AbstractControl): { mismatch: true } | null {
    const group = control as PasswordFormGroup;
    const newPassword = group.controls.newPassword?.value;
    const confirmPassword = group.controls.confirmPassword?.value;

    return newPassword === confirmPassword ? null : { mismatch: true };
  }
}
