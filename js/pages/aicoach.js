// js/pages/aicoach.js — replaces Angular AicoachComponent + ChatComponent
import * as chatState from '../services/chat-state.service.js';
import { getCurrentUser, getAvatarSelf } from '../services/user.service.js';
import { renderMarkdown } from '../utils/markdown.js';
import { renderNav } from '../components/nav.js';

export function render(container) {
  let sidebarOpen = false;
  let conversations = [];
  let userAvatar = 'assets/images/WOW_Explorer_Profilbild.png';

  async function init() {
    try {
      const user = await getCurrentUser();
      userAvatar = getAvatarSelf(user?.mentorLevel);
    } catch {}
    await chatState.loadConversations();
    conversations = chatState.getConversations();
    renderPage();
  }

  const unsubscribe = chatState.subscribe(() => {
    conversations = chatState.getConversations();
    renderPage();
  });

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
  }

  function renderPage() {
    const messages = chatState.getMessages();
    const isLoading = chatState.getIsLoading();
    const currentId = chatState.getCurrentConversationId();

    container.innerHTML = `
      <div class="ai-mentor ${sidebarOpen ? 'sidebar-open' : ''}">
        <div id="nav-placeholder"></div>

        <div class="chat-layout">
          <!-- Sidebar Toggle -->
          <button class="sidebar-toggle ${sidebarOpen ? 'active' : ''}" id="sidebar-toggle">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </button>
          <span class="sidebar-label ${sidebarOpen ? 'visible' : ''}">CHATS</span>

          <!-- Chat History Sidebar -->
          <aside class="chat-sidebar ${sidebarOpen ? 'open' : ''}">
            <div class="sidebar-header">
              <button class="new-chat-btn" id="new-chat-btn">
                <i class="fa-solid fa-plus"></i> Neuer Chat
              </button>
            </div>
            <div class="sidebar-list">
              ${conversations.length === 0 ? `
                <div class="no-history">
                  <i class="fa-solid fa-comments"></i>
                  <p>Noch keine Chats</p>
                </div>
              ` : conversations.map(conv => `
                <div class="history-item ${currentId === conv._id ? 'active' : ''}" data-conv-id="${conv._id}">
                  <div class="history-item-content">
                    <span class="history-title">${conv.title || 'Untitled'}</span>
                    <span class="history-date">${formatDate(conv.updatedAt)}</span>
                  </div>
                  <button class="delete-btn" data-delete-id="${conv._id}" title="Löschen">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </aside>

          <!-- Main Chat Area -->
          <div class="chat-main">
            <div class="page-chat">
              <div class="chat-container">
                <div class="messages-area" id="messages-area">
                  ${messages.map(msg => `
                    <div class="message-row ${msg.sender === 'user' ? 'row-user' : 'row-ai'}">
                      ${msg.sender === 'ai' ? `<div class="avatar avatar-ai"><i class="fa-solid fa-robot"></i></div>` : ''}
                      <div class="message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}">
                        ${msg.sender === 'user' ? msg.text : renderMarkdown(msg.text)}
                      </div>
                      ${msg.sender === 'user' ? `<div class="avatar avatar-user"><img src="${userAvatar}" alt="User Avatar"></div>` : ''}
                    </div>
                  `).join('')}
                </div>
                <div class="input-area">
                  <input id="chat-input" placeholder="Schreib etwas..." autocomplete="off" ${isLoading ? 'disabled' : ''} />
                  <button id="chat-send" ${isLoading ? 'disabled' : ''} class="${isLoading ? 'loading' : ''}">
                    ${isLoading ? '<span class="spinner"></span>' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render nav into placeholder
    renderNav(container.querySelector('#nav-placeholder'));

    // Scroll to bottom
    const messagesArea = container.querySelector('#messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Event listeners
    container.querySelector('#sidebar-toggle').addEventListener('click', () => {
      sidebarOpen = !sidebarOpen;
      renderPage();
    });

    container.querySelector('#new-chat-btn').addEventListener('click', () => {
      chatState.newConversation();
      renderPage();
    });

    // Conversation items
    container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        const id = item.dataset.convId;
        chatState.loadConversation(id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        chatState.deleteConversation(id);
      });
    });

    // Chat input
    const chatInput = container.querySelector('#chat-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }

    container.querySelector('#chat-send')?.addEventListener('click', () => sendMessage());
  }

  function sendMessage() {
    const input = container.querySelector('#chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    chatState.sendMessage(text);
  }

  init();

  return () => {
    unsubscribe();
  };
}
