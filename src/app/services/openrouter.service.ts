import { Injectable } from '@angular/core';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class OpenRouterService {
  private openai: OpenAI;
  private history: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];

  constructor() {
    this.openai = new OpenAI({
      // 1. Dein "Masterkey" von openrouter.ai
      apiKey: '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', 
      
      // 2. Die OpenRouter Adresse
      baseURL: 'https://openrouter.ai/api/v1', 
      
      // 3. WICHTIG: Erlaubt Browser-Nutzung & setzt die nötigen Header
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:4200', // Deine Website
        'X-Title': 'lern-app',              // Name deiner App
      }
    });

    // Dein System-Prompt
    this.history.push({ 
      role: 'system', 
      content: 'Du bist ein motivierender AI-Coach. Antworte kurz und hilfreich. Antworte immer auf Basis der Schweizer Standards' 
    });
  }

  async generateText(prompt: string): Promise<string> {
    this.history.push({ role: 'user', content: prompt });

    try {
      const completion = await this.openai.chat.completions.create({
        // === HIER WÄHLST DU DAS MODELL ===
        // Gemini
        // 'google/gemini-2.5-flash:free'  (Gratis & extrem schnell!)
        // 'google/gemini-pro-1.5-exp:free'
        // 'google/gemma-2-9b-it:free'

        //DeepSeek
        // 'deepseek/deepseek-chat:free'  
        // 'deepseek/deepseek-r1:free'
        
        // Anthropic
        // 'anthropic/claude-3.5-sonnet' 
        
        // Groq
        // 'groq/llama-3.1-8b-instant'
        // 'groq/llama-3.3-70b-versatile'

        // Meta
        // 'meta-llama/llama-3.2-3b-instruct:free'
        // 'meta-llama/llama-3.1-8b-instruct:free'
        // 'meta-llama/llama-3.3-70b-instruct:free'

        // Xiaomi
        // 'xiaomi/mimo-v2-flash:free'

        model: 'xiaomi/mimo-v2-flash:free', 
        
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
}