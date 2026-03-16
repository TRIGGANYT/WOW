// js/pages/teamup.js — replaces Angular TeamupComponent + TeamCardComponent + CreateTeamModalComponent
import * as teamService from '../services/team.service.js';
import * as butterflySvc from '../services/butterfly-notification.service.js';
import { getCurrentUser } from '../services/user.service.js';
import { navigateTo } from '../router.js';
import { isLoggedIn } from '../services/auth.service.js';

export function render(container) {
  if (!isLoggedIn()) { navigateTo('/'); return; }

  let teams = [];
  let currentUser = null;
  let showCreateModal = false;
  let pollingInterval = null;

  async function init() {
    try {
      currentUser = await getCurrentUser();
    } catch {}
    await loadTeams();
    // Auto-redirect if user is already in a team
    checkActiveTeam();
    // Poll for updates
    pollingInterval = setInterval(loadTeams, 5000);
  }

  async function loadTeams() {
    try {
      teams = await teamService.getTeams();
      renderPage();
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  }

  function checkActiveTeam() {
    if (!currentUser || !teams.length) return;
    const myTeam = teams.find(t => t.members.some(m => m._id === currentUser._id));
    if (myTeam) {
      navigateTo('/team/' + myTeam._id);
    }
  }

  function isMember(team) {
    if (!currentUser) return false;
    return team.members.some(m => m._id === currentUser._id);
  }

  function renderPage() {
    const newTeamId = butterflySvc.getNewTeamId();

    container.innerHTML = `
      <div class="page-teamup">
        <div class="teamup-container">
          <header class="teamup-header"></header>
          <div class="teams-grid">
            ${teams.length === 0 ? `
              <div class="empty-state">
                <p>No teams yet. Be the first to create one!</p>
              </div>
            ` : teams.map(team => renderTeamCard(team, isMember(team), team._id === newTeamId)).join('')}
          </div>
          <button class="btn-create-team" id="btn-create-team">
            <i class="fa-solid fa-plus"></i> Create New Team
          </button>
        </div>
        ${showCreateModal ? renderCreateModal() : ''}
      </div>
    `;

    // Event listeners
    container.querySelector('#btn-create-team')?.addEventListener('click', () => {
      showCreateModal = true;
      renderPage();
    });

    // Team card buttons
    container.querySelectorAll('.btn-join').forEach(btn => {
      btn.addEventListener('click', async () => {
        const teamId = btn.dataset.teamId;
        try {
          await teamService.joinTeam(teamId);
          navigateTo('/team/' + teamId);
        } catch (err) {
          console.error('Join failed:', err);
        }
      });
    });

    container.querySelectorAll('.btn-leave').forEach(btn => {
      btn.addEventListener('click', async () => {
        const teamId = btn.dataset.teamId;
        try {
          await teamService.leaveTeam(teamId);
          await loadTeams();
        } catch (err) {
          console.error('Leave failed:', err);
        }
      });
    });

    // Butterfly badge clicks
    container.querySelectorAll('.team-butterfly-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        butterflySvc.clearNewTeamId();
        renderPage();
      });
    });

    // Create modal listeners
    if (showCreateModal) {
      attachModalListeners();
    }
  }

  function renderTeamCard(team, memberStatus, showButterfly) {
    return `
      <div class="team-card ${showButterfly ? 'has-butterfly' : ''}">
        ${showButterfly ? `
          <img class="team-butterfly-badge" src="assets/images/WOW_Schmetterling_Oben_No_BG.png" alt="New Team!">
        ` : ''}
        <div class="team-icon">${team.icon || ''}</div>
        <h3 class="team-name">${team.name}</h3>
        <p class="team-description">${team.description || ''}</p>
        <div class="team-members">
          <span>Members:</span>
          <span class="members-count">${team.members.length}/${team.maxMembers}</span>
        </div>
        ${memberStatus ? `
          <button class="btn-leave" data-team-id="${team._id}">Leave</button>
        ` : `
          <button class="btn-join" data-team-id="${team._id}" ${team.members.length >= team.maxMembers ? 'disabled' : ''}>
            ${team.members.length >= team.maxMembers ? 'Full' : 'Join'}
          </button>
        `}
      </div>
    `;
  }

  // Create Team Modal
  let modalName = '';
  let modalDescription = '';
  let modalIcon = '';
  let modalMaxMembers = 8;
  const icons = ['🎯', '🚀', '💡', '🔥', '⭐', '🎮', '📚', '🎨', '🌍', '💪', '🧠', '🎵'];

  function renderCreateModal() {
    return `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal-content" id="modal-content">
          <h2>Create New Team</h2>
          <div class="input-group">
            <label for="teamName">Team Name</label>
            <input type="text" id="teamName" placeholder="Enter team name..." value="${modalName}" required />
          </div>
          <div class="input-group">
            <label for="teamDescription">Description</label>
            <textarea id="teamDescription" placeholder="What is your team about?" rows="3">${modalDescription}</textarea>
          </div>
          <div class="input-group">
            <label>Choose an Icon</label>
            <div class="icon-grid">
              ${icons.map(ic => `
                <button type="button" class="icon-btn ${modalIcon === ic ? 'selected' : ''}" data-icon="${ic}">
                  <span>${ic}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="input-group">
            <label for="maxMembers">Max Members</label>
            <input type="number" id="maxMembers" value="${modalMaxMembers}" min="2" max="20" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" id="modal-cancel">Cancel</button>
            <button class="btn-create" id="modal-create" ${!modalName.trim() ? 'disabled' : ''}>Create Team</button>
          </div>
        </div>
      </div>
    `;
  }

  function attachModalListeners() {
    container.querySelector('#modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') { showCreateModal = false; renderPage(); }
    });
    container.querySelector('#modal-content')?.addEventListener('click', e => e.stopPropagation());
    container.querySelector('#teamName')?.addEventListener('input', e => { modalName = e.target.value; });
    container.querySelector('#teamDescription')?.addEventListener('input', e => { modalDescription = e.target.value; });
    container.querySelector('#maxMembers')?.addEventListener('input', e => { modalMaxMembers = parseInt(e.target.value) || 8; });
    container.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalIcon = btn.dataset.icon;
        renderPage();
      });
    });
    container.querySelector('#modal-cancel')?.addEventListener('click', () => { showCreateModal = false; renderPage(); });
    container.querySelector('#modal-create')?.addEventListener('click', async () => {
      if (!modalName.trim()) return;
      try {
        const team = await teamService.createTeam({
          name: modalName, description: modalDescription, icon: modalIcon, maxMembers: modalMaxMembers,
        });
        butterflySvc.setNewTeamId(team._id);
        butterflySvc.triggerButterfly();
        showCreateModal = false;
        modalName = ''; modalDescription = ''; modalIcon = ''; modalMaxMembers = 8;
        await loadTeams();
      } catch (err) {
        console.error('Create team failed:', err);
      }
    });
  }

  init();

  return () => {
    if (pollingInterval) clearInterval(pollingInterval);
  };
}
