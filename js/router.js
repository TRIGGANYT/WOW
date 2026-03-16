// js/router.js — Hash-based SPA router
const routes = [];
let currentCleanup = null;
let currentPath = null;

export function registerRoute(path, renderFunktion) {
  routes.push({ path, renderFn: renderFunktion });
}

export function navigateTo(path) {
  window.location.hash = '#' + path;
}

export function getCurrentPath() {
  return window.location.hash.slice(1) || '/';
}

export function getQueryParams() {
  const hash = window.location.hash;

  if (!hash.includes('?')) {
    return {};
  }

  const start = hash.indexOf('?') + 1;
  const searchStr = hash.slice(start);
  const params = new URLSearchParams(searchStr);

  return Object.fromEntries(params);
}

function matchRoute(hash) {
  const path = hash.split('?')[0]; // strip query string
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params !== null) {
      return { route, params };
    }
  }
  return null;
}

function matchPath(pattern, path) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function handleRoute() {
  const hash = getCurrentPath();

  // Don't re-render if path hasn't changed
  if (hash === currentPath) return;
  currentPath = hash;

  // Clean up previous page
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  const container = document.getElementById('router-outlet');
  if (!container) return;

  const match = matchRoute(hash);
  if (match) {
    const cleanup = match.route.renderFn(container, match.params);
    if (typeof cleanup === 'function') {
      currentCleanup = cleanup;
    }
  } else {
    // Default: go to login
    navigateTo('/');
  }

  // Dispatch a custom event for shell updates (nav active state, etc.)
  window.dispatchEvent(new CustomEvent('routechange', { detail: { path: hash } }));
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Initial route
  handleRoute();
}

// Force re-navigation (e.g., after login)
export function forceRoute() {
  currentPath = null;
  handleRoute();
}
