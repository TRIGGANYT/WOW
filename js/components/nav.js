// js/components/nav.js — replaces Angular NavComponent
import { getCurrentPath } from '../router.js';

export function renderNav(container) {
  if (!container) return;

  const currentPath = getCurrentPath();

  const links = [
    { path: '/home', label: 'Home' },
    { path: '/teamup', label: 'Team-Up', id: 'teamup-nav-link' },
    { path: '/challenges', label: 'Challenge' },
    { path: '/aicoach', label: 'AI-Mentor' },
  ];

  container.innerHTML = `
    <div class="nav">
      ${links.map(link => `
        <a href="#${link.path}" ${link.id ? `id="${link.id}"` : ''} class="${currentPath === link.path ? 'active' : ''}">${link.label}</a>
      `).join('')}
    </div>
  `;
}
