import { Injectable, inject, signal } from '@angular/core';
import { OpenRouterService } from './openrouter.service';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private aiService = inject(OpenRouterService);

  // Using signals for automatic change detection
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);

  async sendMessage(text: string): Promise<void> {
    if (!text.trim() || this.isLoading()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { text, sender: 'user' }]);

    // Start loading and fetch AI response
    this.isLoading.set(true);
    
    try {
      const response = await this.aiService.generateText(text);
      this.messages.update(msgs => [...msgs, { text: response, sender: 'ai' }]);
    } catch (error) {
      this.messages.update(msgs => [...msgs, { text: 'Fehler beim Generieren der Antwort.', sender: 'ai' }]);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearChat(): void {
    this.messages.set([]);
  }
}
