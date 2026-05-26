/**
 * MEX Pro — 50 ana hareket: açıklama + GIF (lazy load)
 * GIF dosyalarını assets/exercises/ klasörüne koy (ör. barbell-bench-press.gif)
 */
(function () {
  'use strict';

  let byName = {};
  let loaded = false;

  async function loadDetails() {
    if (loaded) return byName;

    function ingest(data) {
      (data.exercises || []).forEach((ex) => {
        byName[ex.name] = ex;
      });
      loaded = true;
    }

    if (window.MEX_EXERCISE_DETAILS?.exercises?.length) {
      ingest(window.MEX_EXERCISE_DETAILS);
      return byName;
    }

    const paths = ['/api/exercise-details', 'data/exercise-details.json', './data/exercise-details.json'];
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          ingest(await res.json());
          return byName;
        }
      } catch (_) {}
    }

    if (window.MEX_EXERCISE_DETAILS?.exercises?.length) {
      ingest(window.MEX_EXERCISE_DETAILS);
    }
    return byName;
  }

  function get(name) {
    return byName[name] || null;
  }

  function enrich(ex) {
    const d = get(ex.name);
    if (!d) return { ...ex, hasDetail: false };
    return {
      ...ex,
      hasDetail: true,
      muscle: d.muscle || ex.muscle,
      steps: d.steps || ex.steps,
      gif: d.gif,
      slug: d.slug,
    };
  }

  function stepsHTML(ex) {
    const d = get(ex.name) || ex;
    if (!d.steps || !d.steps.length) return '';
    return `
      <div class="exercise-steps-block">
        <div class="exercise-steps-muscle">${d.muscle || '💪 Kas grubu'}</div>
        <div class="exercise-steps-label">📋 Adım adım</div>
        <div class="exercise-steps-list">
          ${d.steps
            .map(
              (s, i) => `
            <div class="exercise-step-row">
              <span class="exercise-step-num">${i + 1}</span>
              <span class="exercise-step-text">${s}</span>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
  }

  function openModal(name) {
    const d = get(name);
    const modal = document.getElementById('exerciseDetailModal');
    if (!modal) return;

    const title = document.getElementById('edTitle');
    const muscle = document.getElementById('edMuscle');
    const steps = document.getElementById('edSteps');
    const img = document.getElementById('edGif');
    const ph = document.getElementById('edGifPlaceholder');

    if (!d) {
      if (title) title.textContent = name;
      if (muscle) muscle.textContent = 'Bu hareket için henüz detay yok. Listede isim var; açıklama sonra eklenebilir.';
      if (steps) steps.innerHTML = '';
      if (img) img.style.display = 'none';
      if (ph) {
        ph.style.display = 'block';
        ph.textContent = 'İleride data/exercise-details.json dosyasına ekleyebilirsin.';
      }
      modal.classList.add('show');
      return;
    }

    if (title) title.textContent = d.name;
    if (muscle) muscle.textContent = d.muscle;
    if (steps) {
      steps.innerHTML = d.steps
        .map((s, i) => `<div class="exercise-step-row"><span class="exercise-step-num">${i + 1}</span><span class="exercise-step-text">${s}</span></div>`)
        .join('');
    }

    if (img && ph) {
      img.style.display = 'none';
      ph.style.display = 'flex';
      ph.innerHTML = '<span class="ed-loading">GIF yükleniyor…</span>';
      img.onload = () => {
        ph.style.display = 'none';
        img.style.display = 'block';
      };
      img.onerror = () => {
        img.style.display = 'none';
        ph.style.display = 'flex';
        ph.innerHTML = `<span>📁 GIF ekle:</span><code>assets/exercises/${d.slug}.gif</code>`;
      };
      img.src = d.gif + '?t=' + Date.now();
      img.alt = d.name;
    }

    modal.classList.add('show');
  }

  function closeModal() {
    document.getElementById('exerciseDetailModal')?.classList.remove('show');
    const img = document.getElementById('edGif');
    if (img) img.removeAttribute('src');
  }

  function initModal() {
    document.getElementById('exerciseDetailClose')?.addEventListener('click', closeModal);
    document.getElementById('exerciseDetailModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'exerciseDetailModal') closeModal();
    });
  }

  function refreshWorkoutSteps() {
    document.querySelectorAll('#workoutContent .exercise-card').forEach((card) => {
      const name = card.querySelector('.exercise-name')?.textContent?.trim();
      if (!name || !get(name)) return;
      const container = card.querySelector('.sets-container');
      if (!container || container.querySelector('.exercise-steps-block')) return;
      const html = stepsHTML({ name });
      if (html) container.insertAdjacentHTML('afterbegin', html);
      const hint = card.querySelector('.exercise-header .exercise-detail-hint');
      if (hint) hint.textContent = '⭐ Detaylı rehber — dokun';
    });
  }

  window.MexExerciseDetails = {
    loadDetails,
    get,
    enrich,
    stepsHTML,
    openModal,
    closeModal,
    refreshWorkoutSteps,
    hasDetail: (name) => !!get(name),
    init() {
      loadDetails().then(() => {
        initModal();
        refreshWorkoutSteps();
      });
    },
  };

  document.addEventListener('click', (e) => {
    const info = e.target.closest('.exercise-info-btn');
    if (info) {
      e.stopPropagation();
      openModal(info.getAttribute('data-name') || '');
      return;
    }
    const header = e.target.closest('#workoutContent .exercise-header');
    if (header && !e.target.closest('.exercise-sets-badge')) {
      const name = header.querySelector('.exercise-name')?.textContent?.trim();
      if (name && get(name)) openModal(name);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MexExerciseDetails.init());
  } else {
    window.MexExerciseDetails.init();
  }
})();
