import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { CasinoService } from '../../core/services/casino.service';
import { MinesGame } from '../../core/models';

const GRID_SIZE = 25;
const MINE_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

const INTEGER_BET_VALIDATORS = [
  Validators.required,
  Validators.min(1),
  Validators.pattern('^[0-9]*$'),
];

type CellState = 'hidden' | 'safe' | 'mine' | 'revealed-mine' | 'disabled';

interface GridCell {
  index: number;
  state: CellState;
}

@Component({
  selector: 'app-mines',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './mines.component.html',
  styleUrl: './mines.component.scss',
})
export class MinesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly casino = inject(CasinoService);

  readonly user = this.auth.currentUser;
  readonly mineOptions = MINE_OPTIONS;
  readonly gridSize = GRID_SIZE;
  readonly betAmountControl = new FormControl('10', {
    nonNullable: true,
    validators: INTEGER_BET_VALIDATORS,
  });

  minesCount = 3;
  multiplier = 1;
  gameActive = false;
  showSetup = true;
  showCashout = false;
  showNewGame = false;
  showStats = false;
  safeRevealed = 0;
  currentBet = 0;
  error = '';
  resultBanner = '';
  resultCss = '';
  grid: GridCell[] = [];
  history: MinesGame[] = [];
  gridShaking = false;

  ngOnInit(): void {
    this.initGrid();
    this.refreshBalance();
    this.loadHistory();
    this.casino.minesActive().subscribe({
      next: (res) => {
        const game = res.data;
        if (game && game.status === 'in_progress') {
          this.restoreGame(game);
        }
      },
    });
  }

  initGrid(): void {
    this.grid = Array.from({ length: GRID_SIZE }, (_, i) => ({
      index: i,
      state: 'hidden' as CellState,
    }));
  }

  refreshBalance(): void {
    this.auth.getMe().subscribe();
  }

  loadHistory(): void {
    this.casino.minesHistory().subscribe({
      next: (res) => {
        this.history = (res.data || []).slice(0, 10);
      },
    });
  }

  selectMines(n: number): void {
    if (!this.gameActive) {
      this.minesCount = n;
    }
  }

  setBet(amount: number): void {
    this.betAmountControl.setValue(String(amount));
    this.betAmountControl.markAsTouched();
  }

  get potentialWin(): number {
    return this.currentBet * this.multiplier;
  }

  startGame(): void {
    this.betAmountControl.markAsTouched();
    if (this.betAmountControl.invalid) {
      this.showError('Ingresa una apuesta válida (solo enteros ≥ 1).');
      return;
    }

    const betAmount = Number(this.betAmountControl.value);
    this.casino.minesStart(betAmount, this.minesCount).subscribe({
      next: () => {
        this.currentBet = betAmount;
        this.multiplier = 1;
        this.safeRevealed = 0;
        this.initGrid();
        this.gameActive = true;
        this.showSetup = false;
        this.showCashout = true;
        this.showNewGame = false;
        this.showStats = true;
        this.resultBanner = '';
        this.refreshBalance();
      },
      error: (err) => this.showError(err.error?.message),
    });
  }

  revealCell(index: number): void {
    if (!this.gameActive) return;
    const cell = this.grid[index];
    if (cell.state !== 'hidden') return;

    this.casino.minesReveal(index).subscribe({
      next: (res) => {
        const result = res.data;
        const hitMine = result.hitMine ?? false;

        cell.state = hitMine ? 'mine' : 'safe';
        this.multiplier = result.multiplier ?? this.multiplier;
        if (!hitMine) this.safeRevealed++;

        if (result.status === 'exploded') {
          this.gridShaking = true;
          setTimeout(() => (this.gridShaking = false), 500);
          if (result.minePositions) {
            result.minePositions.forEach((pos) => {
              if (pos !== index && this.grid[pos].state === 'hidden') {
                this.grid[pos].state = 'revealed-mine';
              }
            });
          }
          this.endGame('💥 ¡Boom! Perdiste', 'lost');
        } else if (result.status === 'cashed_out') {
          this.endGame(`✅ ¡Ganaste! +$${Number(result.payout).toFixed(2)}`, 'won');
        }
      },
      error: (err) => this.showError(err.error?.message),
    });
  }

  cashOut(): void {
    if (!this.gameActive) return;
    this.casino.minesCashout().subscribe({
      next: (res) => {
        const result = res.data;
        if (result.minePositions) {
          result.minePositions.forEach((pos) => {
            if (this.grid[pos].state === 'hidden') {
              this.grid[pos].state = 'revealed-mine';
            }
          });
        }
        this.endGame(
          `💰 ¡Cobrado! +$${Number(result.payout).toFixed(2)} (${Number(result.multiplier).toFixed(2)}x)`,
          'won'
        );
      },
      error: (err) => this.showError(err.error?.message),
    });
  }

  newGame(): void {
    this.initGrid();
    this.multiplier = 1;
    this.safeRevealed = 0;
    this.gameActive = false;
    this.showSetup = true;
    this.showCashout = false;
    this.showNewGame = false;
    this.showStats = false;
    this.resultBanner = '';
  }

  private restoreGame(game: MinesGame): void {
    this.currentBet = game.bet;
    this.minesCount = game.minesCount ?? game.mines_count ?? 3;
    this.multiplier = game.multiplier;
    this.safeRevealed = this.parseRevealed(game.revealedCells).length;
    this.initGrid();
    this.parseRevealed(game.revealedCells).forEach((idx) => {
      this.grid[idx].state = 'safe';
    });
    this.gameActive = true;
    this.showSetup = false;
    this.showCashout = true;
    this.showStats = true;
  }

  private parseRevealed(cells: MinesGame['revealedCells']): number[] {
    if (!cells) return [];
    if (typeof cells === 'string') {
      try { return JSON.parse(cells); } catch { return []; }
    }
    return cells.map((c) => (typeof c === 'number' ? c : c.index));
  }

  private endGame(message: string, css: string): void {
    this.grid.forEach((c) => {
      if (c.state === 'hidden') c.state = 'disabled';
    });
    this.resultBanner = message;
    this.resultCss = css;
    this.gameActive = false;
    this.showCashout = false;
    this.showNewGame = true;
    this.refreshBalance();
    this.loadHistory();
  }

  private showError(msg: string): void {
    this.error = msg;
    setTimeout(() => (this.error = ''), 4000);
  }

  cellEmoji(state: CellState): string {
    if (state === 'safe') return '💎';
    if (state === 'mine') return '💣';
    if (state === 'revealed-mine') return '💣';
    return '';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      cashed_out: 'Cobrado', exploded: 'Explotó', in_progress: 'En juego',
    };
    return labels[status] || status;
  }
}
