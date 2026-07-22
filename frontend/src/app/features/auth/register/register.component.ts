import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  message = '';
  isError = false;
  loading = false;

  onSubmit(): void {
    this.message = '';
    this.loading = true;

    this.auth.register(this.username, this.email, this.password).subscribe({
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
