import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  password = '';
  confirmPassword = '';
  message = '';
  isError = false;
  loading = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    this.message = '';

    if (this.password !== this.confirmPassword) {
      this.isError = true;
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.token) {
      this.isError = true;
      this.message = 'Token de restablecimiento no válido.';
      return;
    }

    this.loading = true;

    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.isError = false;
        this.message = res.message || 'Contraseña restablecida exitosamente.';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.isError = true;
        this.message = err.error?.message || 'Error al restablecer la contraseña.';
      },
    });
  }
}
