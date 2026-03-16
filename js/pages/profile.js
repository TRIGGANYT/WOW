// js/pages/profile.js — replaces Angular ProfileComponent
import { getCurrentUser, refreshUser, clearCache, deleteAccount, getLevelTitle, getLevelProgress, getXpForNextLevel, getXpAtLevel, getRatingHistory, updateProfile, getAvatarSelf } from '../services/user.service.js';
import { logout, isLoggedIn } from '../services/auth.service.js';
import { navigateTo } from '../router.js';

const lifeStageOptions = [
  { value: 'schueler', label: 'Schüler/in' },
  { value: 'lehrling', label: 'Lehrling' },
  { value: 'student', label: 'Student/in' },
  { value: 'berufserfahren', label: 'Berufserfahren' },
  { value: 'pensioniert', label: 'Pensioniert' },
];

const availableHobbies = [
  { icon: 'fa-solid fa-gamepad', label: 'Gaming' },
  { icon: 'fa-solid fa-book', label: 'Lesen' },
  { icon: 'fa-solid fa-music', label: 'Musik' },
  { icon: 'fa-solid fa-futbol', label: 'Sport' },
  { icon: 'fa-solid fa-palette', label: 'Kunst' },
  { icon: 'fa-solid fa-code', label: 'Programmieren' },
  { icon: 'fa-solid fa-utensils', label: 'Kochen' },
  { icon: 'fa-solid fa-plane', label: 'Reisen' },
  { icon: 'fa-solid fa-camera', label: 'Fotografie' },
  { icon: 'fa-solid fa-film', label: 'Filme' },
  { icon: 'fa-solid fa-mountain', label: 'Klettern' },
  { icon: 'fa-solid fa-guitar', label: 'Instrument' },
  { icon: 'fa-solid fa-dumbbell', label: 'Fitness' },
  { icon: 'fa-solid fa-seedling', label: 'Gärtnern' },
  { icon: 'fa-solid fa-dice', label: 'Brettspiele' },
  { icon: 'fa-solid fa-pen', label: 'Schreiben' },
  { icon: 'fa-solid fa-spa', label: 'Yoga' },
  { icon: 'fa-solid fa-bicycle', label: 'Radfahren' },
  { icon: 'fa-solid fa-masks-theater', label: 'Theater' },
  { icon: 'fa-solid fa-paw', label: 'Tiere' },
];

const hobbyIconMap = {};
availableHobbies.forEach(h => { hobbyIconMap[h.label] = h.icon; });

export function render(container) {
  if (!isLoggedIn()) { navigateTo('/'); return; }

  let user = null;
  let showDeleteConfirm = false;
  let showRatingHistory = false;
  let showEditModal = false;
  let ratings = [];

  // Edit modal state
  let editUsername = '';
  let editLifeStage = '';
  let editAge = 20;
  let editHobbies = [];
  let editError = '';

  async function init() {
    try {
      user = await getCurrentUser();
    } catch (err) { console.error(err); }
    renderPage();
  }

  function getMentorTitle() { return getLevelTitle(user?.mentorLevel || 1); }
  function getMentorProgress() { return getLevelProgress(user?.mentorXp || 0, user?.mentorLevel || 1); }
  function getChallengeProgress() { return getLevelProgress(user?.challengeXp || 0, user?.challengeLevel || 1); }
  function getMentorXpInLevel() { return (user?.mentorXp || 0) - getXpAtLevel(user?.mentorLevel || 1); }
  function getMentorXpNeeded() { return getXpForNextLevel(user?.mentorLevel || 1); }
  function getChallengeXpInLevel() { return (user?.challengeXp || 0) - getXpAtLevel(user?.challengeLevel || 1); }
  function getChallengeXpNeeded() { return getXpForNextLevel(user?.challengeLevel || 1); }
  function getElfImage() { return getAvatarSelf(user?.mentorLevel); }
  function getHobbyIcon(label) { return hobbyIconMap[label] || 'fa-solid fa-star'; }
  function getDisplayName() { return user?.username || user?.email || 'User'; }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function getStarsDisplay(stars) {
    return '⭐'.repeat(stars);
  }

  function getRaterName(rating) {
    return rating.rater?.username || rating.rater?.email || 'User';
  }

  function renderPage() {
    container.innerHTML = `
      <div class="profile-page">
        <!-- Left: Avatar -->
        <div class="avatar-section">
          <div class="avatar-container">
            <img src="${getElfImage()}" alt="Profile Avatar" class="avatar-image" />
          </div>
          <h1 class="username">${getDisplayName()}</h1>
          <span class="level-title">${getMentorTitle()}</span>
          ${user?.hobbies?.length ? `
            <div class="hobbies-display">
              ${user.hobbies.map(h => `<span class="hobby-chip"><i class="${getHobbyIcon(h)}"></i> ${h}</span>`).join('')}
            </div>
          ` : ''}
          <button class="btn-edit-icon" id="btn-edit" title="Profil bearbeiten">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        </div>

        <!-- Middle: Level -->
        <div class="panel level-panel">
          <h2>Level</h2>
          <div class="xp-bars-container">
            <div class="xp-bar-wrapper">
              <div class="xp-bar-with-label">
                <span class="xp-label">${getMentorXpInLevel()} / ${getMentorXpNeeded()} XP</span>
                <div class="xp-progress">
                  <div class="xp-fill mentor-gradient" style="height: ${getMentorProgress()}%"></div>
                </div>
              </div>
              <div class="xp-icon">
                <span class="level-badge">${user?.mentorLevel || 1}</span>
                <i class="fa-solid fa-trophy"></i>
              </div>
            </div>
            <div class="xp-bar-wrapper">
              <div class="xp-bar-with-label">
                <span class="xp-label">${getChallengeXpInLevel()} / ${getChallengeXpNeeded()} XP</span>
                <div class="xp-progress">
                  <div class="xp-fill challenge-gradient" style="height: ${getChallengeProgress()}%"></div>
                </div>
              </div>
              <div class="xp-icon">
                <span class="level-badge">${user?.challengeLevel || 1}</span>
                <i class="fa-solid fa-medal"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="panel actions-panel">
          <a href="#/home" class="btn-action btn-back">
            <i class="fa-solid fa-arrow-left"></i> Zurück zur Startseite
          </a>
          <button class="btn-action btn-ratings" id="btn-ratings">
            <i class="fa-solid fa-star"></i> Bewertungshistorie
          </button>
          <button class="btn-action btn-logout" id="btn-logout">
            <i class="fa-solid fa-right-from-bracket"></i> Ausloggen
          </button>
          <button class="btn-action btn-delete" id="btn-delete">
            <i class="fa-solid fa-trash"></i> Konto Löschen
          </button>
        </div>
      </div>

      <!-- Delete Overlay -->
      ${showDeleteConfirm ? `
        <div class="overlay" id="delete-overlay">
          <div class="confirm-modal" id="confirm-modal">
            <div class="confirm-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h2>Konto löschen?</h2>
            <p>Bist du sicher, dass du dein Konto <strong>ein für alle Mal</strong> löschen möchtest? Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden!</p>
            <div class="confirm-actions">
              <button class="btn-cancel" id="delete-cancel">Abbrechen</button>
              <button class="btn-confirm-delete" id="delete-confirm">Endgültig löschen</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Rating History Overlay -->
      ${showRatingHistory ? `
        <div class="overlay" id="ratings-overlay">
          <div class="rating-history-modal" id="ratings-modal">
            <h2>Bewertungshistorie</h2>
            ${ratings.length === 0 ? '<p class="no-ratings">Noch keine Bewertungen erhalten.</p>' : `
              <div class="ratings-list">
                ${ratings.map(r => `
                  <div class="rating-item">
                    <div class="rating-item-header">
                      <span class="rating-from">${getRaterName(r)}</span>
                      <span class="rating-stars">${getStarsDisplay(r.stars)}</span>
                    </div>
                    <div class="rating-item-meta">
                      <span class="rating-team"><i class="fa-solid fa-users"></i> ${r.team?.name || 'Team'}</span>
                      <span class="rating-date">${formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
            <button class="btn-close-history" id="close-ratings">Schliessen</button>
          </div>
        </div>
      ` : ''}

      <!-- Edit Profile Modal -->
      ${showEditModal ? renderEditModal() : ''}
    `;

    attachListeners();
  }

  function renderEditModal() {
    return `
      <div class="overlay" id="edit-overlay">
        <div class="edit-modal" id="edit-modal">
          <h2>Profil bearbeiten</h2>
          <div class="edit-field">
            <label>Benutzername</label>
            <input type="text" id="edit-username" value="${editUsername}" placeholder="Dein Anzeigename" />
          </div>
          <div class="edit-field">
            <label>Wo stehst du im Leben?</label>
            <select id="edit-lifestage">
              <option value="" disabled ${!editLifeStage ? 'selected' : ''}>Bitte wählen...</option>
              ${lifeStageOptions.map(o => `<option value="${o.value}" ${editLifeStage === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
            </select>
          </div>
          <div class="edit-field">
            <label>Alter: <span class="age-value">${editAge}</span></label>
            <input type="range" min="0" max="100" value="${editAge}" id="edit-age" class="age-slider" />
            <div class="slider-labels"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
          </div>
          <div class="edit-field">
            <label>Interessen</label>
            <div class="edit-hobby-bubbles">
              ${availableHobbies.map(h => `
                <button type="button" class="edit-hobby-bubble ${editHobbies.includes(h.label) ? 'selected' : ''}" data-hobby="${h.label}">
                  <i class="${h.icon}"></i> ${h.label}
                </button>
              `).join('')}
            </div>
          </div>
          ${editError ? `<p class="edit-error">${editError}</p>` : ''}
          <div class="edit-actions">
            <button class="btn-cancel" id="edit-cancel">Abbrechen</button>
            <button class="btn-save" id="edit-save"><i class="fa-solid fa-check"></i> Speichern</button>
          </div>
        </div>
      </div>
    `;
  }

  function attachListeners() {
    container.querySelector('#btn-edit')?.addEventListener('click', () => {
      editUsername = user?.username || '';
      editLifeStage = user?.lifeStage || '';
      editAge = user?.age || 20;
      editHobbies = [...(user?.hobbies || [])];
      editError = '';
      showEditModal = true;
      renderPage();
    });

    container.querySelector('#btn-logout')?.addEventListener('click', () => {
      clearCache(); logout(); navigateTo('/');
    });

    container.querySelector('#btn-delete')?.addEventListener('click', () => {
      showDeleteConfirm = true; renderPage();
    });

    container.querySelector('#btn-ratings')?.addEventListener('click', async () => {
      try {
        ratings = await getRatingHistory(user._id);
      } catch { ratings = []; }
      showRatingHistory = true;
      renderPage();
    });

    // Delete overlay
    container.querySelector('#delete-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'delete-overlay') { showDeleteConfirm = false; renderPage(); }
    });
    container.querySelector('#confirm-modal')?.addEventListener('click', e => e.stopPropagation());
    container.querySelector('#delete-cancel')?.addEventListener('click', () => { showDeleteConfirm = false; renderPage(); });
    container.querySelector('#delete-confirm')?.addEventListener('click', async () => {
      try { await deleteAccount(); clearCache(); logout(); navigateTo('/'); } catch (err) { console.error(err); }
    });

    // Ratings overlay
    container.querySelector('#ratings-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'ratings-overlay') { showRatingHistory = false; renderPage(); }
    });
    container.querySelector('#ratings-modal')?.addEventListener('click', e => e.stopPropagation());
    container.querySelector('#close-ratings')?.addEventListener('click', () => { showRatingHistory = false; renderPage(); });

    // Edit overlay
    container.querySelector('#edit-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'edit-overlay') { showEditModal = false; renderPage(); }
    });
    container.querySelector('#edit-modal')?.addEventListener('click', e => e.stopPropagation());
    container.querySelector('#edit-username')?.addEventListener('input', e => { editUsername = e.target.value; });
    container.querySelector('#edit-lifestage')?.addEventListener('change', e => { editLifeStage = e.target.value; });
    container.querySelector('#edit-age')?.addEventListener('input', e => {
      editAge = parseInt(e.target.value);
      const label = container.querySelector('.age-value');
      if (label) label.textContent = editAge;
    });
    container.querySelectorAll('.edit-hobby-bubble').forEach(btn => {
      btn.addEventListener('click', () => {
        const label = btn.dataset.hobby;
        const idx = editHobbies.indexOf(label);
        if (idx >= 0) editHobbies.splice(idx, 1);
        else editHobbies.push(label);
        renderPage();
      });
    });
    container.querySelector('#edit-cancel')?.addEventListener('click', () => { showEditModal = false; renderPage(); });
    container.querySelector('#edit-save')?.addEventListener('click', async () => {
      editError = '';
      if (!editUsername.trim()) { editError = 'Benutzername darf nicht leer sein.'; renderPage(); return; }
      try {
        user = await updateProfile({ username: editUsername, lifeStage: editLifeStage, age: editAge, hobbies: editHobbies });
        showEditModal = false;
        renderPage();
      } catch (err) {
        editError = err.error?.message || 'Fehler beim Speichern';
        renderPage();
      }
    });
  }

  init();
}
