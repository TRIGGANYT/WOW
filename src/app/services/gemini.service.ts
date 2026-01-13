import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private chatSession: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI('AIzaSyBec6nYLRtmsGPy2w3pYVGeeXZbQF7EVAo');
    
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    this.chatSession = this.model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Du bist ein Coach. Antworte kurz auf Deutsch.' }] },
        { role: 'model', parts: [{ text: 'Alles klar.' }] },
      ],
    });
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.chatSession.sendMessage(prompt);
      return result.response.text();
    } catch (e) {
      return 'Fehler: ' + e;
    }
  }
}