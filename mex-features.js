/**
 * MEX Pro — Set memory, analytics, custom programs, AI coach
 */
(function () {
  'use strict';

  function sk(name) {
    return window.MexAuth ? window.MexAuth.storageKey(name) : 'mex_guest_' + name;
  }

  function readKey(name, fallback) {
    try {
      const raw = localStorage.getItem(sk(name));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeKey(name, val) {
    localStorage.setItem(sk(name), JSON.stringify(val));
  }

  function readLegacy(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function setRowKey(dayKey, exIdx, setNum) {
    return `${dayKey}|${exIdx}|${setNum}`;
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDateTR(d) {
    return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTimeTR(d) {
    return new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function getSetsMemory() {
    const m = readKey('set_memory', null);
    if (m && Object.keys(m).length) return m;
    return readLegacy('mex_set_memory', {});
  }

  function saveSetMemory(key, data) {
    const mem = getSetsMemory();
    mem[key] = { ...mem[key], ...data, updatedAt: Date.now() };
    writeKey('set_memory', mem);
  }

  function getSessions() {
    const s = readKey('workout_sessions', null);
    if (s && s.length) return s;
    return readLegacy('mex_workout_sessions', []);
  }

  function addSession(session) {
    const list = getSessions();
    list.unshift(session);
    writeKey('workout_sessions', list.slice(0, 120));
    if (window.MexAuth) window.MexAuth.syncToServer();
  }

  function getPrHistory() {
    const h = readKey('pr_history', null);
    if (h) return h;
    return readLegacy('mex_pr_history', { bench: [], squat: [], pushup: [], weight: [] });
  }

  function pushPrHistory(type, value) {
    const h = getPrHistory();
    if (!h[type]) h[type] = [];
    h[type].push({ date: todayISO(), value: parseFloat(value) });
    writeKey('pr_history', h);
    if (window.MexAuth) window.MexAuth.syncToServer();
  }

  function getCustomPrograms() {
    const c = readKey('custom_programs', null);
    if (c && c.length) return c;
    return readLegacy('mex_custom_programs', []);
  }

  function saveCustomPrograms(list) {
    writeKey('custom_programs', list);
    if (window.MexAuth) window.MexAuth.syncToServer();
  }

  function getActiveCustomId() {
    return localStorage.getItem(sk('active_custom_id')) || localStorage.getItem('mex_active_custom_id');
  }

  function setActiveCustomId(id) {
    if (id) localStorage.setItem(sk('active_custom_id'), id);
    else {
      localStorage.removeItem(sk('active_custom_id'));
      localStorage.removeItem('mex_active_custom_id');
    }
  }

  function collectWorkoutFromDOM(dayKey) {
    const cards = document.querySelectorAll('#workoutContent .exercise-card');
    const exercises = [];
    let volume = 0;
    let doneSets = 0;

    cards.forEach((card, exIdx) => {
      const name = card.querySelector('.exercise-name')?.textContent?.trim() || `Hareket ${exIdx + 1}`;
      const sets = [];
      card.querySelectorAll('.set-row').forEach((row, si) => {
        const inputs = row.querySelectorAll('.set-input');
        const kg = parseFloat(inputs[0]?.value) || 0;
        const reps = parseInt(inputs[1]?.value, 10) || 0;
        const check = row.querySelector('.set-check');
        const done = check?.classList.contains('done');
        const typeEl = row.querySelector('[title*="Normal"]') || row.children[1];
        const type = typeEl?.textContent?.trim() || 'N';
        if (done) {
          doneSets++;
          volume += kg * reps;
        }
        sets.push({ setNum: si + 1, kg, reps, done, type });
        saveSetMemory(setRowKey(dayKey, exIdx, si + 1), { kg: inputs[0]?.value ?? '', reps: inputs[1]?.value ?? '', done, type });
      });
      exercises.push({ name, sets });
    });

    return { exercises, volume, doneSets };
  }

  function restoreSetsForDay(dayKey) {
    const mem = getSetsMemory();
    document.querySelectorAll('#workoutContent .exercise-card').forEach((card, exIdx) => {
      card.querySelectorAll('.set-row').forEach((row, si) => {
        const key = setRowKey(dayKey, exIdx, si + 1);
        const saved = mem[key];
        if (!saved) return;
        const inputs = row.querySelectorAll('.set-input');
        if (inputs[0] && saved.kg !== undefined) inputs[0].value = saved.kg;
        if (inputs[1] && saved.reps !== undefined) inputs[1].value = saved.reps;
        const check = row.querySelector('.set-check');
        if (check && saved.done) {
          check.classList.add('done');
          check.innerHTML = '✓';
          check.style.color = '#000';
        }
        const typeEl = row.querySelector('[title*="Normal"]') || row.children[1];
        if (typeEl && saved.type) typeEl.textContent = saved.type;
      });
    });
  }

  function renderWeekLog() {
    const el = document.getElementById('weekLog');
    if (!el) return;
    const sessions = getSessions().slice(0, 8);
    if (!sessions.length) {
      el.innerHTML = '<div class="week-log-row"><div><div class="week-log-day">Henüz kayıt yok</div><div class="week-log-type">Antrenman bitirince burada görünür</div></div><div class="week-log-check">⬜</div></div>';
      return;
    }
    el.innerHTML = sessions
      .map(
        (s) => `
      <div class="week-log-row">
        <div>
          <div class="week-log-day">${s.dayLabel || s.dayKey} — ${s.doneSets || 0} set</div>
          <div class="week-log-type">${formatDateTR(s.date)} • ${formatTimeTR(s.date)} • ${Math.round(s.volume || 0)} kg hacim</div>
        </div>
        <div class="week-log-check">✅</div>
      </div>`
      )
      .join('');
  }

  function drawLineChart(canvas, labels, values, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 320;
    const h = canvas.height = canvas.getAttribute('height') ? parseInt(canvas.getAttribute('height'), 10) : 140;
    ctx.clearRect(0, 0, w, h);
    const pad = { t: 12, r: 12, b: 28, l: 36 };
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const step = (w - pad.l - pad.r) / Math.max(values.length - 1, 1);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 4; i++) {
      const y = pad.t + ((h - pad.t - pad.b) * i) / 3;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
    }

    ctx.beginPath();
    values.forEach((v, i) => {
      const x = pad.l + i * step;
      const y = h - pad.b - ((v - min) / range) * (h - pad.t - pad.b);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    values.forEach((v, i) => {
      const x = pad.l + i * step;
      const y = h - pad.b - ((v - min) / range) * (h - pad.t - pad.b);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(112,112,160,0.9)';
    ctx.font = '10px DM Sans, sans-serif';
    labels.forEach((lb, i) => {
      const x = pad.l + i * step;
      ctx.fillText(lb, x - 8, h - 8);
    });
  }

  function drawBarChart(canvas, labels, values, color) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth || 320;
    const h = canvas.height = parseInt(canvas.getAttribute('height'), 10) || 120;
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...values, 1);
    const pad = { l: 8, r: 8, t: 8, b: 24 };
    const barW = (w - pad.l - pad.r) / values.length - 6;
    values.forEach((v, i) => {
      const bh = ((h - pad.t - pad.b) * v) / max;
      const x = pad.l + i * (barW + 6);
      const y = h - pad.b - bh;
      ctx.fillStyle = i === values.length - 1 ? color : 'rgba(61,255,138,0.35)';
      ctx.fillRect(x, y, barW, bh);
      ctx.fillStyle = 'rgba(112,112,160,0.9)';
      ctx.font = '9px DM Sans,sans-serif';
      ctx.fillText(String(Math.round(v)), x, y - 4);
      ctx.fillText(labels[i] || '', x, h - 10);
    });
  }

  let chartMode = 'volume';

  function renderMainChart() {
    const canvas = document.getElementById('mexMainChart');
    if (!canvas) return;
    const sessions = getSessions().slice(0, 8).reverse();

    if (chartMode === 'volume') {
      const labels = sessions.map((_, i) => `S${i + 1}`);
      const values = sessions.map((s) => s.volume || 0);
      if (!values.length) {
        drawBarChart(canvas, ['—'], [0], '#3dff8a');
        return;
      }
      drawBarChart(canvas, labels, values, '#3dff8a');
    } else if (chartMode === 'workouts') {
      const weeks = {};
      getSessions().forEach((s) => {
        const wk = new Date(s.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
        const key = new Date(s.date).toISOString().slice(0, 10).slice(0, 7);
        weeks[key] = (weeks[key] || 0) + 1;
      });
      const keys = Object.keys(weeks).slice(-6);
      drawBarChart(canvas, keys.map((k) => k.slice(5)) || ['—'], keys.map((k) => weeks[k]) || [0], '#47b8ff');
    } else {
      const h = getPrHistory();
      const bench = h.bench || [];
      const labels = bench.slice(-6).map((x) => x.date.slice(5));
      const values = bench.slice(-6).map((x) => x.value);
      if (!values.length) {
        const cur = parseFloat(localStorage.getItem('mex_pr_bench') || '60');
        drawLineChart(canvas, ['Şimdi'], [cur], '#ff6b35');
        return;
      }
      drawLineChart(canvas, labels, values, '#ff6b35');
    }

    const summary = document.getElementById('mexChartSummary');
    if (summary) {
      const totalVol = getSessions().reduce((a, s) => a + (s.volume || 0), 0);
      const avgSets = getSessions().length
        ? Math.round(getSessions().reduce((a, s) => a + (s.doneSets || 0), 0) / getSessions().length)
        : 0;
      summary.innerHTML = `
        <div class="hero-stats" style="margin-top:12px;">
          <div class="hero-stat"><div class="hero-stat-val">${getSessions().length}</div><div class="hero-stat-lbl">Kayıt</div></div>
          <div class="hero-stat"><div class="hero-stat-val">${Math.round(totalVol)}</div><div class="hero-stat-lbl">Toplam kg</div></div>
          <div class="hero-stat"><div class="hero-stat-val">${avgSets}</div><div class="hero-stat-lbl">Ort. set</div></div>
        </div>`;
    }
  }

  function renderEnhancedStats() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;

    const sessions = getSessions();
    const last7 = sessions.slice(0, 7);
    const prData = {
      'Bench Press': getPrHistory().bench?.map((x) => x.value) || [
        parseInt(localStorage.getItem('mex_pr_bench') || '60', 10),
      ],
      Squat: getPrHistory().squat?.map((x) => x.value) || [parseInt(localStorage.getItem('mex_pr_squat') || '120', 10)],
    };

    statsContent.innerHTML = `
      <div class="card" style="margin-bottom:14px;">
        <div class="section-title">📈 Son 7 Antrenman Hacmi</div>
        <canvas id="statsVolumeChart" height="100" style="width:100%;display:block;margin-top:8px;"></canvas>
      </div>
      ${Object.entries(prData)
        .map(([name, data]) => {
          const max = Math.max(...data, 1);
          return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:600;font-size:14px;">${name}</div>
          <div style="font-family:var(--font);font-size:20px;color:var(--accent);">PR: ${data[data.length - 1]}kg</div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:60px;">
          ${data
            .map(
              (v, i) => `<div style="flex:1;background:${i === data.length - 1 ? 'var(--accent)' : 'rgba(61,255,138,0.28)'};border-radius:4px 4px 0 0;height:${(v / max) * 100}%;min-height:8px;"></div>`
            )
            .join('')}
        </div>
      </div>`;
        })
        .join('')}
      <div class="card">
        <div class="section-title">🗂 Set Geçmişi</div>
        <div id="setHistoryList" style="font-size:13px;color:var(--text2);line-height:1.6;"></div>
      </div>`;

    const volCanvas = document.getElementById('statsVolumeChart');
    if (volCanvas && last7.length) {
      drawBarChart(
        volCanvas,
        last7.map((_, i) => `${i + 1}`).reverse(),
        last7.map((s) => s.volume || 0).reverse(),
        '#3dff8a'
      );
    }

    const histList = document.getElementById('setHistoryList');
    if (histList) {
      histList.innerHTML = sessions.length
        ? sessions
            .slice(0, 5)
            .map(
              (s) =>
                `<div style="padding:8px 0;border-bottom:1px solid var(--border);">${formatDateTR(s.date)} — <strong>${s.dayLabel}</strong>: ${s.doneSets} set, ${Math.round(s.volume)} kg hacim</div>`
            )
            .join('')
        : 'Henüz antrenman kaydı yok.';
    }
  }

  function applyCustomToWorkout(program) {
    if (!program || !window.workoutDayData) return;
    const prefix = 'custom_' + program.id;
    program.days.forEach((day, i) => {
      const key = prefix + '_' + i;
      window.workoutDayData[key] = {
        title: day.label || day.name || 'GÜN ' + (i + 1),
        color: day.color || 'var(--accent)',
        emoji: '⭐',
        desc: program.name,
        sets: (day.exercises?.length || 0) + ' hareket',
        warning: '',
        exercises: (day.exercises || []).map((ex) => ({
          name: ex.name,
          badge: ex.badge || '3x10',
          warn: '',
          muscle: ex.muscle || '💪',
          steps: ex.steps || ['Forma dikkat et', 'Kontrollü çalış', 'Setleri kaydet'],
        })),
      };
    });

    const selector = document.getElementById('daySelector');
    const content = document.getElementById('workoutContent');
    if (!selector || !content) return;

    const keys = program.days.map((_, i) => prefix + '_' + i);
    selector.innerHTML = program.days
      .map(
        (d, i) =>
          `<button class="day-chip${i === 0 ? ' active' : ''}" data-day-key="${keys[i]}">${(d.label || d.name || 'Gün').slice(0, 8)}</button>`
      )
      .join('');

    selector.querySelectorAll('.day-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selector.querySelectorAll('.day-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const dk = chip.getAttribute('data-day-key');
        window.__mexCurrentDay = dk;
        if (typeof window.buildWorkoutContent === 'function') {
          content.innerHTML = window.buildWorkoutContent(dk);
          if (typeof window.setupWorkoutButtons === 'function') window.setupWorkoutButtons();
          if (typeof window.reattachExerciseAccordions === 'function') window.reattachExerciseAccordions();
          onWorkoutRendered(dk);
        }
      });
    });

    window.__mexCurrentDay = keys[0];
    if (typeof window.buildWorkoutContent === 'function') {
      content.innerHTML = window.buildWorkoutContent(keys[0]);
      if (typeof window.setupWorkoutButtons === 'function') window.setupWorkoutButtons();
      if (typeof window.reattachExerciseAccordions === 'function') window.reattachExerciseAccordions();
      onWorkoutRendered(keys[0]);
    }
  }

  function renderCustomProgramsList() {
    const el = document.getElementById('customProgramsList');
    if (!el) return;
    const programs = getCustomPrograms();
    if (!programs.length) {
      el.innerHTML = '<div class="card" style="color:var(--text2);font-size:13px;">Henüz özel program yok. Aşağıdan oluştur.</div>';
      return;
    }
    el.innerHTML = programs
      .map(
        (p) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div>
            <div style="font-family:var(--font);font-size:20px;color:var(--accent);">${p.name}</div>
            <div style="font-size:12px;color:var(--text2);">${p.days.length} gün • ${p.days.reduce((a, d) => a + (d.exercises?.length || 0), 0)} hareket</div>
          </div>
          <button type="button" class="pr-save-btn mex-use-program" data-id="${p.id}" style="white-space:nowrap;">KULLAN</button>
        </div>
      </div>`
      )
      .join('');

    el.querySelectorAll('.mex-use-program').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prog = getCustomPrograms().find((x) => x.id === id);
        if (!prog) return;
        setActiveCustomId(id);
        if (prog.restSeconds) localStorage.setItem(sk('rest_seconds'), String(prog.restSeconds));
        applyCustomToWorkout(prog);
        showScreen('workout');
        if (typeof showToast === 'function') showToast('⭐ Özel program aktif: ' + prog.name, 3000);
      });
    });
  }

  function initCustomCreator() {
    const form = document.getElementById('customProgramForm');
    const dayList = document.getElementById('customDayList');
    if (!form || !dayList) return;

    let dayCount = 0;

    function addDayRow() {
      dayCount++;
      const id = 'day-' + dayCount;
      const row = document.createElement('div');
      row.className = 'card';
      row.style.marginBottom = '10px';
      row.innerHTML = `
        <div style="font-size:12px;color:var(--accent);margin-bottom:8px;">Gün ${dayCount}</div>
        <input class="pr-input mex-custom-day-label" placeholder="Gün adı (ör. Push)" style="width:100%;margin-bottom:8px;">
        <textarea class="mex-custom-exercises" placeholder="Her satır: Hareket adı | 4x8&#10;Örn: Bench Press | 4x8" rows="4" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px;color:var(--text);font-family:inherit;font-size:13px;"></textarea>
      `;
      dayList.appendChild(row);
    }

    document.getElementById('customAddDayBtn')?.addEventListener('click', addDayRow);
    addDayRow();
    addDayRow();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('customProgramName')?.value?.trim();
      if (!name) {
        if (typeof showToast === 'function') showToast('Program adı gir', 2500);
        return;
      }
      const days = [];
      dayList.querySelectorAll('.card').forEach((card, i) => {
        const label = card.querySelector('.mex-custom-day-label')?.value?.trim() || 'Gün ' + (i + 1);
        const raw = card.querySelector('.mex-custom-exercises')?.value || '';
        const exercises = raw
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [n, badge] = line.split('|').map((s) => s.trim());
            return { name: n || line, badge: badge || '3x10' };
          });
        if (exercises.length) days.push({ label, name: label, color: 'var(--accent3)', exercises });
      });
      if (!days.length) {
        if (typeof showToast === 'function') showToast('En az bir gün ve hareket ekle', 2500);
        return;
      }
      const restSec = parseInt(document.getElementById('customRestSeconds')?.value || '90', 10);
      localStorage.setItem(sk('rest_seconds'), String(restSec));

      const programs = getCustomPrograms();
      const id = 'p_' + Date.now();
      programs.unshift({ id, name, days, restSeconds: restSec, createdAt: Date.now() });
      saveCustomPrograms(programs);
      setActiveCustomId(id);
      applyCustomToWorkout(programs[0]);
      renderCustomProgramsList();
      if (typeof showToast === 'function') showToast('✅ Program kaydedildi ve aktif!', 3000);
      showScreen('workout');
    });

    renderCustomProgramsList();
  }

  function hookPrSaves() {
    document.querySelectorAll('.pr-save-btn').forEach((btn, i) => {
      if (btn._mexPrHook) return;
      btn._mexPrHook = true;
      const orig = btn.onclick;
      btn.addEventListener(
        'click',
        () => {
          setTimeout(() => {
            const map = ['bench', 'squat', 'pushup', 'weight'];
            const keys = ['mex_pr_bench', 'mex_pr_squat', 'mex_pr_pushup', 'mex_pr_weight'];
            const val = localStorage.getItem(keys[i]);
            if (val) pushPrHistory(map[i], val);
            renderEnhancedStats();
            renderMainChart();
          }, 100);
        },
        true
      );
    });
  }

  function initChartTabs() {
    document.querySelectorAll('#chartTabs .chart-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#chartTabs .chart-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        chartMode = tab.getAttribute('data-chart') || 'volume';
        renderMainChart();
      });
    });
  }

  function initNavCards() {
    document.querySelectorAll('[data-mex-nav]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-mex-nav');
        if (!id) return;
        showScreen(id);
        if (id === 'nutrition' && window.MexNutrition) window.MexNutrition.renderDashboard();
        if (id === 'profile' && window.MexProfile) window.MexProfile.renderMacroPreview();
      });
    });
  }

  function onWorkoutRendered(dayKey) {
    const dk = dayKey || window.__mexCurrentDay || 'push';
    setTimeout(() => restoreSetsForDay(dk), 50);
  }

  function recordSession(dayLabel) {
    const dayKey = window.__mexCurrentDay || 'push';
    const payload = collectWorkoutFromDOM(dayKey);
    addSession({
      id: 's_' + Date.now(),
      date: new Date().toISOString(),
      dayKey,
      dayLabel: dayLabel || dayKey,
      ...payload,
    });
    renderWeekLog();
    renderMainChart();
    renderEnhancedStats();
    if (typeof updateHomeStats === 'function') updateHomeStats();
  }

  document.addEventListener('input', (e) => {
    const inp = e.target.closest('#workoutContent .set-input');
    if (!inp) return;
    const row = inp.closest('.set-row');
    const card = inp.closest('.exercise-card');
    if (!row || !card) return;
    const exIdx = [...document.querySelectorAll('#workoutContent .exercise-card')].indexOf(card);
    const setIdx = [...card.querySelectorAll('.set-row')].indexOf(row);
    const inputs = row.querySelectorAll('.set-input');
    const dk = window.__mexCurrentDay || 'push';
    saveSetMemory(setRowKey(dk, exIdx, setIdx + 1), {
      kg: inputs[0]?.value ?? '',
      reps: inputs[1]?.value ?? '',
      done: row.querySelector('.set-check')?.classList.contains('done'),
    });
  });

  document.addEventListener(
    'click',
    (e) => {
      const check = e.target.closest('#workoutContent .set-check');
      if (!check) return;
      setTimeout(() => {
        const row = check.closest('.set-row');
        const card = check.closest('.exercise-card');
        const exIdx = [...document.querySelectorAll('#workoutContent .exercise-card')].indexOf(card);
        const setIdx = [...card.querySelectorAll('.set-row')].indexOf(row);
        const inputs = row.querySelectorAll('.set-input');
        const dk = window.__mexCurrentDay || 'push';
        saveSetMemory(setRowKey(dk, exIdx, setIdx + 1), {
          kg: inputs[0]?.value ?? '',
          reps: inputs[1]?.value ?? '',
          done: check.classList.contains('done'),
        });
      }, 0);
    },
    true
  );

  function init() {
    renderWeekLog();
    renderMainChart();
    renderEnhancedStats();
    initChartTabs();
    initCustomCreator();
    hookPrSaves();

    const activeId = getActiveCustomId();
    if (activeId) {
      const prog = getCustomPrograms().find((p) => p.id === activeId);
      if (prog) {
        if (prog.restSeconds) localStorage.setItem(sk('rest_seconds'), String(prog.restSeconds));
        applyCustomToWorkout(prog);
      }
    }

    if (window.MexExercises && window.MexExercises.loadLibrary) {
      window.MexExercises.loadLibrary().then(() => {
        window.MexExercises.renderRegionChips();
        window.MexExercises.renderExerciseList();
      });
    }

    window.addEventListener('resize', () => {
      renderMainChart();
    });
  }

  function onAuthChange() {
    renderWeekLog();
    renderMainChart();
    renderEnhancedStats();
    renderCustomProgramsList();
  }

  window.MexFeatures = {
    onWorkoutRendered,
    recordSession,
    renderEnhancedStats,
    renderMainChart,
    renderWeekLog,
    pushPrHistory,
    onAuthChange,
    init,
  };

  init();
})();

