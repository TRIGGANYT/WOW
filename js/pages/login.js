// js/pages/login.js — replaces Angular LoginComponent
import { login, saveToken, isLoggedIn, loginAsGuest } from '../services/auth.service.js';
import { navigateTo } from '../router.js';

export function render(container) {
  // If already logged in, redirect to home
  if (isLoggedIn()) {
    navigateTo('/home');
    return;
  }

  let email = '';
  let password = '';
  let error = '';
  let showPassword = false;

  function renderPage() {
    container.innerHTML = `
      <div class="page-login">
        <div class="login-container">
          <div class="login-box">
            <h2>Login</h2>
            <form id="login-form">
              <div class="input-group">
                <label>Email</label>
                <input id="login-email" type="email" value="${email}" required />
              </div>
              <div class="input-group">
                <label>Password</label>
                <div class="password-wrapper">
                  <input id="login-password" type="${showPassword ? 'text' : 'password'}" value="${password}" required />
                  <span class="password-toggle" id="toggle-password">
                    <i class="fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
                  </span>
                </div>
              </div>
              <button type="submit" class="btn-login">Login</button>
              ${error ? `<p class="error">${error}</p>` : ''}
            </form>
            <div class="login-separator">oder</div>
            <button type="button" class="btn-guest" id="btn-guest">Als Gast fortfahren</button>
            <p class="register-link">
              Noch kein Konto? <a href="#/register">Registrieren</a>
            </p>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    container.querySelector('#login-email').addEventListener('input', (e) => { email = e.target.value; });
    container.querySelector('#login-password').addEventListener('input', (e) => { password = e.target.value; });
    container.querySelector('#toggle-password').addEventListener('click', () => {
      showPassword = !showPassword;
      renderPage();
    });

    container.querySelector('#btn-guest').addEventListener('click', async () => {
      try {
        await loginAsGuest();
        navigateTo('/home');
      } catch (err) {
        error = 'Fehler beim Starten der Gastsitzung';
        renderPage();
      }
    });

    container.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      error = '';
      try {
        const res = await login(email, password);
        saveToken(res.accessToken);
        navigateTo('/home');
      } catch (err) {
        if (err.error?.needsVerification) {
          navigateTo('/verify?email=' + encodeURIComponent(err.error.email));
          return;
        }
        error = err.error?.message || 'Login fehlgeschlagen';
        renderPage();
      }
    });
  }

  renderPage();
}

