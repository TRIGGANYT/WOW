// js/api.js — HTTP helper replacing Angular HttpClient + authInterceptor
import { getToken, logout } from './services/auth.service.js';
import { clearCache } from './services/user.service.js';
import { navigateTo } from './router.js';

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
  });

  if (response.status === 401) {
    // Token expired or invalid → clear cache, logout and redirect
    clearCache();
    logout();
    navigateTo('/');
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Request failed' }));
    const err = new Error(errorBody.message || 'Request failed');
    err.status = response.status;
    err.error = errorBody;
    throw err;
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  return response.json();
}
