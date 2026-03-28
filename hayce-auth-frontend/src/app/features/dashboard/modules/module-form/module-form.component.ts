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
import { EMPTY, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AlertService } from '../../../../core/services/alert.service';
import { ModulesService } from '../../../../core/services/modules.service';
import {
  AppModuleItem,
  CreateModulePayload,
  UpdateModulePayload,
} from '../../../../core/models/module.models';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

type ModuleFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
}>;

@Component({
  selector: 'app-module-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonComponent,
    CardComponent,
    InputComponent,
    SpinnerComponent,
  ],
  templateUrl: './module-form.component.html',
})
export class ModuleFormComponent implements OnInit {
  // ==========================================
  // [ DEPENDENCIAS ] - SERVICIOS INYECTADOS
  // ==========================================
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modulesService = inject(ModulesService);
  private readonly alertService = inject(AlertService);

  // ==========================================
  // [ ESTADO ] - FORMULARIO Y SIGNALS
  // ==========================================
  protected readonly loading = signal(true);
  protected readonly isEditMode = signal(false);
  protected moduleId: string | null = null;

  protected readonly moduleForm: ModuleFormGroup = this.fb.nonNullable.group({
    // Nombre visible del modulo: requerido y minimo 3 caracteres
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    // Descripcion funcional: requerida y minimo 10 caracteres
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
  });

  // ==========================================
  // [ PERMISOS ] - NO APLICA EN ESTE COMPONENTE
  // ==========================================

  // ==========================================
  // [ STREAM REACTIVO ] - CARGA INICIAL
  // ==========================================
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params): Observable<AppModuleItem> => {
          this.moduleId = params.get('id');
          if (!this.moduleId) {
            this.loading.set(false);
            return EMPTY;
          }

          this.isEditMode.set(true);
          return this.modulesService.getModuleById(this.moduleId);
        }),
      )
      .subscribe({
        next: (module) => {
          this.moduleForm.patchValue({
            nombre: module.nombre,
            descripcion: module.descripcion,
          });
          this.loading.set(false);
        },
        error: () => {
          this.alertService.show('No se pudo cargar el modulo solicitado.', 'error');
          void this.router.navigate(['/dashboard/modules']);
        },
      });
  }

  // ==========================================
  // [ DATOS DERIVADOS ] - MENSAJES DE ERROR
  // ==========================================
  protected getFieldError(field: keyof ModuleFormGroup['controls']): string | null {
    const control = this.moduleForm.controls[field];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (field === 'nombre') {
      if (control.hasError('required')) {
        return 'El nombre del modulo es obligatorio.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 3 caracteres.';
      }
    }

    if (field === 'descripcion') {
      if (control.hasError('required')) {
        return 'La descripcion es obligatoria.';
      }
      if (control.hasError('minlength')) {
        return 'Debe tener al menos 10 caracteres.';
      }
    }

    return null;
  }

  // ==========================================
  // [ ACCIONES ] - ENVIO DEL FORMULARIO
  // ==========================================
  protected onSubmit(): void {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.moduleForm.getRawValue();
    const request: Observable<AppModuleItem> = this.isEditMode()
      ? this.modulesService.updateModule(this.moduleId!, payload as UpdateModulePayload)
      : this.modulesService.createModule(payload as CreateModulePayload);

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.alertService.show(
          `Modulo ${this.isEditMode() ? 'actualizado' : 'creado'} correctamente.`,
          'success',
        );
        void this.router.navigate(['/dashboard/modules']);
      },
      error: (error: HttpErrorResponse) => {
        const message =
          error.error?.message || `No se pudo ${this.isEditMode() ? 'actualizar' : 'crear'} el modulo.`;
        this.alertService.show(message, 'error');
      },
    });
  }

  // ==========================================
  // [ PRIVADO ] - HELPERS INTERNOS
  // ==========================================
}
