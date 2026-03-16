// js/pages/verify.js — replaces Angular VerifyComponent
import { verifyEmail, resendCode, saveToken } from '../services/auth.service.js';
import { navigateTo, getQueryParams } from '../router.js';

export function render(container) {
  const params = getQueryParams();
  const email = params.email || '';
  if (!email) { navigateTo('/register'); return; }

  let code = '';
  let error = '';
  let success = '';
  let resendCooldown = 0;
  let cooldownInterval = null;

  function renderPage() {
    container.innerHTML = `
      <div class="page-verify">
        <div class="verify-container">
          <div class="verify-box">
            <div class="email-icon">
              <i class="fa-solid fa-envelope-open-text"></i>
            </div>
            <h2>Email bestätigen</h2>
            <p class="subtitle">
              Wir haben einen 6-stelligen Code an<br />
              <strong>${email}</strong> gesendet.
            </p>
            <div class="code-input-group">
              <input type="text" id="verify-code" maxlength="6" placeholder="000000" class="code-input" autocomplete="one-time-code" value="${code}" />
            </div>
            ${error ? `<p class="error">${error}</p>` : ''}
            ${success ? `<p class="success">${success}</p>` : ''}
            <button class="btn-verify" id="btn-verify">
              <i class="fa-solid fa-check-circle"></i> Bestätigen
            </button>
            <div class="resend-row">
              <span class="resend-label">Kein Code erhalten?</span>
              <button class="btn-resend" id="btn-resend" ${resendCooldown > 0 ? 'disabled' : ''}>
                ${resendCooldown > 0 ? `Erneut senden (${resendCooldown}s)` : 'Erneut senden'}
              </button>
            </div>
            <div class="login-link">
              <a href="#/">Zurück zum Login</a>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#verify-code').addEventListener('input', e => { code = e.target.value; });
    container.querySelector('#verify-code').addEventListener('keyup', e => { if (e.key === 'Enter') onVerify(); });
    container.querySelector('#btn-verify').addEventListener('click', () => onVerify());
    container.querySelector('#btn-resend').addEventListener('click', () => onResend());
  }

  async function onVerify() {
    error = ''; success = '';
    if (!code || code.length !== 6) { error = 'Bitte gib den 6-stelligen Code ein.'; renderPage(); return; }
    try {
      const res = await verifyEmail(email, code);
      saveToken(res.accessToken);
      success = 'Email verifiziert! Weiterleitung...';
      renderPage();
      setTimeout(() => navigateTo('/home'), 1500);
    } catch (err) {
      error = err.error?.message || 'Verifizierung fehlgeschlagen';
      renderPage();
    }
  }

  async function onResend() {
    if (resendCooldown > 0) return;
    error = '';
    try {
      await resendCode(email);
      success = 'Neuer Code wurde gesendet!';
      startCooldown();
      renderPage();
    } catch (err) {
      error = err.error?.message || 'Code konnte nicht gesendet werden';
      renderPage();
    }
  }

  function startCooldown() {
    resendCooldown = 60;
    cooldownInterval = setInterval(() => {
      resendCooldown--;
      if (resendCooldown <= 0 && cooldownInterval) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
      renderPage();
    }, 1000);
  }

  renderPage();

  // Cleanup
  return () => {
    if (cooldownInterval) clearInterval(cooldownInterval);
  };
}
