// js/pages/aicoach.js — AI Coach Chat Page
import * as chatState from '../services/chat-state.service.js';
import { getCurrentUser, getAvatarSelf } from '../services/user.service.js';
import { renderMarkdown } from '../utils/markdown.js';
import { renderNav } from '../components/nav.js';

export function render(container) {
  let sidebarOpen = false;
  let conversations = [];
  let userAvatar = 'assets/images/WOW_Explorer_Profilbild.png';
  let editingId = null;
  let editingFolderId = null;
  let collapsedFolders = {};
  let draggedConvId = null;

  async function init() {
    try {
      const user = await getCurrentUser();
      userAvatar = getAvatarSelf(user?.mentorLevel);
    } catch {}
    await chatState.loadConversations();
    await chatState.loadFolders();
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

  // Group conversations by folder
  function groupByFolder(convs) {
    const dbFolders = chatState.getDbFolders();
    const folders = {};

    // Initialize all DB folders (so empty ones still show)
    for (const f of dbFolders) {
      folders[f.name] = [];
    }

    const ungrouped = [];
    for (const conv of convs) {
      if (conv.folder && folders.hasOwnProperty(conv.folder)) {
        folders[conv.folder].push(conv);
      } else if (conv.folder) {
        // Folder exists on conv but not in DB (edge case) — still group it
        folders[conv.folder] = folders[conv.folder] || [];
        folders[conv.folder].push(conv);
      } else {
        ungrouped.push(conv);
      }
    }
    return { folders, ungrouped };
  }

  function renderConvItem(conv) {
    const currentId = chatState.getCurrentConversationId();
    const isEditing = editingId === conv._id;

    return `
      <div class="history-item ${currentId === conv._id ? 'active' : ''}"
           data-conv-id="${conv._id}" draggable="true">
        <div class="history-item-content">
          ${isEditing
            ? `<input class="rename-input" data-rename-id="${conv._id}" value="${(conv.title || 'Untitled').replace(/"/g, '&quot;')}" autocomplete="off" />`
            : `<span class="history-title">${conv.title || 'Untitled'}</span>`
          }
          <span class="history-date">${formatDate(conv.updatedAt)}</span>
        </div>
        <div class="history-actions">
          <button class="edit-btn" data-edit-id="${conv._id}" title="Umbenennen">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="delete-btn" data-delete-id="${conv._id}" title="Löschen">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderFolderSection(folderName, convs) {
    const isCollapsed = collapsedFolders[folderName];
    const dbFolders = chatState.getDbFolders();
    const folderObj = dbFolders.find(f => f.name === folderName);
    const isEditing = folderObj && editingFolderId === folderObj._id;

    return `
      <div class="folder-section" data-drop-folder="${folderName}">
        <div class="folder-header" data-folder-name="${folderName}">
          <i class="fa-solid fa-chevron-${isCollapsed ? 'right' : 'down'} folder-chevron"></i>
          <i class="fa-solid fa-folder${isCollapsed ? '' : '-open'} folder-icon"></i>
          ${isEditing
            ? `<input class="folder-rename-input" data-rename-id="${folderObj._id}" value="${folderName.replace(/"/g, '&quot;')}" autocomplete="off" />`
            : `<span class="folder-name">${folderName}</span>`
          }
          ${folderObj && !isEditing ? `
            <div class="folder-actions">
              <button class="folder-edit-btn" data-folder-edit-id="${folderObj._id}" title="Ordner umbenennen"><i class="fa-solid fa-pen"></i></button>
              <button class="folder-delete-btn" data-folder-del-id="${folderObj._id}" title="Ordner löschen"><i class="fa-solid fa-xmark"></i></button>
            </div>
          ` : ''}
        </div>
        <div class="folder-drop-area" data-drop-folder="${folderName}">
          ${isCollapsed ? '' : `
            ${convs.map(conv => renderConvItem(conv)).join('')}
          `}
          ${convs.length === 0 && !isCollapsed ? '<div class="folder-empty-hint">Chat hierher ziehen</div>' : ''}
        </div>
      </div>
    `;
  }

  function renderPage() {
    const messages = chatState.getMessages();
    const isLoading = chatState.getIsLoading();
    const { folders, ungrouped } = groupByFolder(conversations);
    const folderNames = Object.keys(folders).sort();

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
              <div class="sidebar-header-buttons">
                <button class="new-chat-btn" id="new-chat-btn">
                  <i class="fa-solid fa-plus"></i> Neuer Chat
                </button>
                <button class="new-folder-btn" id="new-folder-btn" title="Neuer Ordner">
                  <i class="fa-solid fa-folder-plus"></i>
                </button>
              </div>
            </div>
            <div class="sidebar-list" id="sidebar-list">
              ${conversations.length === 0 && folderNames.length === 0 ? `
                <div class="no-history">
                  <i class="fa-solid fa-comments"></i>
                  <p>Noch keine Chats</p>
                </div>
              ` : `
                ${folderNames.map(name => renderFolderSection(name, folders[name])).join('')}
                <div class="ungrouped-zone" data-drop-folder="__none__">
                  ${ungrouped.map(conv => renderConvItem(conv)).join('')}
                </div>
              `}
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

    // Render nav
    renderNav(container.querySelector('#nav-placeholder'));

    // Scroll to bottom
    const messagesArea = container.querySelector('#messages-area');
    if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;

    // ==================== Event Listeners ====================

    // Sidebar toggle
    container.querySelector('#sidebar-toggle').addEventListener('click', () => {
      sidebarOpen = !sidebarOpen;
      renderPage();
    });

    // New chat
    container.querySelector('#new-chat-btn').addEventListener('click', () => {
      chatState.newConversation();
      renderPage();
    });

    // New folder — saves to DB
    container.querySelector('#new-folder-btn')?.addEventListener('click', async () => {
      const name = prompt('Ordnername:');
      if (!name || !name.trim()) return;
      await chatState.createFolder(name.trim());
    });

    // Delete folder buttons
    container.querySelectorAll('.folder-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.folderDelId;
        if (confirm('Ordner löschen? Chats werden nicht gelöscht.')) {
          chatState.deleteFolder(id);
        }
      });
    });

    // Edit folder buttons
    container.querySelectorAll('.folder-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingFolderId = btn.dataset.folderEditId;
        renderPage();
        const input = container.querySelector(`.folder-rename-input[data-rename-id="${editingFolderId}"]`);
        if (input) { input.focus(); input.select(); }
      });
    });

    // Folder rename inputs
    container.querySelectorAll('.folder-rename-input').forEach(input => {
      const commitRename = () => {
        const id = input.dataset.renameId;
        const newName = input.value.trim();
        editingFolderId = null;
        if (newName) {
          chatState.renameFolder(id, newName);
        } else {
          renderPage();
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
        else if (e.key === 'Escape') { editingFolderId = null; renderPage(); }
      });
      input.addEventListener('blur', () => {
        setTimeout(() => { if (editingFolderId === input.dataset.renameId) commitRename(); }, 100);
      });
      input.addEventListener('click', (e) => e.stopPropagation());
    });

    // Folder header collapse/expand
    container.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.folder-actions') || e.target.closest('.folder-rename-input')) return;
        const folderName = header.dataset.folderName;
        collapsedFolders[folderName] = !collapsedFolders[folderName];
        renderPage();
      });
    });

    // ==================== Drag & Drop ====================
    setupDragAndDrop();

    // Conversation items — click to load
    container.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn') || e.target.closest('.edit-btn') || e.target.closest('.rename-input')) return;
        const id = item.dataset.convId;
        chatState.loadConversation(id);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatState.deleteConversation(btn.dataset.deleteId);
      });
    });

    // Edit (rename) buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editingId = btn.dataset.editId;
        renderPage();
        const input = container.querySelector(`.rename-input[data-rename-id="${editingId}"]`);
        if (input) { input.focus(); input.select(); }
      });
    });

    // Rename inputs
    container.querySelectorAll('.rename-input').forEach(input => {
      const commitRename = () => {
        const id = input.dataset.renameId;
        const newTitle = input.value.trim();
        editingId = null;
        if (newTitle) {
          chatState.renameConversation(id, newTitle);
        } else {
          renderPage();
        }
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
        else if (e.key === 'Escape') { editingId = null; renderPage(); }
      });
      input.addEventListener('blur', () => {
        setTimeout(() => { if (editingId === input.dataset.renameId) commitRename(); }, 100);
      });
      input.addEventListener('click', (e) => e.stopPropagation());
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

  // ==================== Drag & Drop Setup ====================
  function setupDragAndDrop() {
    // Make all history items draggable
    container.querySelectorAll('.history-item[draggable]').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedConvId = item.dataset.convId;
        e.dataTransfer.setData('text/plain', draggedConvId);
        e.dataTransfer.effectAllowed = 'move';
        // Delay adding class so the drag ghost looks normal
        requestAnimationFrame(() => item.classList.add('dragging'));
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedConvId = null;
        // Clean up all highlights
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
    });

    // Drop zones: .folder-section, .folder-drop-area, .ungrouped-zone
    const dropZones = container.querySelectorAll('.folder-section, .folder-drop-area, .ungrouped-zone');
    dropZones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        // Highlight the closest meaningful drop zone
        const folderSection = zone.closest('.folder-section') || zone;
        folderSection.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        const folderSection = zone.closest('.folder-section') || zone;
        // Only remove if we truly left the zone
        const relatedTarget = e.relatedTarget;
        if (!folderSection.contains(relatedTarget)) {
          folderSection.classList.remove('drag-over');
        }
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const convId = e.dataTransfer.getData('text/plain');
        // Get the folder name from the zone or its parent folder-section
        const targetFolder = zone.dataset.dropFolder || zone.closest('[data-drop-folder]')?.dataset.dropFolder;
        if (!convId || !targetFolder) return;

        // Remove highlight
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

        if (targetFolder === '__none__') {
          chatState.moveToFolder(convId, null);
        } else {
          chatState.moveToFolder(convId, targetFolder);
        }
      });
    });

    // Also allow dropping directly on folder-header
    container.querySelectorAll('.folder-header').forEach(header => {
      header.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        header.closest('.folder-section')?.classList.add('drag-over');
      });

      header.addEventListener('dragleave', (e) => {
        e.stopPropagation();
        const section = header.closest('.folder-section');
        if (section && !section.contains(e.relatedTarget)) {
          section.classList.remove('drag-over');
        }
      });

      header.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const convId = e.dataTransfer.getData('text/plain');
        const folderName = header.dataset.folderName;
        if (!convId || !folderName) return;
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        chatState.moveToFolder(convId, folderName);
      });
    });
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
