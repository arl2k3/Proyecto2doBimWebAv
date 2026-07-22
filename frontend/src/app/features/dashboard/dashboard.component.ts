import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { BettingService } from '../../core/services/betting.service';
import { WalletService } from '../../core/services/wallet.service';
import { BettingEvent, Bet } from '../../core/models';

interface DateParts {
  day: number | null;
  month: number | null;
  year: number | null;
  hour: number | null;
  minute: number | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterLink, FormsModule, DecimalPipe, DatePipe, UpperCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly betting = inject(BettingService);
  private readonly wallet = inject(WalletService);

  readonly user = this.auth.currentUser;
  readonly isAdmin = this.auth.isAdmin;

  events: BettingEvent[] = [];
  bets: Bet[] = [];
  statusFilter = 'active';
  loadingEvents = false;
  eventsError = '';

  showBetModal = false;
  betModalError = '';
  selectedEvent: BettingEvent | null = null;
  selectedPrediction: 'home' | 'away' | 'draw' | null = null;
  betAmount = 0;
  customRecharge = 0;

  newEvent = { title: '', oddsHome: 2, oddsAway: 2, oddsDraw: 3 };
  newEventDate: DateParts = this.emptyDateParts();

  showEditEventModal = false;
  editEvent: Partial<BettingEvent> & { id?: number } = {};
  editEventDate: DateParts = this.emptyDateParts();

  showEditBetModal = false;
  editBet: Partial<Bet> & { id?: number } = {};

  readonly predictionLabels: Record<string, string> = {
    home: 'Local',
    away: 'Visitante',
    draw: 'Empate',
  };

  ngOnInit(): void {
    this.auth.getMe().subscribe();
    this.loadEvents();
    this.loadBets();
  }

  loadEvents(): void {
    this.loadingEvents = true;
    this.eventsError = '';
    this.betting.getEvents(this.statusFilter).subscribe({
      next: (res) => {
        this.loadingEvents = false;
        this.events = res.data || [];
      },
      error: (err) => {
        this.loadingEvents = false;
        this.eventsError = err.error?.message || 'Fallo la carga de partidos.';
      },
    });
  }

  loadBets(): void {
    this.betting.getBetHistory().subscribe({
      next: (res) => {
        this.bets = res.data || [];
      },
    });
  }

  recharge(amount: number): void {
    if (amount <= 0) return;
    this.wallet.recharge(amount).subscribe({
      next: () => alert(`Se han recargado $${amount.toFixed(2)} exitosamente.`),
      error: (err) => alert(err.error?.message || 'Fallo al recargar.'),
    });
  }

  rechargeCustom(): void {
    if (this.customRecharge > 0) {
      this.recharge(this.customRecharge);
      this.customRecharge = 0;
    }
  }

  openBetModal(event: BettingEvent, prediction: 'home' | 'away' | 'draw'): void {
    this.selectedEvent = event;
    this.selectedPrediction = prediction;
    this.betAmount = 0;
    this.betModalError = '';
    this.showBetModal = true;
  }

  closeBetModal(): void {
    this.showBetModal = false;
    this.selectedEvent = null;
    this.selectedPrediction = null;
  }

  getSelectedOdds(): number {
    if (!this.selectedEvent || !this.selectedPrediction) return 0;
    const map = {
      home: this.selectedEvent.oddsHome,
      away: this.selectedEvent.oddsAway,
      draw: this.selectedEvent.oddsDraw,
    };
    return map[this.selectedPrediction];
  }

  getPotentialPayout(): number {
    return this.betAmount * this.getSelectedOdds();
  }

  confirmBet(): void {
    if (!this.selectedEvent || !this.selectedPrediction) return;
    if (this.betAmount <= 0) {
      this.betModalError = 'Ingrese un monto válido.';
      return;
    }
    const balance = this.user()?.balance ?? 0;
    if (this.betAmount > balance) {
      this.betModalError = 'Saldo insuficiente.';
      return;
    }

    this.betting.placeBet(this.selectedEvent.id, this.betAmount, this.selectedPrediction).subscribe({
      next: () => {
        alert('Apuesta confirmada exitosamente!');
        this.closeBetModal();
        this.auth.getMe().subscribe();
        this.loadEvents();
        this.loadBets();
      },
      error: (err) => {
        this.betModalError = err.error?.message || 'Error al apostar.';
      },
    });
  }

  createEvent(): void {
    if (this.isEmptyDateParts(this.newEventDate)) {
      alert('Ingresa la fecha y hora del partido.');
      return;
    }
    const eventDate = this.buildIso(this.newEventDate);
    if (!eventDate) {
      alert('La fecha y hora del partido no son válidas.');
      return;
    }
    const payload = {
      title: this.newEvent.title,
      eventDate,
      oddsHome: this.newEvent.oddsHome,
      oddsAway: this.newEvent.oddsAway,
      oddsDraw: this.newEvent.oddsDraw,
    };
    this.betting.createEvent(payload).subscribe({
      next: () => {
        alert('Evento creado exitosamente.');
        this.newEvent = { title: '', oddsHome: 2, oddsAway: 2, oddsDraw: 3 };
        this.newEventDate = this.emptyDateParts();
        this.loadEvents();
      },
      error: (err) => alert(err.error?.message || 'Error al crear evento.'),
    });
  }

  resolveEvent(eventId: number, winner: string): void {
    if (!confirm(`¿Confirmar resultado "${winner}"?`)) return;
    this.betting.resolveEvent(eventId, winner).subscribe({
      next: () => {
        alert('Evento resuelto. Dividendos liquidados.');
        this.auth.getMe().subscribe();
        this.loadEvents();
        this.loadBets();
      },
      error: (err) => alert(err.error?.message || 'Error al resolver.'),
    });
  }

  openEditEvent(event: BettingEvent): void {
    this.editEvent = { ...event };
    this.editEventDate = this.partsFromValue(event.eventDate);
    this.showEditEventModal = true;
  }

  private emptyDateParts(): DateParts {
    return { day: null, month: null, year: null, hour: null, minute: null };
  }

  private isEmptyDateParts(p: DateParts): boolean {
    return [p.day, p.month, p.year, p.hour, p.minute].every(
      (v) => v === null || v === undefined || (v as unknown as string) === ''
    );
  }

  private buildIso(p: DateParts): string | null {
    const vals = [p.day, p.month, p.year, p.hour, p.minute];
    if (vals.some((v) => v === null || v === undefined || (v as unknown as string) === '')) {
      return null;
    }
    const day = Number(p.day);
    const month = Number(p.month);
    const year = Number(p.year);
    const hour = Number(p.hour);
    const minute = Number(p.minute);
    const date = new Date(year, month - 1, day, hour, minute);
    if (
      isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }
    return date.toISOString();
  }

  private partsFromValue(value?: string | null): DateParts {
    if (!value) return this.emptyDateParts();
    const d = new Date(value);
    if (isNaN(d.getTime())) return this.emptyDateParts();
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      hour: d.getHours(),
      minute: d.getMinutes(),
    };
  }

  saveEditEvent(): void {
    if (!this.editEvent.id) return;
    const { id, title, oddsHome, oddsAway, oddsDraw } = this.editEvent;
    let eventDate: string | null = null;
    if (!this.isEmptyDateParts(this.editEventDate)) {
      eventDate = this.buildIso(this.editEventDate);
      if (!eventDate) {
        alert('La fecha y hora del partido no son válidas.');
        return;
      }
    }
    this.betting.updateEvent(id, { title, eventDate, oddsHome, oddsAway, oddsDraw }).subscribe({
      next: () => {
        this.showEditEventModal = false;
        this.loadEvents();
      },
      error: (err) => alert(err.error?.message),
    });
  }

  deleteEvent(id: number): void {
    if (!confirm('¿Eliminar este evento?')) return;
    this.betting.deleteEvent(id).subscribe({
      next: () => this.loadEvents(),
      error: (err) => alert(err.error?.message),
    });
  }

  openEditBet(bet: Bet): void {
    this.editBet = { ...bet };
    this.showEditBetModal = true;
  }

  saveEditBet(): void {
    if (!this.editBet.id) return;
    const { id, amount, prediction, odds, status } = this.editBet;
    this.betting.updateBet(id, { amount, prediction, odds, status }).subscribe({
      next: () => {
        this.showEditBetModal = false;
        this.loadBets();
      },
      error: (err) => alert(err.error?.message),
    });
  }

  deleteBet(id: number): void {
    if (!confirm('¿Eliminar esta apuesta?')) return;
    this.betting.deleteBet(id).subscribe({
      next: () => this.loadBets(),
      error: (err) => alert(err.error?.message),
    });
  }
}
