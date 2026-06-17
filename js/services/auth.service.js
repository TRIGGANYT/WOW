// js/services/auth.service.js — replaces Angular AuthService
import { apiFetch } from '../api.js';

const TOKEN_KEY = 'token';
const API_URL = '/api/auth';

export async function login(email, password) {
  return apiFetch(`${API_URL}/login`, {
    method: 'POST',
    body: { email, password },
  });
}

export async function register(email, password, username, age, hobbies, lifeStage) {
  return apiFetch(`${API_URL}/register`, {
    method: 'POST',
    body: { email, password, username, age, hobbies, lifeStage },
  });
}

export async function verifyEmail(email, code) {
  return apiFetch(`${API_URL}/verify`, {
    method: 'POST',
    body: { email, code },
  });
}

export async function resendCode(email) {
  return apiFetch(`${API_URL}/resend-code`, {
    method: 'POST',
    body: { email },
  });
}

export async function checkAvailable(email, username) {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (username) params.set('username', username);
  return apiFetch(`${API_URL}/check-available?${params.toString()}`);
}

export async function loginAsGuest() {
  saveToken('guest_mode_token');
  return { accessToken: 'guest_mode_token' };
}

export function saveToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

