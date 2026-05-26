(function () {
  'use strict';

  let deferredPrompt = null;

  function initSW() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  function initInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });
    document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      } else if (typeof showToast === 'function') {
        showToast('Tarayıcı menüsünden Ana Ekrana Ekle', 4000);
      }
    });
  }

  function urlScreen() {
    const p = new URLSearchParams(location.search).get('screen');
    if (p && typeof showScreen === 'function') {
      showScreen(p);
      const map = { home: 0, workout: 1, programs: 2, progress: 3, more: 4, nutrition: -1, profile: -1 };
      if (map[p] >= 0) {
        document.querySelectorAll('.nav-btn').forEach((b, i) => b.classList.toggle('active', i === map[p]));
      }
    }
  }

  async function notify(title, body, url) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, { body, data: { url: url || '/' }, icon: '/manifest.json' });
    } else {
      new Notification(title, { body });
    }
  }

  function initNotify() {
    document.getElementById('notifyEnableBtn')?.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        if (typeof showToast === 'function') showToast('Bildirim desteklenmiyor', 3000);
        return;
      }
      const p = await Notification.requestPermission();
      if (typeof showToast === 'function') showToast(p === 'granted' ? 'Bildirimler açık' : 'İzin verilmedi', 3000);
    });
    document.getElementById('notifyWaterBtn')?.addEventListener('click', () => {
      notify('💧 Su iç', 'Hedefine yaklaşmak için bir bardak su.', '/?screen=water');
      if (typeof showToast === 'function') showToast('Su hatırlatıcısı ayarlandı (tek sefer)', 3000);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSW();
    initInstall();
    initNotify();
    urlScreen();
  });
})();
