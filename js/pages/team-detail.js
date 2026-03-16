// js/pages/team-detail.js — replaces Angular TeamDetailComponent
import * as teamService from '../services/team.service.js';
import * as teamSession from '../services/team-session.service.js';
import { getCurrentUser, getAvatarSelf, getAvatarOther, addXp } from '../services/user.service.js';
import { navigateTo } from '../router.js';
import { isLoggedIn } from '../services/auth.service.js';

export function render(container, params) {
  if (!isLoggedIn()) { navigateTo('/'); return; }

  const teamId = params.id;
  let team = null;
  let messages = [];
  let currentUser = null;
  let currentUserId = '';
  let newMessage = '';
  let timerSeconds = 0;
  let timerDisplay = '00:00';
  let timerInterval = null;
  let pollInterval = null;

  // Rating state
  let showRatingOverlay = false;
  let ratingTarget = null;
  let selectedStars = 0;
  let ratingFeedback = '';

  async function init() {
    try {
      currentUser = await getCurrentUser();
      currentUserId = currentUser?._id || '';
    } catch {}

    teamSession.setActiveTeam(teamId);

    await loadTeamData();
    await loadMessages();
    startTimer();
    pollInterval = setInterval(() => { loadTeamData(); loadMessages(); }, 3000);
    renderPage();
  }

  async function loadTeamData() {
    try {
      team = await teamService.getTeamById(teamId);
      renderPage();
    } catch (err) {
      console.error('Error loading team:', err);
    }
  }

  async function loadMessages() {
    try {
      messages = await teamService.getMessages(teamId);
      renderPage();
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }

  function startTimer() {
    timerSeconds = 0;
    timerInterval = setInterval(() => {
      timerSeconds++;
      const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');
      timerDisplay = `${m}:${s}`;
      const timerEl = container.querySelector('.timer-display');
      if (timerEl) timerEl.textContent = timerDisplay;
    }, 1000);
  }

  function isMyMessage(msg) {
    return msg.sender?._id === currentUserId || msg.sender === currentUserId;
  }

  function getSenderName(msg) {
    return msg.sender?.username || msg.senderName || 'User';
  }

  function getSenderAvatar(msg) {
    return getAvatarOther(msg.sender?.mentorLevel);
  }

  function getMyAvatar() {
    return getAvatarSelf(currentUser?.mentorLevel);
  }

  function getMemberAvatar(member) {
    return member._id === currentUserId ? getAvatarSelf(member.mentorLevel) : getAvatarOther(member.mentorLevel);
  }

  function getMemberDisplayName(member) {
    return member.username || member.email || 'User';
  }

  function hasVoted() {
    if (!team || !currentUserId) return false;
    return team.dissolveVotes?.includes(currentUserId);
  }

  function getCurrentVotes() {
    return team?.dissolveVotes?.length || 0;
  }

  function getVotesNeeded() {
    return Math.ceil((team?.members?.length || 1) / 2);
  }

  function renderPage() {
    container.innerHTML = `
      <div class="team-detail-page">
        <!-- Left Panel -->
        <div class="panel team-info-panel">
          <h2>Team Detail</h2>
          <div class="team-actions">
            <button class="btn-leave" id="btn-leave-room">Raum verlassen</button>
            <button class="btn-dissolve" id="btn-dissolve" ${hasVoted() ? 'disabled' : ''}>
              ${hasVoted() ? 'Bereits gestimmt' : 'Für Auflösung stimmen'}
            </button>
          </div>
          <div class="info-items">
            <p class="info-item"><i class="fa-solid fa-heading"></i> Titel: ${team?.name || 'Lädt...'}</p>
            <p class="info-item"><i class="fa-solid fa-clock"></i> Besprechungsdauer: <span class="timer-display">${timerDisplay}</span></p>
            ${team?.members?.length ? `<p class="info-item"><i class="fa-solid fa-vote-yea"></i> Auflösung: ${getCurrentVotes()}/${getVotesNeeded()} Stimmen</p>` : ''}
          </div>
          <h3>Mitglieder (${team?.members?.length || 0}/${team?.maxMembers || 8})</h3>
          <div class="members-list">
            ${team?.members?.length ? team.members.map(member => `
              <div class="member-row">
                <div class="member-avatar"><img src="${getMemberAvatar(member)}" alt="Member" /></div>
                <span class="member-name">${getMemberDisplayName(member)}</span>
                ${member._id !== currentUserId ? `<button class="btn-rate" data-member-id="${member._id}" title="Bewerten"><i class="fa-solid fa-star"></i></button>` : ''}
              </div>
            `).join('') : '<p class="no-members">Keine Mitglieder</p>'}
          </div>
        </div>

        <!-- Middle Panel: Chat -->
        <div class="panel chat-panel">
          <h2>Team Chat</h2>
          <div class="chat-messages" id="chat-container">
            ${messages.length === 0 ? '<p class="no-messages">Noch keine Nachrichten. Starte die Unterhaltung!</p>' : ''}
            ${messages.map(msg => `
              <div class="message-row ${isMyMessage(msg) ? 'row-user' : 'row-other'}">
                ${!isMyMessage(msg) ? `<div class="avatar avatar-other"><img src="${getSenderAvatar(msg)}" alt="Avatar" /></div>` : ''}
                <div class="message-content ${isMyMessage(msg) ? 'content-user' : ''}">
                  ${!isMyMessage(msg) ? `<span class="sender-name">${getSenderName(msg)}</span>` : ''}
                  <div class="message-bubble ${isMyMessage(msg) ? 'bubble-user' : 'bubble-other'}">${msg.text}</div>
                </div>
                ${isMyMessage(msg) ? `<div class="avatar avatar-user"><img src="${getMyAvatar()}" alt="Avatar" /></div>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="chat-input-area">
            <input type="text" id="team-chat-input" placeholder="schreibe etwas ..." value="${newMessage}" />
            <button class="btn-send" id="btn-team-send"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>

        <!-- Right Panel: Challenge -->
        <div class="panel challenge-panel">
          <h2>Challenge - ${team?.name || 'Steuern'}</h2>
          <p class="challenge-question">Wie kannst du Steuern Sparen?</p>
          <div class="challenge-options">
            <div class="option">A) Mehrfach dieselbe Rechnung für das Einkommen abziehen</div>
            <div class="option">B) Das Einzahlen in die 3. Säule (Pillar 3a) nutzen</div>
            <div class="option">C) Arbeitslos sein</div>
            <div class="option">D) Nach Madeira auswandern</div>
          </div>
          <p class="next-question">Was bedeutet Steuerpflichtig?</p>
          <div class="answer-input"><input type="text" placeholder="schreibe etwas ...." /></div>
          <button class="btn-challenge-xp" id="btn-challenge-xp"><i class="fa-solid fa-bolt"></i> +50 Challenge XP (Test)</button>
        </div>
      </div>

      <!-- Rating Overlay -->
      ${showRatingOverlay ? `
        <div class="rating-overlay" id="rating-overlay">
          <div class="rating-modal" id="rating-modal">
            <h3>Bewerte ${ratingTarget ? getMemberDisplayName(ratingTarget) : ''}</h3>
            <p class="rating-subtitle">Wie gut hat dir der Austausch geholfen?</p>
            <div class="stars-row">
              ${[1,2,3,4,5].map(star => `
                <button class="star-btn ${star <= selectedStars ? 'filled' : ''}" data-star="${star}">
                  <i class="fa-solid fa-star"></i>
                </button>
              `).join('')}
            </div>
            ${ratingFeedback ? `<p class="rating-feedback">${ratingFeedback}</p>` : ''}
            <div class="rating-actions">
              <button class="btn-cancel-rating" id="btn-cancel-rating">Abbrechen</button>
              <button class="btn-submit-rating" id="btn-submit-rating" ${!selectedStars ? 'disabled' : ''}>Bewerten</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    // Scroll chat to bottom
    const chatContainer = container.querySelector('#chat-container');
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;

    // Event listeners
    container.querySelector('#btn-leave-room')?.addEventListener('click', async () => {
      try {
        await teamService.leaveTeam(teamId);
        teamSession.clearActiveTeam();
        navigateTo('/teamup');
      } catch (err) { console.error(err); }
    });

    container.querySelector('#btn-dissolve')?.addEventListener('click', async () => {
      try {
        const result = await teamService.voteDissolve(teamId);
        if (result?.dissolved) {
          teamSession.clearActiveTeam();
          navigateTo('/teamup');
        } else {
          await loadTeamData();
        }
      } catch (err) { console.error(err); }
    });

    // Chat
    const chatInput = container.querySelector('#team-chat-input');
    if (chatInput) {
      chatInput.addEventListener('input', e => { newMessage = e.target.value; });
      chatInput.addEventListener('keyup', e => { if (e.key === 'Enter') sendTeamMessage(); });
    }
    container.querySelector('#btn-team-send')?.addEventListener('click', () => sendTeamMessage());

    // Challenge XP
    container.querySelector('#btn-challenge-xp')?.addEventListener('click', async () => {
      try { await addXp('challenge', 50); } catch (err) { console.error(err); }
    });

    // Rate members
    container.querySelectorAll('.btn-rate').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = btn.dataset.memberId;
        ratingTarget = team?.members?.find(m => m._id === memberId) || null;
        selectedStars = 0;
        ratingFeedback = '';
        showRatingOverlay = true;
        renderPage();
      });
    });

    // Rating overlay
    container.querySelector('#rating-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'rating-overlay') closeRating();
    });
    container.querySelector('#rating-modal')?.addEventListener('click', e => e.stopPropagation());
    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => { selectedStars = parseInt(btn.dataset.star); renderPage(); });
    });
    container.querySelector('#btn-cancel-rating')?.addEventListener('click', closeRating);
    container.querySelector('#btn-submit-rating')?.addEventListener('click', submitRating);
  }

  async function sendTeamMessage() {
    if (!newMessage.trim()) return;
    const text = newMessage;
    newMessage = '';
    try {
      await teamService.sendMessage(teamId, text);
      await loadMessages();
    } catch (err) { console.error(err); }
  }

  function closeRating() {
    showRatingOverlay = false;
    ratingTarget = null;
    selectedStars = 0;
    ratingFeedback = '';
    renderPage();
  }

  async function submitRating() {
    if (!selectedStars || !ratingTarget) return;
    try {
      await teamService.rateMember(teamId, ratingTarget._id, selectedStars);
      ratingFeedback = 'Bewertung gespeichert! ⭐';
      renderPage();
      setTimeout(closeRating, 1500);
    } catch (err) {
      ratingFeedback = err.error?.message || 'Fehler beim Bewerten';
      renderPage();
    }
  }

  init();

  return () => {
    if (timerInterval) clearInterval(timerInterval);
    if (pollInterval) clearInterval(pollInterval);
    teamSession.clearActiveTeam();
  };
}
