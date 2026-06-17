// js/services/openrouter.service.js — replaces Angular OpenRouterService
// Now proxies through backend /api/ai/chat to keep the API key secure

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

/**
 * Calls the backend AI proxy endpoint which handles the OpenRouter API key securely.
 */
async function fetchViaBackend(messages, maxRetries = 3) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, maxRetries }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Backend AI proxy error: ${response.status}`, errorData);
      return null;
    }

    const data = await response.json();
    return data.content || null;
  } catch (err) {
    console.error('Failed to reach backend AI proxy:', err.message);
    return null;
  }
}

export async function generateText(prompt) {
  history.push({ role: 'user', content: prompt });

  try {
    const text = await fetchViaBackend(history);
    if (text) {
      history.push({ role: 'assistant', content: text });
      return text;
    }
    return 'Der AI-Coach ist gerade überlastet. Bitte versuche es in ein paar Sekunden erneut.';
  } catch (error) {
    console.error('OpenRouter Fehler:', error);
    return 'Fehler bei der Verbindung zum AI-Coach.';
  }
}

export async function generateTitle(userMessage) {
  try {
    const titleMessages = [
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
    ];

    const raw = await fetchViaBackend(titleMessages, 2);
    if (raw) {
      const title = raw.trim().split(/\s+/).slice(0, 5).join(' ').replace(/ß/g, 'ss');
      return title || userMessage.substring(0, 25);
    }
    return userMessage.substring(0, 25) + (userMessage.length > 25 ? '...' : '');
  } catch {
    return userMessage.substring(0, 25) + (userMessage.length > 25 ? '...' : '');
  }
}

