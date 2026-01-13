import { Injectable } from '@angular/core';
import OpenAI from 'openai';

@Injectable({
  providedIn: 'root'
})
export class DeepSeekService {
  private openai: OpenAI;
  private history: { role: 'system' | 'user' | 'assistant', content: string }[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: 'sk-c5b9074166414843912da6253321e21f', 
      baseURL: 'http://localhost:4200/deepseek-api',
      dangerouslyAllowBrowser: true
    });

    this.history.push({
      role: 'system',
      content: 'Du bist ein hilfreicher Coach.'
    });
  }

  async generateText(prompt: string): Promise<string> {
    this.history.push({ role: 'user', content: prompt });

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat', // <--- Das schnelle V3 Modell
        messages: this.history as any,
      });

      const responseText = completion.choices[0].message?.content || '';
      this.history.push({ role: 'assistant', content: responseText });
      return responseText;
      
    } catch (error) {
      console.error('DeepSeek Fehler:', error);
      return 'Fehler bei der Verbindung.';
    }
  }
}