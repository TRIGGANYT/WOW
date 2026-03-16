// js/pages/home.js — replaces Angular HomeComponent
import { getCurrentUser, getLevelTitle, getLevelProgress, getXpForNextLevel, getXpAtLevel } from '../services/user.service.js';
import { navigateTo } from '../router.js';
import { isLoggedIn, logout } from '../services/auth.service.js';
import { clearCache } from '../services/user.service.js';

export function render(container) {
  if (!isLoggedIn()) { navigateTo('/'); return; }

  let user = null;

  async function init() {
    try {
      user = await getCurrentUser();
    } catch (err) {
      console.error('Error loading user:', err);
    }
    renderPage();
  }

  function getMentorTitle() {
    return getLevelTitle(user?.mentorLevel || 1);
  }

  function getChallengeTitle() {
    return getLevelTitle(user?.challengeLevel || 1);
  }

  function getMentorProgress() {
    return getLevelProgress(user?.mentorXp || 0, user?.mentorLevel || 1);
  }

  function getChallengeProgress() {
    return getLevelProgress(user?.challengeXp || 0, user?.challengeLevel || 1);
  }

  function getElfImage() {
    const level = user?.mentorLevel || 1;
    if (level >= 9) return 'assets/images/WOW_Elf_Master_No_BG.png';
    if (level >= 5) return 'assets/images/WOW_Elf_Designer_No_BG.png';
    return 'assets/images/WOW_Elf_Explorer_No_BG.png';
  }

  function getElfTitle() {
    return getMentorTitle();
  }

  function renderPage() {
    container.innerHTML = `
      <div class="page-home">
        <div class="home-content">
          <!-- Mentor XP Bar (Links) -->
          <div class="xp-bar-container left">
            <span class="xp-title">${getMentorTitle()}</span>
            <div class="xp-progress">
              <div class="xp-fill mentor-gradient" style="height: ${getMentorProgress()}%"></div>
            </div>
            <div class="xp-icon">
              <i class="fa-solid fa-trophy"></i>
              <span class="level-badge">${user?.mentorLevel || 1}</span>
            </div>
            <span class="xp-value">${user?.mentorXp || 0} XP</span>
          </div>

          <a href="#/profile" class="elf-link">
            ${user ? `
              <img class="elf" src="${getElfImage()}" alt="WOW Elf" />
              <span class="elf-title-label">${getElfTitle()}</span>
            ` : `
              <div class="elf-placeholder"></div>
            `}
          </a>

          <!-- Challenge XP Bar (Rechts) -->
          <div class="xp-bar-container right">
            <span class="xp-title">${getChallengeTitle()}</span>
            <div class="xp-progress">
              <div class="xp-fill challenge-gradient" style="height: ${getChallengeProgress()}%"></div>
            </div>
            <div class="xp-icon">
              <i class="fa-solid fa-medal"></i>
              <span class="level-badge">${user?.challengeLevel || 1}</span>
            </div>
            <span class="xp-value">${user?.challengeXp || 0} XP</span>
          </div>
        </div>
      </div>
    `;
  }

  init();
}
