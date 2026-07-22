import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);

  email = '';
  message = '';
  isError = false;
  loading = false;

  onSubmit(): void {
    this.message = '';
    this.loading = true;

    this.auth.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.isError = false;
        this.message = res.message || 'Si el correo está registrado, recibirás un enlace.';
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = err.error?.message || 'Error al procesar la solicitud.';
      },
    });
  }
}
