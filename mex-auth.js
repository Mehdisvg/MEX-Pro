/**
 * MEX Pro — Üyelik (localhost API + misafir modu)
 */
(function () {
  'use strict';

  const API = '';
  const TOKEN_KEY = 'mex_auth_token';
  const USER_KEY = 'mex_auth_user';

  function apiUrl(path) {
    return API + path;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
    updateAuthUI();
    if (window.MexFeatures && window.MexFeatures.onAuthChange) window.MexFeatures.onAuthChange();
  }

  function storageKey(name) {
    const u = getUser();
    if (u && u.id) return `mex_u_${u.id}_${name}`;
    return `mex_guest_${name}`;
  }

  async function apiFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(apiUrl(path), { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'İstek başarısız');
    return data;
  }

  async function tryRestoreSession() {
    const token = getToken();
    if (!token) return false;
    try {
      const data = await apiFetch('/api/me');
      setSession(token, data.user);
      await syncFromServer();
      return true;
    } catch {
      setSession(null, null);
      return false;
    }
  }

  async function syncFromServer() {
    if (!getToken()) return;
    try {
      const remote = await apiFetch('/api/user-data');
      if (remote && remote.payload) {
        Object.entries(remote.payload).forEach(([k, v]) => {
          localStorage.setItem(storageKey(k), typeof v === 'string' ? v : JSON.stringify(v));
        });
      }
    } catch (_) {}
  }

  async function syncToServer() {
    if (!getToken()) return;
    const keys = ['set_memory', 'workout_sessions', 'custom_programs', 'pr_history', 'rest_seconds', 'profile', 'meal_log', 'activity_log', 'shop_list'];
    const payload = {};
    keys.forEach((k) => {
      const val = localStorage.getItem(storageKey(k));
      if (val) payload[k] = val;
    });
    try {
      await apiFetch('/api/user-data', { method: 'POST', body: JSON.stringify({ payload, savedAt: Date.now() }) });
    } catch (_) {}
  }

  function updateAuthUI() {
    const user = getUser();
    const badge = document.getElementById('authUserBadge');
    const gate = document.getElementById('authGate');
    const logoutBtn = document.getElementById('authLogoutBtn');
    if (badge) {
      if (user) {
        badge.textContent = user.name || user.email;
        badge.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    }
    const hideGate = !!user || localStorage.getItem('mex_guest_ok') === '1';
    if (gate) gate.classList.toggle('hidden', hideGate);
  }

  function initAuthForms() {
    const loginForm = document.getElementById('authLoginForm');
    const regForm = document.getElementById('authRegisterForm');
    const guestBtn = document.getElementById('authGuestBtn');
    const logoutBtn = document.getElementById('authLogoutBtn');
    const err = document.getElementById('authError');

    function showErr(msg) {
      if (err) {
        err.textContent = msg;
        err.style.display = 'block';
      }
    }

    document.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.getAttribute('data-auth-tab');
        if (loginForm) loginForm.style.display = mode === 'login' ? 'block' : 'none';
        if (regForm) regForm.style.display = mode === 'register' ? 'block' : 'none';
        if (err) err.style.display = 'none';
      });
    });

    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(loginForm);
        const data = await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
        });
        setSession(data.token, data.user);
        await syncFromServer();
        if (typeof showToast === 'function') showToast('Hoş geldin, ' + data.user.name + '!', 3000);
      } catch (ex) {
        showErr(ex.message);
      }
    });

    regForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(regForm);
        const data = await apiFetch('/api/register', {
          method: 'POST',
          body: JSON.stringify({
            email: fd.get('email'),
            password: fd.get('password'),
            name: fd.get('name'),
          }),
        });
        setSession(data.token, data.user);
        if (typeof showToast === 'function') showToast('Üyelik oluşturuldu!', 3000);
      } catch (ex) {
        showErr(ex.message);
      }
    });

    guestBtn?.addEventListener('click', () => {
      localStorage.setItem('mex_guest_ok', '1');
      updateAuthUI();
    });

    logoutBtn?.addEventListener('click', async () => {
      try {
        await apiFetch('/api/logout', { method: 'POST' });
      } catch (_) {}
      setSession(null, null);
      localStorage.removeItem('mex_guest_ok');
      updateAuthUI();
      if (typeof showToast === 'function') showToast('Çıkış yapıldı', 2000);
    });
  }

  function initGoogleSignIn() {
    const wrap = document.getElementById('googleSignInWrap');
    const clientId = window.MEX_CONFIG?.googleClientId;
    if (!wrap) return;
    if (!clientId || clientId.includes('BURAYA')) {
      wrap.innerHTML =
        '<p style="font-size:12px;color:var(--text3);text-align:center;padding:8px;background:rgba(255,255,255,0.03);border-radius:10px;">Google girişi yapılandırılmamış. Lütfen config.js dosyasını kontrol edin.</p>';
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          try {
            const data = await apiFetch('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential: resp.credential }),
            });
            setSession(data.token, data.user);
            await syncFromServer();
            if (typeof showToast === 'function') showToast('Google ile giriş: ' + data.user.name, 3000);
          } catch (ex) {
            const err = document.getElementById('authError');
            if (err) {
              err.textContent = ex.message;
              err.style.display = 'block';
            }
          }
        },
      });
      window.google.accounts.id.renderButton(wrap, {
        theme: 'filled_black',
        size: 'large',
        width: wrap.offsetWidth || 300,
        text: 'continue_with',
        shape: 'pill',
        locale: 'tr',
      });
    };
    document.head.appendChild(s);
  }

  async function init() {
    initAuthForms();
    initGoogleSignIn();
    const onLocalhost = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
    if (onLocalhost) {
      const ok = await tryRestoreSession();
      if (!ok && !localStorage.getItem('mex_guest_ok')) {
        updateAuthUI();
      } else {
        updateAuthUI();
      }
    } else {
      localStorage.setItem('mex_guest_ok', '1');
      updateAuthUI();
    }
  }

  window.MexAuth = {
    getToken,
    getUser,
    storageKey,
    syncToServer,
    syncFromServer,
    apiFetch,
    init,
  };

  window.getRestSeconds = function () {
    return parseInt(localStorage.getItem(window.MexAuth.storageKey('rest_seconds')) || '90', 10);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
