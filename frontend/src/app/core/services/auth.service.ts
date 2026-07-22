import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';
import { User, ApiResponse } from '../models';

const TOKEN_KEY = 'betzone_token';
const USER_KEY = 'betzone_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(this.loadStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getToken());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private persistSession(user: User, token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  register(username: string, email: string, password: string): Observable<ApiResponse<User>> {
    return this.api.post<User>('/api/auth/register', { username, email, password });
  }

  login(email: string, password: string): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.api.post<{ user: User; token: string }>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.persistSession(res.data.user, res.data.token);
        }
      })
    );
  }

  logout(): Observable<ApiResponse<unknown>> {
    return this.api.post('/api/auth/logout').pipe(
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        this.clearSession();
        this.router.navigate(['/login']);
        return of({ success: true, data: null });
      })
    );
  }

  getMe(): Observable<User | null> {
    return this.api.get<{ user: User }>('/api/auth/me').pipe(
      tap((res) => {
        if (res.success && res.data?.user) {
          const user = res.data.user;
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUserSignal.set(user);
        }
      }),
      map((res) => res.data?.user ?? null),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<unknown>> {
    return this.api.post('/api/auth/forgot-password', { email });
  }

  resetPassword(token: string, password: string): Observable<ApiResponse<unknown>> {
    return this.api.post('/api/auth/reset-password', { token, password });
  }

  updateBalance(balance: number): void {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, balance };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      this.currentUserSignal.set(updated);
    }
  }
}
