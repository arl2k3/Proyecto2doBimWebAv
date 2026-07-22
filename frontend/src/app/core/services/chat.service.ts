import { Injectable, inject, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ApiResponse, ChatMessage } from '../models';

export interface SystemMessage {
  text: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private socket: Socket | null = null;
  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly systemSubject = new Subject<SystemMessage>();
  private readonly connectionSubject = new Subject<'connected' | 'disconnected' | 'error'>();

  readonly messages$ = this.messageSubject.asObservable();
  readonly systemMessages$ = this.systemSubject.asObservable();
  readonly connectionStatus$ = this.connectionSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.auth.getToken();
    if (!token) return;

    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => this.connectionSubject.next('connected'));
    this.socket.on('disconnect', () => this.connectionSubject.next('disconnected'));
    this.socket.on('connect_error', () => this.connectionSubject.next('error'));
    this.socket.on('message', (msg: ChatMessage) => this.messageSubject.next(msg));
    this.socket.on('sysMessage', (msg: SystemMessage) => this.systemSubject.next(msg));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(room: string): void {
    this.socket?.emit('joinRoom', { room });
  }

  sendMessage(text: string): void {
    this.socket?.emit('sendMessage', { text });
  }

  getHistory(room: string): Observable<ApiResponse<ChatMessage[]>> {
    return this.api.get<ChatMessage[]>(`/api/chat/history/${room}`);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
