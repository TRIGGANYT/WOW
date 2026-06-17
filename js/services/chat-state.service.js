// js/services/chat-state.service.js — replaces Angular ChatStateService
import * as openRouter from './openrouter.service.js';
import { apiFetch } from '../api.js';

const API_URL = '/api/conversations';

// State
let messages = [];
let isLoading = false;
let currentConversationId = null;
let conversations = [];

// Listeners for re-rendering
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn();
}

// Getters
export function getMessages() { return messages; }
export function getIsLoading() { return isLoading; }
export function getCurrentConversationId() { return currentConversationId; }
export function getConversations() { return conversations; }

// Load list of conversations from backend
export async function loadConversations() {
  try {
    const list = await apiFetch(API_URL);
    conversations = list;
    notify();
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
}

// Load a specific conversation and restore chat state
export async function loadConversation(id) {
  try {
    const conv = await apiFetch(`${API_URL}/${id}`);
    currentConversationId = conv._id;

    // Restore OpenRouter history
    openRouter.restoreHistory(conv.messages);

    // Convert to ChatMessages for display (skip system messages)
    messages = conv.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        text: m.content,
        sender: m.role === 'user' ? 'user' : 'ai',
      }));
    notify();
  } catch (err) {
    console.error('Error loading conversation:', err);
  }
}

// Start a new conversation
export function newConversation() {
  currentConversationId = null;
  messages = [];
  openRouter.resetHistory();
  notify();
}

// Delete a conversation
export async function deleteConversation(id) {
  try {
    await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (currentConversationId === id) {
      newConversation();
    }
    await loadConversations();
  } catch (err) {
    console.error('Error deleting conversation:', err);
  }
}

// Send a message
export async function sendMessage(text) {
  if (!text.trim() || isLoading) return;

  messages = [...messages, { text, sender: 'user' }];
  isLoading = true;
  notify();

  try {
    const response = await openRouter.generateText(text);
    messages = [...messages, { text: response, sender: 'ai' }];
    notify();

    // Save to backend
    saveConversation(text);
  } catch (error) {
    messages = [...messages, { text: 'Fehler beim Generieren der Antwort.', sender: 'ai' }];
    notify();
  } finally {
    isLoading = false;
    notify();
  }
}

// Save current conversation to backend
async function saveConversation(firstMessageText) {
  const history = openRouter.getHistory();

  if (currentConversationId) {
    // Update existing
    try {
      await apiFetch(`${API_URL}/${currentConversationId}`, {
        method: 'PUT',
        body: { messages: history },
      });
      await loadConversations();
    } catch (err) {
      console.error('Error saving conversation:', err);
    }
  } else {
    // Create new
    const placeholderTitle = firstMessageText
      ? firstMessageText.substring(0, 30) + '...'
      : 'Neuer Chat';

    try {
      const conv = await apiFetch(API_URL, {
        method: 'POST',
        body: { title: placeholderTitle, messages: history },
      });
      currentConversationId = conv._id;
      await loadConversations();

      // Generate AI title in background
      if (firstMessageText) {
        const aiTitle = await openRouter.generateTitle(firstMessageText);
        await apiFetch(`${API_URL}/${conv._id}`, {
          method: 'PUT',
          body: { title: aiTitle },
        });
        await loadConversations();
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  }
}

// Rename a conversation
export async function renameConversation(id, newTitle) {
  try {
    await apiFetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: { title: newTitle },
    });
    await loadConversations();
  } catch (err) {
    console.error('Error renaming conversation:', err);
  }
}

// Move conversation to folder
export async function moveToFolder(id, folderName) {
  try {
    await apiFetch(`${API_URL}/${id}`, {
      method: 'PUT',
      body: { folder: folderName || null },
    });
    await loadConversations();
  } catch (err) {
    console.error('Error moving conversation to folder:', err);
  }
}

// ---- Folder management (DB-backed) ----
const FOLDERS_URL = '/api/folders';
let dbFolders = []; // { _id, name }

export async function loadFolders() {
  try {
    dbFolders = await apiFetch(FOLDERS_URL);
    notify();
  } catch (err) {
    console.error('Error loading folders:', err);
  }
}

export function getDbFolders() {
  return dbFolders;
}

export async function createFolder(name) {
  try {
    await apiFetch(FOLDERS_URL, {
      method: 'POST',
      body: { name },
    });
    await loadFolders();
  } catch (err) {
    console.error('Error creating folder:', err);
  }
}

export async function renameFolder(id, newName) {
  try {
    await apiFetch(`${FOLDERS_URL}/${id}`, {
      method: 'PUT',
      body: { name: newName },
    });
    await loadFolders();
    await loadConversations();
  } catch (err) {
    if (err.status === 409) alert('Ordner existiert bereits');
    console.error('Error renaming folder:', err);
  }
}

export async function deleteFolder(id) {
  try {
    await apiFetch(`${FOLDERS_URL}/${id}`, { method: 'DELETE' });
    await loadFolders();
    await loadConversations();
  } catch (err) {
    console.error('Error deleting folder:', err);
  }
}

export function clearChat() {
  newConversation();
}
