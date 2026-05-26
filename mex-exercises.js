/**
 * MEX Pro — Bölge bazlı hareket kütüphanesi + program oluşturucu
 */
(function () {
  'use strict';

  let library = { regions: [] };
  let activeRegion = null;
  let pickerTargetDay = null;

  const REGION_CHIP_IDS = ['exerciseRegionChips', 'exerciseRegionChipsFull'];
  const LIST_CONFIG = [
    { listId: 'exerciseLibraryList', searchId: 'exerciseSearchBuilder', showAdd: true },
    { listId: 'exerciseLibraryListFull', searchId: 'exerciseSearch', showAdd: false },
  ];

  async function loadLibrary() {
    if (window.MEX_EXERCISE_LIBRARY?.regions?.length) {
      library = window.MEX_EXERCISE_LIBRARY;
      return;
    }
    const paths = ['/api/exercises', 'data/exercises.json', './data/exercises.json'];
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          library = await res.json();
          return;
        }
      } catch (_) {}
    }
    if (window.MEX_EXERCISE_LIBRARY?.regions?.length) {
      library = window.MEX_EXERCISE_LIBRARY;
    }
  }

  function totalExerciseCount() {
    return library.regions.reduce((n, r) => n + (r.exercises?.length || 0), 0);
  }

  function updateLibraryStats() {
    const el = document.getElementById('libraryTotalCount');
    const n = totalExerciseCount();
    if (el) el.textContent = n > 0 ? String(n) : '—';
  }

  function getDayExerciseTextarea(dayCard) {
    return dayCard.querySelector('.mex-custom-exercises');
  }

  function appendExerciseToDay(dayCard, name, badge) {
    const ta = getDayExerciseTextarea(dayCard);
    if (!ta) return;
    const line = `${name} | ${badge || '3x10'}`;
    ta.value = ta.value.trim() ? ta.value.trim() + '\n' + line : line;
    if (typeof showToast === 'function') showToast('+ ' + name, 1500);
  }

  function getSearchQuery(searchId) {
    return (document.getElementById(searchId)?.value || '').toLowerCase().trim();
  }

  function renderRegionChips() {
    if (!library.regions.length) return;
    if (!activeRegion) activeRegion = library.regions[0].id;

    REGION_CHIP_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = library.regions
        .map(
          (r) =>
            `<button type="button" class="day-chip${r.id === activeRegion ? ' active' : ''}" data-region="${r.id}">${r.icon} ${r.name}</button>`
        )
        .join('');
    });

    REGION_CHIP_IDS.forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (!container || container._mexRegionDelegated) return;
      container._mexRegionDelegated = true;
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-region]');
        if (!btn) return;
        activeRegion = btn.getAttribute('data-region');
        renderRegionChips();
        renderAllLists();
      });
    });
  }

  function exerciseItemHTML(ex, region, showAdd) {
    const safe = ex.name.replace(/"/g, '&quot;');
    const star =
      window.MexExerciseDetails?.hasDetail?.(ex.name) ? ' <span style="color:var(--accent);font-size:10px;">★</span>' : '';
    const addBtn = showAdd
      ? `<button type="button" class="exercise-lib-add" data-name="${safe}" data-badge="${ex.badge || '3x10'}">+</button>`
      : '';
    return `
      <div class="exercise-lib-item">
        <div class="exercise-lib-main" style="flex:1;cursor:pointer;" data-info-name="${safe}">
          <div class="exercise-lib-name">${ex.name}${star}</div>
          <div class="exercise-lib-meta">${region.name} • ${ex.badge || '3x10'}</div>
        </div>
        <button type="button" class="exercise-info-btn" data-name="${safe}" title="Açıklama">ℹ️</button>
        ${addBtn}
      </div>`;
  }

  function bindListInteractions(el, showAdd) {
    el.querySelectorAll('.exercise-lib-main').forEach((row) => {
      row.addEventListener('click', () => {
        const n = row.getAttribute('data-info-name');
        if (n && window.MexExerciseDetails) window.MexExerciseDetails.openModal(n);
      });
    });
    el.querySelectorAll('.exercise-info-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const n = btn.getAttribute('data-name');
        if (n && window.MexExerciseDetails) window.MexExerciseDetails.openModal(n);
      });
    });
    if (!showAdd) return;
    el.querySelectorAll('.exercise-lib-add').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dayCards = document.querySelectorAll('#customDayList .card');
        const target = pickerTargetDay != null ? dayCards[pickerTargetDay] : dayCards[dayCards.length - 1];
        if (!target) {
          if (typeof showToast === 'function') showToast('Önce bir gün ekle ve güne dokun', 2500);
          return;
        }
        appendExerciseToDay(target, btn.getAttribute('data-name'), btn.getAttribute('data-badge'));
      });
    });
  }

  function renderExerciseListTo(listId, searchId, showAdd) {
    const el = document.getElementById(listId);
    if (!el) return;

    const region = library.regions.find((r) => r.id === activeRegion);
    if (!region) {
      el.innerHTML =
        '<p style="color:var(--text2);font-size:13px;padding:12px;">Hareket listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin veya uygulamayı yeniden başlatın.</p>';
      return;
    }

    const q = getSearchQuery(searchId);
    let filtered = region.exercises;
    if (q) filtered = region.exercises.filter((ex) => ex.name.toLowerCase().includes(q));

    if (!filtered.length) {
      el.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:16px;text-align:center;">Sonuç yok</p>';
      return;
    }

    el.innerHTML = filtered.map((ex) => exerciseItemHTML(ex, region, showAdd)).join('');
    bindListInteractions(el, showAdd);
  }

  function renderAllLists() {
    LIST_CONFIG.forEach((cfg) => renderExerciseListTo(cfg.listId, cfg.searchId, cfg.showAdd));
  }

  function bindDayPickers() {
    document.getElementById('customDayList')?.addEventListener('click', (e) => {
      const card = e.target.closest('#customDayList .card');
      if (!card) return;
      const cards = [...document.querySelectorAll('#customDayList .card')];
      pickerTargetDay = cards.indexOf(card);
      cards.forEach((c, i) => c.classList.toggle('day-pick-active', i === pickerTargetDay));
      if (typeof showToast === 'function') showToast('Seçili gün: ' + (pickerTargetDay + 1), 1200);
    });
  }

  function initRestSettings() {
    const sel = document.getElementById('customRestSeconds');
    const key = window.MexAuth ? window.MexAuth.storageKey('rest_seconds') : 'mex_rest_seconds';
    const saved = localStorage.getItem(key) || '90';
    if (sel) {
      sel.value = saved;
      sel.addEventListener('change', () => {
        localStorage.setItem(key, sel.value);
        if (typeof showToast === 'function') showToast('Dinlenme: ' + sel.value + ' sn', 2000);
      });
    }
  }

  function initProgramTabs() {
    const tabs = document.getElementById('programMainTabs');
    if (!tabs || tabs._mexTabsBound) return;
    tabs._mexTabsBound = true;

    const panels = {
      ready: document.getElementById('progPanel-ready'),
      builder: document.getElementById('progPanel-builder'),
      library: document.getElementById('progPanel-library'),
    };

    tabs.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-prog-tab]');
      if (!tab) return;
      const key = tab.getAttribute('data-prog-tab');
      tabs.querySelectorAll('.pro-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      Object.entries(panels).forEach(([k, panel]) => {
        if (panel) panel.classList.toggle('active', k === key);
      });
      if (key === 'library' || key === 'builder') renderAllLists();
    });
  }

  function showRestBar(seconds) {
    const bar = document.getElementById('restCountdownBar');
    const fill = document.getElementById('restCountdownFill');
    const label = document.getElementById('restCountdownLabel');
    if (!bar || !fill || !label) return;

    let left = seconds;
    bar.classList.add('show');
    label.textContent = 'Dinlenme: ' + left + ' sn';

    const update = () => {
      const pct = Math.max(0, (left / seconds) * 100);
      fill.style.width = pct + '%';
      label.textContent = 'Dinlenme: ' + left + ' sn';
    };
    update();

    if (window.__restBarIv) clearInterval(window.__restBarIv);
    window.__restBarIv = setInterval(() => {
      left--;
      update();
      if (left <= 0) {
        clearInterval(window.__restBarIv);
        bar.classList.remove('show');
        if (typeof showToast === 'function') showToast('Set hazır — devam!', 2000);
        try {
          if (navigator.vibrate) navigator.vibrate(200);
        } catch (_) {}
      }
    }, 1000);
  }

  window.MexExercises = {
    loadLibrary,
    renderRegionChips,
    renderExerciseList: renderAllLists,
    renderAllLists,
    showRestBar,
    getLibrary: () => library,
    init() {
      initProgramTabs();
      loadLibrary().then(() => {
        updateLibraryStats();
        const p = window.MexExerciseDetails ? window.MexExerciseDetails.loadDetails() : Promise.resolve();
        p.then(() => {
          renderRegionChips();
          renderAllLists();
        });
      });
      document.getElementById('exerciseSearch')?.addEventListener('input', renderAllLists);
      document.getElementById('exerciseSearchBuilder')?.addEventListener('input', renderAllLists);
      bindDayPickers();
      initRestSettings();
    },
  };

  window.startRestCountdown = function (sec) {
    const s = sec || (typeof window.getRestSeconds === 'function' ? window.getRestSeconds() : 90);
    if (window.MexExercises) window.MexExercises.showRestBar(s);
    if (typeof startTimer === 'function') startTimer(s);
  };

  document.getElementById('restSkipBtn')?.addEventListener('click', () => {
    const bar = document.getElementById('restCountdownBar');
    if (bar) bar.classList.remove('show');
    if (window.__restBarIv) clearInterval(window.__restBarIv);
    const overlay = document.getElementById('timerOverlay');
    if (overlay) overlay.classList.remove('show');
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (window.MexExercises) window.MexExercises.init();
  });
})();
