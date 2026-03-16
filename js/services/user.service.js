// js/services/user.service.js — replaces Angular UserService
import { apiFetch } from '../api.js';
import { getToken } from './auth.service.js';

const API_URL = '/api/auth/me';
const AUTH_API_URL = '/api/auth';

let cachedUser = null;

export async function getCurrentUser() {
  if (cachedUser) return cachedUser;
  return fetchUser();
}

export async function refreshUser() {
  return fetchUser();
}

async function fetchUser() {
  const user = await apiFetch(API_URL);
  cachedUser = user;
  return user;
}

export function clearCache() {
  cachedUser = null;
}

export async function deleteAccount() {
  return apiFetch(API_URL, { method: 'DELETE' });
}

export async function addXp(type, amount) {
  const result = await apiFetch(`${AUTH_API_URL}/add-xp`, {
    method: 'POST',
    body: { type, amount },
  });
  // Refresh cache after XP change
  fetchUser().catch(() => {});
  return result;
}

export async function getRatingHistory(userId) {
  return apiFetch(`${AUTH_API_URL}/ratings/${userId}`);
}

export async function updateProfile(data) {
  const user = await apiFetch(API_URL, {
    method: 'PUT',
    body: data,
  });
  cachedUser = user;
  return user;
}

// Level titles tied to elf characters
export function getLevelTitle(level) {
  if (level >= 9) return 'Master';
  if (level >= 5) return 'Designer';
  return 'Explorer';
}

// XP needed for next level
export function getXpForNextLevel(level) {
  return Math.round(100 * Math.pow(1.5, level - 1));
}

// Cumulative XP at start of a level
export function getXpAtLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.round(100 * Math.pow(1.5, i - 1));
  }
  return total;
}

// Progress percentage within current level
export function getLevelProgress(xp, level) {
  const xpAtLevel = getXpAtLevel(level);
  const xpForNext = getXpForNextLevel(level);
  return Math.min(((xp - xpAtLevel) / xpForNext) * 100, 100);
}

// Avatar image based on mentor level (self = primary, other = secondary)
export function getAvatarSelf(mentorLevel) {
  const level = mentorLevel ?? 1;
  if (level >= 9) return 'assets/images/WOW_Master_Profilbild.png';
  if (level >= 5) return 'assets/images/WOW_Designer_Profilbild.png';
  return 'assets/images/WOW_Explorer_Profilbild.png';
}

export function getAvatarOther(mentorLevel) {
  const level = mentorLevel ?? 1;
  if (level >= 9) return 'assets/images/WOW_Master_Profilbild_2.png';
  if (level >= 5) return 'assets/images/WOW_Designer_Profilbild_2.png';
  return 'assets/images/WOW_Explorer_Profilbild_2.png';
}
