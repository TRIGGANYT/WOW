// js/app.js — App shell, replaces Angular App root component
import { registerRoute, initRouter, navigateTo, getCurrentPath } from './router.js';
import { isLoggedIn } from './services/auth.service.js';
import { renderNav } from './components/nav.js';
import { initButterflyOverlay, triggerButterflyAnimation, dismissButterfly } from './components/butterfly-animation.js';
import * as butterflySvc from './services/butterfly-notification.service.js';
import * as teamService from './services/team.service.js';

// Import pages
import { render as renderLogin } from './pages/login.js';
import { render as renderRegister } from './pages/register.js';
import { render as renderVerify } from './pages/verify.js';
import { render as renderHome } from './pages/home.js';
import { render as renderAicoach } from './pages/aicoach.js';
import { render as renderChallenges } from './pages/challenges.js';
import { render as renderTeamup } from './pages/teamup.js';
import { render as renderTeamDetail } from './pages/team-detail.js';
import { render as renderProfile } from './pages/profile.js';

// Auth guard wrapper
function withAuth(renderFn) {
  return (container, params) => {
    if (!isLoggedIn()) {
      navigateTo('/');
      return;
    }
    return renderFn(container, params);
  };
}

// Set up the app shell
function setupApp() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <img src="assets/images/logo.png" alt="WOW Logo" class="app-logo" id="app-logo" />
    <div id="nav-container"></div>
    <div id="router-outlet"></div>
  `;

  // Initialize butterfly overlay
  initButterflyOverlay();

  // Register routes (same paths as Angular)
  registerRoute('/', renderLogin);
  registerRoute('/register', renderRegister);
  registerRoute('/verify', renderVerify);
  registerRoute('/home', withAuth(renderHome));
  registerRoute('/aicoach', withAuth(renderAicoach));
  registerRoute('/challenges', withAuth(renderChallenges));
  registerRoute('/teamup', withAuth(renderTeamup));
  registerRoute('/team/:id', withAuth(renderTeamDetail));
  registerRoute('/profile', withAuth(renderProfile));

  // Update nav and shell on route changes
  window.addEventListener('routechange', updateShell);
  window.addEventListener('hashchange', () => {
    // Small delay to let the route render first
    setTimeout(updateShell, 10);
  });

  // Listen for butterfly events
  butterflySvc.onTrigger(() => {
    triggerButterflyAnimation('#teamup-nav-link');
  });

  // Start team polling for butterfly notifications
  startTeamPolling();

  // Initialize router (handles initial route)
  initRouter();

  // Initial shell update
  updateShell();
}

// Pages that should NOT show the shell (logo + nav)
const noShellPages = ['/', '/register', '/verify'];

function updateShell() {
  const path = getCurrentPath();
  const logo = document.getElementById('app-logo');
  const navContainer = document.getElementById('nav-container');

  const showShell = !noShellPages.includes(path) && isLoggedIn();

  if (logo) logo.style.display = showShell ? 'block' : 'none';

  if (navContainer) {
    if (showShell && path !== '/aicoach') {
      // AICoach renders its own nav
      renderNav(navContainer);
    } else {
      navContainer.innerHTML = '';
    }
  }
}

// Team polling for new team notifications (mirrors Angular App.pollTeams)
let teamPollInterval = null;
let knownTeamIds = new Set();

function startTeamPolling() {
  // Initial load
  loadTeamIds();
  // Poll every 10 seconds
  teamPollInterval = setInterval(loadTeamIds, 10000);
}

async function loadTeamIds() {
  if (!isLoggedIn()) return;
  try {
    const teams = await teamService.getTeams();
    const newIds = new Set(teams.map(t => t._id));

    // Check for new teams
    for (const id of newIds) {
      if (!knownTeamIds.has(id) && knownTeamIds.size > 0) {
        // New team detected
        butterflySvc.setNewTeamId(id);
        butterflySvc.triggerButterfly();
        break;
      }
    }

    knownTeamIds = newIds;
  } catch {
    // Ignore polling errors
  }
}

// Bootstrap
setupApp();
