import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, BettingEvent, Bet } from '../models';

@Injectable({ providedIn: 'root' })
export class BettingService {
  private readonly api = inject(ApiService);

  getEvents(status = 'active'): Observable<ApiResponse<BettingEvent[]>> {
    return this.api.get<BettingEvent[]>('/api/events', { status });
  }

  createEvent(event: {
    title: string;
    eventDate?: string | null;
    oddsHome: number;
    oddsAway: number;
    oddsDraw: number;
  }): Observable<ApiResponse<BettingEvent>> {
    return this.api.post<BettingEvent>('/api/events', event);
  }

  updateEvent(
    id: number,
    event: Partial<{ title: string; eventDate: string | null; oddsHome: number; oddsAway: number; oddsDraw: number }>
  ): Observable<ApiResponse<BettingEvent>> {
    return this.api.put<BettingEvent>(`/api/events/${id}`, event);
  }

  deleteEvent(id: number): Observable<ApiResponse<unknown>> {
    return this.api.delete(`/api/events/${id}`);
  }

  resolveEvent(id: number, winner: string): Observable<ApiResponse<BettingEvent>> {
    return this.api.post<BettingEvent>(`/api/events/${id}/resolve`, { winner });
  }

  placeBet(eventId: number, amount: number, prediction: string): Observable<ApiResponse<Bet>> {
    return this.api.post<Bet>('/api/bets', { eventId, amount, prediction });
  }

  getBetHistory(): Observable<ApiResponse<Bet[]>> {
    return this.api.get<Bet[]>('/api/bets/history');
  }

  updateBet(id: number, data: Partial<Bet>): Observable<ApiResponse<Bet>> {
    return this.api.put<Bet>(`/api/bets/${id}`, data);
  }

  deleteBet(id: number): Observable<ApiResponse<unknown>> {
    return this.api.delete(`/api/bets/${id}`);
  }
}
