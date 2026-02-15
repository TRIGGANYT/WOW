import { Injectable } from '@angular/core';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class OpenRouterService {
  private openai: OpenAI;
  private history: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];

  private readonly systemPrompt = 'Du bist ein motivierender AI-Coach. Antworte kurz und hilfreich. Antworte immer auf Basis der Schweizer Standards';

  constructor() {
    this.openai = new OpenAI({
      apiKey: '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', 
      baseURL: 'https://openrouter.ai/api/v1', 
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:4200',
        'X-Title': 'lern-app',
      }
    });

    this.history.push({ role: 'system', content: this.systemPrompt });
  }

  /** Restore history from saved conversation messages */
  restoreHistory(messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }>): void {
    this.history = messages.length > 0 ? [...messages] : [{ role: 'system', content: this.systemPrompt }];
  }

  /** Reset history to just the system prompt (new conversation) */
  resetHistory(): void {
    this.history = [{ role: 'system', content: this.systemPrompt }];
  }

  /** Get current history for saving */
  getHistory(): Array<{ role: string, content: string }> {
    return [...this.history];
  }

  async generateText(prompt: string): Promise<string> {
    this.history.push({ role: 'user', content: prompt });

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'arcee-ai/trinity-large-preview:free', 
        messages: this.history as any,
      });

      const text = completion.choices[0].message?.content || '';
      this.history.push({ role: 'assistant', content: text });
      
      return text;
    } catch (error) {
      console.error('OpenRouter Fehler:', error);
      return 'Fehler bei der Verbindung zum AI-Coach.';
    }
  }

  /** Generate a short chat title from user's first message (separate call, no history impact) */
  async generateTitle(userMessage: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'arcee-ai/trinity-large-preview:free',
        messages: [
          { role: 'system', content: `Du bist ein Experte für präzise Zusammenfassungen. Deine Aufgabe ist es, für die folgende Benutzerfrage einen passenden Titel zu generieren.

Strikte Formatvorgaben:
- Länge: Der Titel muss zwingend zwischen 3 und 5 Wörtern liegen.
- Inhaltlicher Fokus: Der Titel muss den spezifischen Kern des Themas treffen. Vermeide allgemeine Floskeln.
- Schreibstil: Nutze keine Gedankenstriche oder Bindestriche. Verwende ausschliesslich Schweizer Tastaturlayout. Kein ß, schreibe stattdessen immer "ss".
- Struktur: Gib lediglich den generierten Titel aus. Keine Einleitungssätze, keine Erklärungen.

Beispiel:
Input: was ist scrum in 2 sätzen erklärt?
Output: scrum in 2 sätzen` },
          { role: 'user', content: userMessage }
        ],
      });
      const raw = completion.choices[0].message?.content?.trim() || '';
      // Force max 5 words no matter what the model returns
      const title = raw.split(/\s+/).slice(0, 5).join(' ').replace(/ß/g, 'ss');
      return title || userMessage.substring(0, 25);
    } catch {
      return userMessage.substring(0, 25) + (userMessage.length > 25 ? '...' : '');
    }
  }
}
