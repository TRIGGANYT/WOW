import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OpenRouterService } from './openrouter.service';
import { AuthService } from './auth.service';

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
}

export interface ConversationSummary {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ConversationFull {
  _id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private aiService = inject(OpenRouterService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = '/api/conversations';

  // Using signals for automatic change detection
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  currentConversationId = signal<string | null>(null);
  conversations = signal<ConversationSummary[]>([]);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /** Load list of conversations from backend */
  loadConversations(): void {
    this.http.get<ConversationSummary[]>(this.apiUrl, { headers: this.getHeaders() })
      .subscribe({
        next: (list) => this.conversations.set(list),
        error: (err) => console.error('Error loading conversations:', err)
      });
  }

  /** Load a specific conversation and restore chat state */
  loadConversation(id: string): void {
    this.http.get<ConversationFull>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (conv) => {
          this.currentConversationId.set(conv._id);

          // Restore OpenRouter history
          this.aiService.restoreHistory(conv.messages as any);

          // Convert to ChatMessages for display (skip system messages)
          const chatMessages: ChatMessage[] = conv.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              text: m.content,
              sender: m.role === 'user' ? 'user' as const : 'ai' as const
            }));
          this.messages.set(chatMessages);
        },
        error: (err) => console.error('Error loading conversation:', err)
      });
  }

  /** Start a new conversation */
  newConversation(): void {
    this.currentConversationId.set(null);
    this.messages.set([]);
    this.aiService.resetHistory();
  }

  /** Delete a conversation */
  deleteConversation(id: string): void {
    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          // If we deleted the active conversation, clear the chat
          if (this.currentConversationId() === id) {
            this.newConversation();
          }
          // Refresh the list
          this.loadConversations();
        },
        error: (err) => console.error('Error deleting conversation:', err)
      });
  }

  async sendMessage(text: string): Promise<void> {
    if (!text.trim() || this.isLoading()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { text, sender: 'user' }]);

    // Start loading and fetch AI response
    this.isLoading.set(true);
    
    try {
      const response = await this.aiService.generateText(text);
      this.messages.update(msgs => [...msgs, { text: response, sender: 'ai' }]);

      // Save to backend
      this.saveConversation(text);
    } catch (error) {
      this.messages.update(msgs => [...msgs, { text: 'Fehler beim Generieren der Antwort.', sender: 'ai' }]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Save current conversation to backend */
  private saveConversation(firstMessageText?: string): void {
    const history = this.aiService.getHistory();
    const convId = this.currentConversationId();

    if (convId) {
      // Update existing conversation
      this.http.put(`${this.apiUrl}/${convId}`, { messages: history }, { headers: this.getHeaders() })
        .subscribe({
          next: () => this.loadConversations(),
          error: (err) => console.error('Error saving conversation:', err)
        });
    } else {
      // Create new conversation with placeholder title, then generate AI title
      const placeholderTitle = firstMessageText
        ? firstMessageText.substring(0, 30) + '...'
        : 'Neuer Chat';

      this.http.post<ConversationFull>(this.apiUrl, { title: placeholderTitle, messages: history }, { headers: this.getHeaders() })
        .subscribe({
          next: async (conv) => {
            this.currentConversationId.set(conv._id);
            this.loadConversations();

            // Generate AI title in background
            if (firstMessageText) {
              const aiTitle = await this.aiService.generateTitle(firstMessageText);
              this.http.put(`${this.apiUrl}/${conv._id}`, { title: aiTitle }, { headers: this.getHeaders() })
                .subscribe({
                  next: () => this.loadConversations(),
                  error: (err) => console.error('Error updating title:', err)
                });
            }
          },
          error: (err) => console.error('Error creating conversation:', err)
        });
    }
  }

  clearChat(): void {
    this.newConversation();
  }
}
