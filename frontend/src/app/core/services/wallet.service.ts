import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  recharge(amount: number): Observable<ApiResponse<{ balance: number }>> {
    return this.api.post<{ balance: number }>('/api/wallet/recharge', { amount }).pipe(
      tap((res) => {
        if (res.success && res.data?.balance !== undefined) {
          this.auth.updateBalance(res.data.balance);
        }
      })
    );
  }
}
