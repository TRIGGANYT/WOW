// js/services/team-session.service.js — replaces Angular TeamSessionService
import { getToken } from './auth.service.js';

let activeTeamId = null;

// Global beforeunload listener
window.addEventListener('beforeunload', () => {
  sendBeaconLeave();
});

export function setActiveTeam(teamId) {
  activeTeamId = teamId;
}

export function clearActiveTeam() {
  activeTeamId = null;
}

export function getActiveTeamId() {
  return activeTeamId;
}

function sendBeaconLeave() {
  if (!activeTeamId) return;

  const token = getToken();
  if (!token) return;

  const url = `/api/teams/${activeTeamId}/beacon-leave`;
  const data = JSON.stringify({ token });
  navigator.sendBeacon(url, new Blob([data], { type: 'text/plain' }));

  activeTeamId = null;
}
