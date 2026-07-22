import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { CasinoService } from '../../core/services/casino.service';
import { BlackjackGame, Card } from '../../core/models';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};

const STATUS_MAP: Record<string, { text: string; css: string }> = {
  won: { text: '¡Ganaste! 🎉', css: 'won' },
  blackjack: { text: '¡BLACKJACK! 🃏✨', css: 'blackjack' },
  lost: { text: 'Perdiste 😞', css: 'lost' },
  bust: { text: 'Te pasaste (Bust)', css: 'lost' },
  push: { text: 'Empate 🤝', css: 'push' },
};

@Component({
  selector: 'app-blackjack',
  standalone: true,
  imports: [NavbarComponent, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './blackjack.component.html',
  styleUrl: './blackjack.component.scss',
})
export class BlackjackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly casino = inject(CasinoService);

  readonly user = this.auth.currentUser;

  betAmount = 10;
  game: BlackjackGame | null = null;
  history: BlackjackGame[] = [];
  error = '';
  resultBanner = '';
  resultCss = '';
  showBetPanel = true;
  showActionPanel = false;
  showNewGameBtn = false;
  actionLoading = false;

  readonly suitSymbols = SUIT_SYMBOLS;

  ngOnInit(): void {
    this.refreshBalance();
    this.loadHistory();
    this.casino.blackjackActive().subscribe({
      next: (res) => {
        if (res.data) {
          this.renderGame(res.data);
        }
      },
    });
  }

  refreshBalance(): void {
    this.auth.getMe().subscribe();
  }

  loadHistory(): void {
    this.casino.blackjackHistory().subscribe({
      next: (res) => {
        this.history = (res.data || []).slice(0, 10);
      },
    });
  }

  setBet(amount: number): void {
    this.betAmount = amount;
  }

  getPlayerCards(): Card[] {
    if (!this.game) return [];
    const pc = this.game.playerCards;
    if (Array.isArray(pc)) return pc;
    if (pc && 'hands' in pc) return pc.hands[pc.activeHandIndex] || [];
    return [];
  }

  isSplit(): boolean {
    const pc = this.game?.playerCards;
    return !!pc && !Array.isArray(pc) && 'hands' in pc;
  }

  getSplitHands(): Card[][] {
    const pc = this.game?.playerCards;
    if (pc && !Array.isArray(pc) && 'hands' in pc) return pc.hands;
    return [];
  }

  getActiveHandIndex(): number {
    const pc = this.game?.playerCards;
    if (pc && !Array.isArray(pc) && 'activeHandIndex' in pc) return pc.activeHandIndex;
    return 0;
  }

  cardClass(card: Card): string {
    if (!card || card.value === '?') return 'hidden-card';
    return card.suit?.toLowerCase() || '';
  }

  suitSymbol(card: Card): string {
    if (!card?.suit) return '';
    return SUIT_SYMBOLS[card.suit.toLowerCase()] || card.suit;
  }

  startGame(): void {
    if (this.betAmount <= 0) {
      this.showError('Ingresa un monto de apuesta válido.');
      return;
    }
    this.casino.blackjackStart(this.betAmount).subscribe({
      next: (res) => {
        this.hideBanner();
        this.renderGame(res.data);
        this.refreshBalance();
      },
      error: (err) => this.showError(err.error?.message),
    });
  }

  hit(): void {
    this.doAction(() => this.casino.blackjackHit());
  }

  stand(): void {
    this.doAction(() => this.casino.blackjackStand());
  }

  double(): void {
    this.doAction(() => this.casino.blackjackDouble());
  }

  split(): void {
    this.doAction(() => this.casino.blackjackSplit());
  }

  newGame(): void {
    this.game = null;
    this.showBetPanel = true;
    this.showActionPanel = false;
    this.showNewGameBtn = false;
    this.hideBanner();
  }

  private doAction(action: () => ReturnType<CasinoService['blackjackHit']>): void {
    this.actionLoading = true;
    action().subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.renderGame(res.data);
      },
      error: (err) => {
        this.actionLoading = false;
        this.showError(err.error?.message);
      },
    });
  }

  private renderGame(game: BlackjackGame): void {
    this.game = game;
    if (game.status === 'in_progress') {
      this.showBetPanel = false;
      this.showActionPanel = true;
      this.showNewGameBtn = false;
    } else {
      this.applyGameEnd(game);
    }
  }

  private applyGameEnd(game: BlackjackGame): void {
    const info = STATUS_MAP[game.status] || { text: game.status, css: '' };
    const payoutStr = (game.payout ?? 0) > 0 ? `  +$${Number(game.payout).toFixed(2)}` : '';
    this.resultBanner = info.text + payoutStr;
    this.resultCss = info.css;
    this.showBetPanel = false;
    this.showActionPanel = false;
    this.showNewGameBtn = true;
    this.refreshBalance();
    this.loadHistory();
  }

  private showError(msg: string): void {
    this.error = msg;
    setTimeout(() => (this.error = ''), 4000);
  }

  private hideBanner(): void {
    this.resultBanner = '';
    this.resultCss = '';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      won: 'Ganaste', lost: 'Perdiste', push: 'Empate',
      blackjack: 'Blackjack', bust: 'Bust', in_progress: 'En juego',
    };
    return labels[status] || status;
  }
}
