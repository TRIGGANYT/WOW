// js/pages/register.js — replaces Angular RegisterComponent
import { register, checkAvailable } from '../services/auth.service.js';
import { navigateTo } from '../router.js';

const lifeStageOptions = [
  { value: 'schueler', label: 'Schüler/in' },
  { value: 'lehrling', label: 'Lehrling' },
  { value: 'student', label: 'Student/in' },
  { value: 'berufserfahren', label: 'Berufserfahren' },
  { value: 'pensioniert', label: 'Pensioniert' },
];

const availableHobbies = [
  { icon: 'fa-solid fa-gamepad', label: 'Gaming' },
  { icon: 'fa-solid fa-book', label: 'Lesen' },
  { icon: 'fa-solid fa-music', label: 'Musik' },
  { icon: 'fa-solid fa-futbol', label: 'Sport' },
  { icon: 'fa-solid fa-palette', label: 'Kunst' },
  { icon: 'fa-solid fa-code', label: 'Programmieren' },
  { icon: 'fa-solid fa-utensils', label: 'Kochen' },
  { icon: 'fa-solid fa-plane', label: 'Reisen' },
  { icon: 'fa-solid fa-camera', label: 'Fotografie' },
  { icon: 'fa-solid fa-film', label: 'Filme' },
  { icon: 'fa-solid fa-mountain', label: 'Klettern' },
  { icon: 'fa-solid fa-guitar', label: 'Instrument' },
  { icon: 'fa-solid fa-dumbbell', label: 'Fitness' },
  { icon: 'fa-solid fa-seedling', label: 'Gärtnern' },
  { icon: 'fa-solid fa-dice', label: 'Brettspiele' },
  { icon: 'fa-solid fa-pen', label: 'Schreiben' },
  { icon: 'fa-solid fa-spa', label: 'Yoga' },
  { icon: 'fa-solid fa-bicycle', label: 'Radfahren' },
  { icon: 'fa-solid fa-masks-theater', label: 'Theater' },
  { icon: 'fa-solid fa-paw', label: 'Tiere' },
];

export function render(container) {
  let currentStep = 1;
  let email = '';
  let password = '';
  let showPassword = false;
  let username = '';
  let lifeStage = '';
  let age = 20;
  let hobbies = []; // array of { icon, label }
  let error = '';
  let success = '';

  function isHobbySelected(hobby) {
    return hobbies.some(h => h.label === hobby.label);
  }

  function renderPage() {
    container.innerHTML = `
      <div class="page-register">
        <div class="register-container">
          <div class="register-box">
            <!-- Step Indicator -->
            <div class="step-indicator">
              ${[1,2,3].map(step => `
                <div class="step-dot ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'done' : ''}"></div>
              `).join('')}
            </div>

            ${currentStep === 1 ? renderStep1() : ''}
            ${currentStep === 2 ? renderStep2() : ''}
            ${currentStep === 3 ? renderStep3() : ''}
          </div>
        </div>
      </div>
    `;
    attachListeners();
  }

  function renderStep1() {
    return `
      <div class="step-panel">
        <h2>Willkommen!</h2>
        <p class="step-subtitle">Erstelle dein Konto</p>

        <div class="input-group">
          <label>Email</label>
          <input id="reg-email" type="email" value="${email}" placeholder="deine@email.ch" />
        </div>

        <div class="input-group">
          <label>Passwort</label>
          <div class="password-wrapper">
            <input id="reg-password" type="${showPassword ? 'text' : 'password'}" value="${password}" placeholder="Mindestens 6 Zeichen" />
            <span class="password-toggle" id="toggle-password">
              <i class="fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </span>
          </div>
        </div>

        ${error ? `<p class="error">${error}</p>` : ''}

        <button class="btn-next" id="btn-next">
          Weiter <i class="fa-solid fa-arrow-right"></i>
        </button>

        <p class="login-link">Bereits ein Konto? <a href="#/">Login</a></p>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div class="step-panel">
        <h2>Über dich</h2>
        <p class="step-subtitle">Erzähl uns etwas über dich</p>

        <div class="input-group">
          <label>Benutzername</label>
          <input id="reg-username" type="text" value="${username}" placeholder="Dein Anzeigename" />
        </div>

        <div class="input-group">
          <label>Wo stehst du im Leben?</label>
          <select id="reg-lifestage">
            <option value="" disabled ${!lifeStage ? 'selected' : ''}>Bitte wählen...</option>
            ${lifeStageOptions.map(o => `<option value="${o.value}" ${lifeStage === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>

        <div class="input-group">
          <label>Alter: <span class="age-value">${age}</span></label>
          <input type="range" min="0" max="100" value="${age}" id="reg-age" class="age-slider" />
          <div class="slider-labels">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>

        ${error ? `<p class="error">${error}</p>` : ''}

        <div class="btn-row">
          <button class="btn-back" id="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Zurück
          </button>
          <button class="btn-next" id="btn-next">
            Weiter <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  function renderStep3() {
    return `
      <div class="step-panel">
        <h2>Deine Interessen</h2>
        <p class="step-subtitle">Was begeistert dich? Wähle mindestens eins.</p>

        ${hobbies.length > 0 ? `
          <div class="selected-hobbies">
            ${hobbies.map((h, i) => `
              <span class="selected-chip">
                <i class="${h.icon}"></i> ${h.label}
                <span class="chip-remove" data-remove="${i}">
                  <i class="fa-solid fa-xmark"></i>
                </span>
              </span>
            `).join('')}
          </div>
        ` : ''}

        <div class="hobby-bubbles">
          ${availableHobbies.map(h => `
            <button type="button" class="hobby-bubble ${isHobbySelected(h) ? 'selected' : ''}" data-hobby="${h.label}">
              <i class="${h.icon}"></i> ${h.label}
            </button>
          `).join('')}
        </div>

        ${error ? `<p class="error">${error}</p>` : ''}
        ${success ? `<p class="success">${success}</p>` : ''}

        <div class="btn-row">
          <button class="btn-back" id="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Zurück
          </button>
          <button class="btn-register" id="btn-register">
            Registrieren <i class="fa-solid fa-check"></i>
          </button>
        </div>
      </div>
    `;
  }

  function attachListeners() {
    // Step 1
    const emailInput = container.querySelector('#reg-email');
    if (emailInput) emailInput.addEventListener('input', e => { email = e.target.value; });

    const passInput = container.querySelector('#reg-password');
    if (passInput) passInput.addEventListener('input', e => { password = e.target.value; });

    const togglePw = container.querySelector('#toggle-password');
    if (togglePw) togglePw.addEventListener('click', () => { showPassword = !showPassword; renderPage(); });

    // Step 2
    const usernameInput = container.querySelector('#reg-username');
    if (usernameInput) usernameInput.addEventListener('input', e => { username = e.target.value; });

    const lifeStageSelect = container.querySelector('#reg-lifestage');
    if (lifeStageSelect) lifeStageSelect.addEventListener('change', e => { lifeStage = e.target.value; });

    const ageSlider = container.querySelector('#reg-age');
    if (ageSlider) ageSlider.addEventListener('input', e => {
      age = parseInt(e.target.value);
      const ageLabel = container.querySelector('.age-value');
      if (ageLabel) ageLabel.textContent = age;
    });

    // Next / Back buttons
    const btnNext = container.querySelector('#btn-next');
    if (btnNext) btnNext.addEventListener('click', () => nextStep());

    const btnBack = container.querySelector('#btn-back');
    if (btnBack) btnBack.addEventListener('click', () => { error = ''; currentStep--; renderPage(); });

    // Step 3 hobbies
    container.querySelectorAll('.hobby-bubble').forEach(btn => {
      btn.addEventListener('click', () => {
        const label = btn.dataset.hobby;
        const hobby = availableHobbies.find(h => h.label === label);
        if (!hobby) return;
        const idx = hobbies.findIndex(h => h.label === label);
        if (idx >= 0) {
          hobbies.splice(idx, 1);
        } else {
          hobbies.push(hobby);
        }
        renderPage();
      });
    });

    container.querySelectorAll('.chip-remove').forEach(chip => {
      chip.addEventListener('click', () => {
        const idx = parseInt(chip.dataset.remove);
        hobbies.splice(idx, 1);
        renderPage();
      });
    });

    // Register button
    const btnRegister = container.querySelector('#btn-register');
    if (btnRegister) btnRegister.addEventListener('click', () => onRegister());
  }

  async function nextStep() {
    if (currentStep === 1) {
      if (!email || !password) { error = 'Bitte fülle alle Felder aus.'; renderPage(); return; }
      if (password.length < 6) { error = 'Passwort muss mindestens 6 Zeichen lang sein.'; renderPage(); return; }
      error = '';
      try {
        const res = await checkAvailable(email);
        if (res.emailAvailable === false) { error = 'Diese Email ist bereits registriert.'; renderPage(); return; }
      } catch { /* let server handle it */ }
      currentStep++;
      renderPage();
      return;
    }
    if (currentStep === 2) {
      if (!username) { error = 'Bitte gib einen Benutzernamen ein.'; renderPage(); return; }
      error = '';
      try {
        const res = await checkAvailable(undefined, username);
        if (res.usernameAvailable === false) { error = 'Dieser Benutzername ist bereits vergeben.'; renderPage(); return; }
      } catch { /* let server handle it */ }
      currentStep++;
      renderPage();
      return;
    }
    error = '';
    currentStep++;
    renderPage();
  }

  async function onRegister() {
    error = '';
    success = '';
    if (hobbies.length === 0) { error = 'Wähle mindestens ein Interesse aus.'; renderPage(); return; }

    try {
      await register(email, password, username, age, hobbies.map(h => h.label), lifeStage);
      success = 'Verifikationscode wurde an deine Email gesendet!';
      renderPage();
      setTimeout(() => navigateTo('/verify?email=' + encodeURIComponent(email)), 1500);
    } catch (err) {
      error = err.error?.message || 'Registrierung fehlgeschlagen';
      renderPage();
    }
  }

  renderPage();
}
