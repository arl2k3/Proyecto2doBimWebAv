import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, BlackjackGame, MinesGame } from '../models';

@Injectable({ providedIn: 'root' })
export class CasinoService {
  private readonly api = inject(ApiService);

  // Blackjack
  blackjackStart(bet: number): Observable<ApiResponse<BlackjackGame>> {
    return this.api.post<BlackjackGame>('/api/blackjack/start', { bet });
  }

  blackjackHit(): Observable<ApiResponse<BlackjackGame>> {
    return this.api.post<BlackjackGame>('/api/blackjack/hit');
  }

  blackjackStand(): Observable<ApiResponse<BlackjackGame>> {
    return this.api.post<BlackjackGame>('/api/blackjack/stand');
  }

  blackjackDouble(): Observable<ApiResponse<BlackjackGame>> {
    return this.api.post<BlackjackGame>('/api/blackjack/double');
  }

  blackjackSplit(): Observable<ApiResponse<BlackjackGame>> {
    return this.api.post<BlackjackGame>('/api/blackjack/split');
  }

  blackjackActive(): Observable<ApiResponse<BlackjackGame | null>> {
    return this.api.get<BlackjackGame | null>('/api/blackjack/active');
  }

  blackjackHistory(): Observable<ApiResponse<BlackjackGame[]>> {
    return this.api.get<BlackjackGame[]>('/api/blackjack/history');
  }

  // Mines
  minesStart(bet: number, minesCount: number): Observable<ApiResponse<MinesGame>> {
    return this.api.post<MinesGame>('/api/mines/start', { bet, minesCount });
  }

  minesReveal(cellIndex: number): Observable<ApiResponse<MinesGame & { hitMine?: boolean }>> {
    return this.api.post<MinesGame & { hitMine?: boolean }>('/api/mines/reveal', { cellIndex });
  }

  minesCashout(): Observable<ApiResponse<MinesGame>> {
    return this.api.post<MinesGame>('/api/mines/cashout');
  }

  minesActive(): Observable<ApiResponse<MinesGame | null>> {
    return this.api.get<MinesGame | null>('/api/mines/active');
  }

  minesHistory(): Observable<ApiResponse<MinesGame[]>> {
    return this.api.get<MinesGame[]>('/api/mines/history');
  }
}
