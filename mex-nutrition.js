(function () {
  'use strict';

  let db = { foods: [], recipes: [], macroTemplates: {} };
  let todayLog = [];
  let barcodeStream = null;

  function sk(k) {
    return window.MexAuth ? window.MexAuth.storageKey(k) : 'mex_guest_' + k;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadLog() {
    const all = JSON.parse(localStorage.getItem(sk('meal_log')) || '{}');
    todayLog = all[todayKey()] || [];
    return todayLog;
  }

  function saveLog() {
    const all = JSON.parse(localStorage.getItem(sk('meal_log')) || '{}');
    all[todayKey()] = todayLog;
    localStorage.setItem(sk('meal_log'), JSON.stringify(all));
    if (window.MexAuth) window.MexAuth.syncToServer();
    renderDashboard();
  }

  async function loadDb() {
    if (window.MEX_TR_NUTRITION) {
      db = window.MEX_TR_NUTRITION;
      return;
    }
    for (const url of ['/api/tr-nutrition', 'data/tr-nutrition.json']) {
      try {
        const r = await fetch(url);
        if (r.ok) {
          db = await r.json();
          return;
        }
      } catch (_) {}
    }
  }

  function totals() {
    return todayLog.reduce(
      (a, m) => ({
        kcal: a.kcal + (m.kcal || 0),
        p: a.p + (m.p || 0),
        c: a.c + (m.c || 0),
        f: a.f + (m.f || 0),
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  }

  function addMeal(item) {
    todayLog.push({ ...item, time: new Date().toISOString() });
    saveLog();
    if (typeof showToast === 'function') showToast('+ ' + item.name, 2000);
  }

  function renderDashboard() {
    loadLog();
    const target = window.MexProfile?.getMacroTemplate?.() || { kcal: 2600, p: 170, c: 280, f: 75 };
    const t = totals();
    const ring = document.getElementById('nutMacroRings');
    if (ring) {
      ring.innerHTML = [
        { l: 'Kalori', v: t.kcal, m: target.kcal },
        { l: 'Protein', v: Math.round(t.p), m: target.p },
        { l: 'Karb', v: Math.round(t.c), m: target.c },
      ]
        .map(
          (x) =>
            `<div class="macro-ring"><div class="macro-ring-val">${x.v}</div><div class="macro-ring-lbl">${x.l} / ${x.m}</div></div>`
        )
        .join('');
    }
    const logEl = document.getElementById('nutMealLog');
    if (logEl) {
      logEl.innerHTML = todayLog.length
        ? todayLog
            .map(
              (m) =>
                `<div class="food-row"><span>${m.name}</span><span style="color:var(--accent)">${m.kcal} kcal</span></div>`
            )
            .join('')
        : '<p style="color:var(--text3);font-size:13px;">Henüz öğün yok</p>';
    }
    const tip = document.getElementById('nutWorkoutTipText');
    if (tip) {
      const day = window.MexProfile?.getWorkoutDayType?.() || 'default';
      const tips = {
        legs: 'Leg day: antrenmandan 2–3 saat önce karbonhidrat ağırlıklı öğün (pilav, yulaf). Sonrası protein + biraz karb.',
        push: 'Push: orta karb, yüksek protein. Antrenman öncesi hafif, sonrası 30–40g protein.',
        pull: 'Pull: protein odaklı. Antrenman sonrası whey veya tavuk + sebze.',
        rest: 'Dinlenme: kalori hedefinin biraz altında veya koruma. Protein yine yüksek tut.',
        default: 'Antrenman öncesi: hafif öğün. Sonrası: 2 saat içinde protein + karbonhidrat.',
      };
      tip.textContent = tips[day] || tips.default;
    }
  }

  function initTabs() {
    document.querySelectorAll('#nutritionTabs .pro-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#nutritionTabs .pro-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const id = tab.getAttribute('data-nut');
        document.querySelectorAll('[id^="nutPanel-"]').forEach((p) => p.classList.remove('active'));
        document.getElementById('nutPanel-' + id)?.classList.add('active');
      });
    });
  }

  function renderFoods(filter) {
    const el = document.getElementById('trFoodList');
    if (!el) return;
    const q = (filter || '').toLowerCase();
    const list = db.foods.filter((f) => !q || f.name.toLowerCase().includes(q) || (f.brand || '').toLowerCase().includes(q));
    el.innerHTML = list
      .map(
        (f) => `
      <div class="food-row">
        <div><div style="font-weight:600;font-size:13px;">${f.name}</div><div style="font-size:11px;color:var(--text3);">${f.brand}</div></div>
        <button type="button" class="exercise-lib-add tr-food-add" data-idx="${db.foods.indexOf(f)}">+</button>
      </div>`
      )
      .join('');
    el.querySelectorAll('.tr-food-add').forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = db.foods[parseInt(btn.getAttribute('data-idx'), 10)];
        if (f) addMeal({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f });
      });
    });
  }

  function renderRecipes() {
    const el = document.getElementById('recipeList');
    if (!el) return;
    el.innerHTML = (db.recipes || [])
      .map(
        (r) => `
      <div class="card" style="margin-bottom:10px;">
        <div style="font-weight:600;color:var(--accent);">${r.title}</div>
        <div style="font-size:12px;color:var(--text2);margin:6px 0;">${r.macros}</div>
        <div style="font-size:13px;color:var(--text2);">${(r.items || []).join(' • ')}</div>
        <button type="button" class="day-chip recipe-to-shop" style="margin-top:8px;width:100%;">Market listesine ekle</button>
      </div>`
      )
      .join('');
    el.querySelectorAll('.recipe-to-shop').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const items = db.recipes[i]?.items || [];
        const shop = JSON.parse(localStorage.getItem(sk('shop_list')) || '[]');
        items.forEach((it) => shop.push({ text: it, done: false }));
        localStorage.setItem(sk('shop_list'), JSON.stringify(shop));
        renderShop();
        if (typeof showToast === 'function') showToast('Listeye eklendi', 2000);
      });
    });
  }

  function renderShop() {
    const el = document.getElementById('shopList');
    if (!el) return;
    const shop = JSON.parse(localStorage.getItem(sk('shop_list')) || '[]');
    el.innerHTML = shop.length
      ? shop
          .map(
            (s, i) =>
              `<div class="food-row"><span style="${s.done ? 'text-decoration:line-through;opacity:0.5' : ''}">${s.text}</span><button type="button" class="exercise-info-btn shop-toggle" data-i="${i}">${s.done ? '↩' : '✓'}</button></div>`
          )
          .join('')
      : '<p style="font-size:13px;color:var(--text3);">Liste boş</p>';
    el.querySelectorAll('.shop-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shop = JSON.parse(localStorage.getItem(sk('shop_list')) || '[]');
        const i = parseInt(btn.getAttribute('data-i'), 10);
        shop[i].done = !shop[i].done;
        localStorage.setItem(sk('shop_list'), JSON.stringify(shop));
        renderShop();
      });
    });
  }

  async function startBarcode() {
    const video = document.getElementById('barcodeVideo');
    if (!video) return;
    try {
      barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = barcodeStream;
      await video.play();
      if ('BarcodeDetector' in window) {
        const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
        const tick = async () => {
          if (!barcodeStream) return;
          try {
            const codes = await det.detect(video);
            if (codes[0]) {
              document.getElementById('barcodeManual').value = codes[0].rawValue;
              searchBarcode(codes[0].rawValue);
              stopBarcode();
              return;
            }
          } catch (_) {}
          requestAnimationFrame(tick);
        };
        tick();
      } else {
        document.getElementById('barcodeResult').textContent =
          'Tarayıcı barkod API desteklemiyor — numarayı manuel gir.';
      }
    } catch (e) {
      document.getElementById('barcodeResult').textContent = 'Kamera izni gerekli: ' + e.message;
    }
  }

  function stopBarcode() {
    if (barcodeStream) {
      barcodeStream.getTracks().forEach((t) => t.stop());
      barcodeStream = null;
    }
  }

  function searchBarcode(code) {
    const f = db.foods.find((x) => x.barcode === code);
    const el = document.getElementById('barcodeResult');
    if (f) {
      el.innerHTML = `<strong>${f.name}</strong> — ${f.kcal} kcal <button type="button" class="day-chip" id="barcodeAddBtn">Öğüne ekle</button>`;
      document.getElementById('barcodeAddBtn')?.addEventListener('click', () => addMeal(f));
    } else {
      el.textContent = 'Veritabanında yok. TR Markalar sekmesinden manuel ekle.';
    }
  }

  function analyzePhoto() {
    const input = document.getElementById('foodPhotoInput');
    const result = document.getElementById('foodPhotoResult');
    if (!input?.files?.[0]) {
      result.textContent = 'Önce fotoğraf seç';
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('foodPhotoPreview').innerHTML = `<img src="${reader.result}" style="max-width:100%;border-radius:12px;">`;
      const name = file.name.toLowerCase();
      let guess = { name: 'Karışık öğün', kcal: 450, p: 25, c: 45, f: 18 };
      if (name.includes('chicken') || name.includes('tavuk')) guess = { name: 'Tavuk yemeği (tahmin)', kcal: 380, p: 35, c: 25, f: 14 };
      else if (name.includes('pizza')) guess = { name: 'Pizza (tahmin)', kcal: 280, p: 12, c: 32, f: 12, per: 'dilim' };
      else if (name.includes('salad') || name.includes('salata')) guess = { name: 'Salata (tahmin)', kcal: 180, p: 8, c: 15, f: 10 };
      result.innerHTML = `AI tahmin: <strong>${guess.name}</strong> ~${guess.kcal} kcal (P${guess.p}/C${guess.c}/F${guess.f})<br><small>Gerçek AI için API eklenebilir. Şimdilik dosya adı + heuristik.</small><br><button type="button" class="start-btn" id="photoAddBtn" style="margin-top:10px;">Öğüne ekle</button>`;
      document.getElementById('photoAddBtn')?.addEventListener('click', () => addMeal(guess));
    };
    reader.readAsDataURL(file);
  }

  function init() {
    loadDb().then(() => {
      renderDashboard();
      renderFoods();
      renderRecipes();
      renderShop();
    });
    initTabs();
    document.getElementById('nutQuickMeal')?.addEventListener('click', () => {
      const name = prompt('Öğün adı');
      if (!name) return;
      addMeal({ name, kcal: 400, p: 30, c: 40, f: 12 });
    });
    document.getElementById('trFoodSearch')?.addEventListener('input', (e) => renderFoods(e.target.value));
    document.getElementById('barcodeStartBtn')?.addEventListener('click', startBarcode);
    document.getElementById('barcodeSearchBtn')?.addEventListener('click', () => searchBarcode(document.getElementById('barcodeManual')?.value?.trim()));
    document.getElementById('foodPhotoAnalyzeBtn')?.addEventListener('click', analyzePhoto);
    document.getElementById('shopAddBtn')?.addEventListener('click', () => {
      const t = document.getElementById('shopNewItem')?.value?.trim();
      if (!t) return;
      const shop = JSON.parse(localStorage.getItem(sk('shop_list')) || '[]');
      shop.push({ text: t, done: false });
      localStorage.setItem(sk('shop_list'), JSON.stringify(shop));
      document.getElementById('shopNewItem').value = '';
      renderShop();
    });
  }

  window.MexNutrition = { renderDashboard, init };
  document.addEventListener('DOMContentLoaded', init);
})();
