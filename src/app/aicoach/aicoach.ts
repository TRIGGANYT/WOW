import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { chat } from './chat/chat';
import { Nav } from '../nav/nav';
import { ChatStateService, ConversationSummary } from '../services/chat-state.service';

@Component({
  selector: 'app-aicoach',
  standalone: true,
  templateUrl: './aicoach.html',
  styleUrl: './aicoach.css',
  imports: [CommonModule, chat, Nav],
})
export class Aicoach implements OnInit {
  chatState = inject(ChatStateService);
  sidebarOpen = false;

  ngOnInit(): void {
    this.chatState.loadConversations();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  newChat(): void {
    this.chatState.newConversation();
  }

  loadConversation(conv: ConversationSummary): void {
    this.chatState.loadConversation(conv._id);
    // Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }

  deleteConversation(event: Event, id: string): void {
    event.stopPropagation();
    this.chatState.deleteConversation(id);
  }

  isActive(id: string): boolean {
    return this.chatState.currentConversationId() === id;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  get conversations() { return this.chatState.conversations(); }
}
