// js/services/openrouter.service.js — replaces Angular OpenRouterService
// Uses fetch() directly instead of the openai npm package

const API_KEY = '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';
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'arcee-ai/trinity-large-preview:free';
const SYSTEM_PROMPT = 'Du bist ein motivierender AI-Coach. Antworte kurz und hilfreich. Antworte immer auf Basis der Schweizer Standards';

let history = [{ role: 'system', content: SYSTEM_PROMPT }];

export function restoreHistory(messages) {
  history = messages.length > 0 ? [...messages] : [{ role: 'system', content: SYSTEM_PROMPT }];
}

export function resetHistory() {
  history = [{ role: 'system', content: SYSTEM_PROMPT }];
}

export function getHistory() {
  return [...history];
}

export async function generateText(prompt) {
  history.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'lern-app',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: history,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    history.push({ role: 'assistant', content: text });
    return text;
  } catch (error) {
    console.error('OpenRouter Fehler:', error);
    return 'Fehler bei der Verbindung zum AI-Coach.';
  }
}

export async function generateTitle(userMessage) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'lern-app',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte für präzise Zusammenfassungen. Deine Aufgabe ist es, für die folgende Benutzerfrage einen passenden Titel zu generieren.

Strikte Formatvorgaben:
- Länge: Der Titel muss zwingend zwischen 3 und 5 Wörtern liegen.
- Inhaltlicher Fokus: Der Titel muss den spezifischen Kern des Themas treffen. Vermeide allgemeine Floskeln.
- Schreibstil: Nutze keine Gedankenstriche oder Bindestriche. Verwende ausschliesslich Schweizer Tastaturlayout. Kein ß, schreibe stattdessen immer "ss".
- Struktur: Gib lediglich den generierten Titel aus. Keine Einleitungssätze, keine Erklärungen.

Beispiel:
Input: was ist scrum in 2 sätzen erklärt?
Output: scrum in 2 sätzen`,
          },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    const title = raw.split(/\s+/).slice(0, 5).join(' ').replace(/ß/g, 'ss');
    return title || userMessage.substring(0, 25);
  } catch {
    return userMessage.substring(0, 25) + (userMessage.length > 25 ? '...' : '');
  }
}
