(function () {
  'use strict';

  function sk(k) {
    return window.MexAuth ? window.MexAuth.storageKey(k) : 'mex_guest_' + k;
  }

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(sk('profile')) || '{}');
    } catch {
      return {};
    }
  }

  function saveProfile(p) {
    localStorage.setItem(sk('profile'), JSON.stringify(p));
    if (window.MexAuth) window.MexAuth.syncToServer();
  }

  function getWorkoutDayType() {
    const d = window.__mexCurrentDay || 'push';
    if (d.includes('leg') || d === 'legs') return 'legs';
    if (d.includes('pull')) return 'pull';
    if (d.includes('rest')) return 'rest';
    if (d.includes('push') || d.includes('upper')) return 'push';
    return 'default';
  }

  function getMacroTemplate() {
    const db = window.MEX_TR_NUTRITION || {};
    const templates = db.macroTemplates || {};
    return templates[getWorkoutDayType()] || templates.default || { kcal: 2600, p: 170, c: 280, f: 75, label: 'Standart' };
  }

  function renderMacroPreview() {
    const el = document.getElementById('profileMacroPreview');
    if (!el) return;
    const m = getMacroTemplate();
    el.innerHTML = ['kcal', 'p', 'c', 'f']
      .map((key, i) => {
        const labels = ['Kalori', 'Protein', 'Karb', 'Yağ'];
        const vals = [m.kcal, m.p + 'g', m.c + 'g', m.f + 'g'];
        return `<div class="macro-ring"><div class="macro-ring-val">${vals[i]}</div><div class="macro-ring-lbl">${labels[i]}</div></div>`;
      })
      .join('');
  }

  function init() {
    const p = loadProfile();
    const user = window.MexAuth?.getUser?.();
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.value = p.name || user?.name || '';
    const h = document.getElementById('profileHeight');
    const w = document.getElementById('profileWeight');
    const g = document.getElementById('profileGoal');
    if (h) h.value = p.height || '';
    if (w) w.value = p.weight || '';
    if (g) g.value = p.goal || 'lean_bulk';
    renderMacroPreview();

    document.getElementById('profileSaveBtn')?.addEventListener('click', () => {
      saveProfile({
        name: nameEl?.value?.trim(),
        height: parseFloat(h?.value) || 0,
        weight: parseFloat(w?.value) || 0,
        goal: g?.value,
      });
      if (typeof showToast === 'function') showToast('Profil kaydedildi', 2500);
      renderMacroPreview();
    });

    document.getElementById('profileExportBtn')?.addEventListener('click', () => {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              profile: loadProfile(),
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mex-pro-export.json';
      a.click();
    });
  }

  window.MexProfile = { loadProfile, saveProfile, getMacroTemplate, getWorkoutDayType, renderMacroPreview, init };

  document.addEventListener('DOMContentLoaded', init);
})();
