import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!password || !confirmPassword) {
    return null;
  }
  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly registerForm = this.fb.nonNullable.group(
    {
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(72),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  message = '';
  isError = false;
  loading = false;
  submitted = false;

  get f() {
    return this.registerForm.controls;
  }

  fieldInvalid(controlName: keyof typeof this.f): boolean {
    const control = this.f[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  passwordsMismatchVisible(): boolean {
    return (
      !!this.registerForm.hasError('passwordsMismatch') &&
      (this.f.confirmPassword.touched || this.submitted)
    );
  }

  onSubmit(): void {
    this.submitted = true;
    this.message = '';
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      this.isError = true;
      this.message = 'Corrige los errores del formulario antes de continuar.';
      return;
    }

    const { username, email, password } = this.registerForm.getRawValue();
    this.loading = true;

    this.auth.register(username, email, password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.isError = false;
          this.message = '¡Felicidades! Cuenta creada exitosamente. Redirigiendo...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.isError = true;
          this.message = res.message || 'Error al completar el registro.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        const errors = err.error?.errors;
        this.message = errors
          ? errors.map((e: { message: string }) => e.message).join(' | ')
          : err.error?.message || 'Error al completar el registro.';
      },
    });
  }
}
