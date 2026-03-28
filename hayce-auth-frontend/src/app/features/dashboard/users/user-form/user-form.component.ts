import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RolesService } from '../../../../core/services/roles.service';
import { UsersService } from '../../../../core/services/users.service';
import { Role } from '../../../../core/models/role.models';
import { User, UserFormData } from '../../../../core/models/user.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type UserFormGroup = FormGroup<{
  nombre: FormControl<string>;
  email: FormControl<string>;
  rol: FormControl<string>;
  password: FormControl<string>;
  adminPassword: FormControl<string>;
}>;

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);
  private readonly rolesService = inject(RolesService);

  // ==========================================
  // [ ESTADO ] - FORMULARIO Y SIGNALS
  // ==========================================
  protected userForm: UserFormGroup;
  protected loading = signal(true);
  protected isEditMode = signal(false);
  protected userId: string | null = null;
  protected roles = signal<Role[]>([]);
  protected readonly currentUser = this.authService.currentUser;

  constructor() {
    this.userForm = this.fb.nonNullable.group({
      // Backend: requerido, string, sin longitud minima declarada
      nombre: ['', [Validators.required]],
      // Backend: requerido y email valido
      email: ['', [Validators.required, Validators.email]],
      // Backend: requerido y MongoId
      rol: ['', Validators.required],
      // Backend create: requerido y minimo 6
      password: ['', [Validators.required, Validators.minLength(6)]],
      // Backend admin-change-password: opcional en edicion, minimo 6 si se usa
      adminPassword: ['', [Validators.minLength(6)]],
    });
  }

  // ==========================================
  // [ PERMISOS ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ STREAM REACTIVO ] - CARGA INICIAL SEGUN RUTA
  // ==========================================
  ngOnInit(): void {
    this.loadRoles();

    this.route.paramMap
      .pipe(
        switchMap((params): Observable<User> => {
          this.userId = params.get('id');
          if (this.userId) {
            this.isEditMode.set(true);
            this.setupEditMode();
            return this.usersService.getUserById(this.userId);
          }

          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe({
        next: (user) => {
          this.userForm.patchValue({
            nombre: user.nombre,
            email: user.email,
            rol: typeof user.rol === 'object' ? user.rol._id : user.rol,
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('Error al cargar los datos del usuario.', 'error');
          void this.router.navigate(['/dashboard/users']);
        },
      });
  }

  // ==========================================
  // [ DATOS DERIVADOS ] - MENSAJES DE VALIDACION
  // ==========================================
  protected getFieldError(field: keyof UserFormGroup['controls']): string | null {
    const control = this.userForm.controls[field];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (field === 'nombre' && control.hasError('required')) {
      return 'El nombre es obligatorio.';
    }

    if (field === 'email') {
      if (control.hasError('required')) {
        return 'El correo es obligatorio.';
      }
      if (control.hasError('email')) {
        return 'Ingresa un correo valido.';
      }
    }

    if (field === 'rol' && control.hasError('required')) {
      return 'Debes seleccionar un rol valido.';
    }

    if (field === 'password') {
      if (control.hasError('required')) {
        return 'La contrasena es obligatoria.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 6 caracteres.';
      }
    }

    if (field === 'adminPassword' && control.hasError('minlength')) {
      return 'La nueva contrasena debe tener al menos 6 caracteres.';
    }

    return null;
  }

  protected roleFieldHasError(): boolean {
    const control = this.userForm.controls.rol;
    return control.touched && control.invalid;
  }

  protected passwordHint(): string {
    return this.isEditMode()
      ? 'La contrasena no se edita desde este formulario.'
      : '';
  }

  protected canAdminChangePassword(): boolean {
    return this.currentUser()?.rol === 'Administrador';
  }

  // ==========================================
  // [ ACCIONES ] - EVENTOS DE UI
  // ==========================================
  setupEditMode(): void {
    this.userForm.controls.password.reset('');
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.controls.adminPassword.reset('');
    this.userForm.controls.adminPassword.updateValueAndValidity();
  }

  loadRoles(): void {
    this.rolesService.getRoles().subscribe((roles: Role[]) => this.roles.set(roles));
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const rawValue = this.userForm.getRawValue();
    const operation: Observable<unknown> = this.isEditMode()
      ? this.usersService
          .updateUser(this.userId!, {
            nombre: rawValue.nombre,
            email: rawValue.email,
            rol: rawValue.rol,
          })
          .pipe(
            switchMap(() => {
              const adminPassword = rawValue.adminPassword?.trim();
              if (!adminPassword || !this.canAdminChangePassword()) {
                return of(null);
              }

              return this.usersService.adminChangePassword(this.userId!, adminPassword);
            }),
          )
      : this.usersService.createUser({
          nombre: rawValue.nombre,
          email: rawValue.email,
          rol: rawValue.rol,
          password: rawValue.password,
        });

    operation.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          this.isEditMode()
            ? rawValue.adminPassword?.trim()
              ? 'Usuario actualizado y contrasena renovada con exito.'
              : 'Usuario actualizado con exito.'
            : 'Usuario creado con exito.',
          'success',
        );
        void this.router.navigate(['/dashboard/users']);
      },
      error: (err: HttpErrorResponse) => {
        const message =
          err?.error?.message || `Error al ${this.isEditMode() ? 'actualizar' : 'crear'} el usuario.`;
        this.alertService.show(message, 'error');
      },
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
}
