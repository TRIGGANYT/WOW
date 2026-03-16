// js/services/team.service.js — replaces Angular TeamService
import { apiFetch } from '../api.js';

const API_URL = '/api/teams';

export async function getTeams() {
  return apiFetch(API_URL);
}

export async function getTeamById(teamId) {
  return apiFetch(`${API_URL}/${teamId}`);
}

export async function createTeam(data) {
  return apiFetch(API_URL, {
    method: 'POST',
    body: data,
  });
}

export async function joinTeam(teamId) {
  return apiFetch(`${API_URL}/${teamId}/join`, { method: 'POST', body: {} });
}

export async function leaveTeam(teamId) {
  return apiFetch(`${API_URL}/${teamId}/leave`, { method: 'DELETE' });
}

export async function deleteTeam(teamId) {
  return apiFetch(`${API_URL}/${teamId}`, { method: 'DELETE' });
}

export async function voteDissolve(teamId) {
  return apiFetch(`${API_URL}/${teamId}/vote-dissolve`, { method: 'POST', body: {} });
}

// Chat methods
export async function getMessages(teamId) {
  return apiFetch(`${API_URL}/${teamId}/messages`);
}

export async function sendMessage(teamId, text) {
  return apiFetch(`${API_URL}/${teamId}/messages`, {
    method: 'POST',
    body: { text },
  });
}

export async function rateMember(teamId, ratedUserId, stars) {
  return apiFetch(`${API_URL}/${teamId}/rate`, {
    method: 'POST',
    body: { ratedUserId, stars },
  });
}
