import { Component, inject, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../layout/navbar/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessage } from '../../core/models';

interface RoomInfo {
  id: string;
  title: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [NavbarComponent, FormsModule, DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly auth = inject(AuthService);
  private readonly chat = inject(ChatService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  readonly user = this.auth.currentUser;

  rooms: RoomInfo[] = [
    { id: 'general', title: 'Foro General', icon: '💬', description: 'Canal libre para discutir cualquier evento del mundo de los deportes.' },
    { id: 'champions', title: 'Champions League', icon: '🏆', description: 'Foro especializado en partidos de la UEFA Champions League.' },
    { id: 'laliga', title: 'La Liga', icon: '🇪🇸', description: 'Debate sobre los enfrentamientos de la Liga Española.' },
    { id: 'premier', title: 'Premier League', icon: '🇬🇧', description: 'Pronósticos y debates sobre la Premier League inglesa.' },
  ];

  activeRoom = 'general';
  messages: ChatMessage[] = [];
  systemMessages: { text: string; timestamp: string }[] = [];
  messageText = '';
  connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  loading = false;
  private shouldScroll = false;
  private subs: Subscription[] = [];

  get activeRoomInfo(): RoomInfo {
    return this.rooms.find((r) => r.id === this.activeRoom) || this.rooms[0];
  }

  ngOnInit(): void {
    this.auth.getMe().subscribe();
    this.chat.connect();
    this.chat.joinRoom(this.activeRoom);

    this.subs.push(
      this.chat.connectionStatus$.subscribe((status) => {
        this.connectionStatus = status;
        if (status === 'connected') {
          this.chat.joinRoom(this.activeRoom);
        }
      }),
      this.chat.messages$.subscribe((msg) => {
        this.messages.push(msg);
        this.shouldScroll = true;
      }),
      this.chat.systemMessages$.subscribe((msg) => {
        this.systemMessages.push(msg);
        this.shouldScroll = true;
      })
    );

    this.loadHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.chat.disconnect();
  }

  switchRoom(roomId: string): void {
    if (roomId === this.activeRoom) return;
    this.activeRoom = roomId;
    this.messages = [];
    this.systemMessages = [];
    this.chat.joinRoom(roomId);
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.chat.getHistory(this.activeRoom).subscribe({
      next: (res) => {
        this.loading = false;
        this.messages = res.data || [];
        this.shouldScroll = true;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  sendMessage(): void {
    const text = this.messageText.trim();
    if (!text) return;
    this.chat.sendMessage(text);
    this.messageText = '';
  }

  isMyMessage(msg: ChatMessage): boolean {
    return msg.user.id === this.user()?.id;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
