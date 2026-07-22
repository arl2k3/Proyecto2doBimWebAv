export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin';
  balance?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: { message: string }[];
}

export interface BettingEvent {
  id: number;
  title: string;
  eventDate?: string | null;
  oddsHome: number;
  oddsAway: number;
  oddsDraw: number;
  status: 'active' | 'completed' | 'cancelled';
  winner?: string;
  createdAt: string;
}

export interface Bet {
  id: number;
  eventId: number;
  amount: number;
  prediction: 'home' | 'away' | 'draw';
  odds: number;
  status: 'pending' | 'won' | 'lost';
  event?: BettingEvent;
}

export interface ChatMessage {
  id?: number;
  message: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

export interface Card {
  suit: string;
  value: string;
}

export interface BlackjackGame {
  id?: number;
  bet: number;
  status: string;
  playerCards: Card[] | { hands: Card[][]; activeHandIndex: number };
  dealerCards: Card[];
  playerScore?: number;
  dealerScore?: number;
  payout?: number;
  canDouble?: boolean;
  canSplit?: boolean;
  isSplit?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface MinesGame {
  id?: number;
  bet: number;
  minesCount: number;
  mines_count?: number;
  multiplier: number;
  status: string;
  revealedCells: number[] | { index: number }[] | string;
  payout?: number;
  minePositions?: number[];
  createdAt?: string;
  created_at?: string;
}
