// ============================================================
// SCREEN NAVIGATION
// ============================================================
// showScreen is now handled by mex-pro-screens.js for earlier availability
const navScreenMap = ['home', 'workout', 'programs', 'progress', 'more'];

const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showScreen(navScreenMap[i]);
  });
});

// More menu cards navigate to sub-screens (data-nav / data-mex-nav)
const moreScreen = document.getElementById('screen-more');
if (moreScreen) {
  moreScreen.querySelectorAll('.more-menu-card[data-nav], .more-menu-card[data-mex-nav]').forEach((card) => {
    card.addEventListener('click', () => {
      navBtns.forEach((b) => b.classList.remove('active'));
      const mexNav = card.getAttribute('data-mex-nav');
      const target = mexNav || card.getAttribute('data-nav');
      if (!target) return;
      showScreen(target);
      if (target === 'nutrition' && window.MexNutrition) window.MexNutrition.renderDashboard();
      if (target === 'profile' && window.MexProfile) window.MexProfile.renderMacroPreview();
      if (target === 'stats' && window.MexFeatures?.renderEnhancedStats) window.MexFeatures.renderEnhancedStats();
      if (target === 'badges') renderBadgesScreen();
      if (target === 'shift') document.getElementById('shiftType')?.dispatchEvent(new Event('change'));
    });
  });
}

// Back buttons for all sub-screens
const subScreens = [
  'bodyphotos', 'calories', 'badges', 'shopping', 'water', 'sleep', 'measurements', 'stats',
  'shift', 'anatomy', 'warmup', 'bmi', 'weeklyreport', 'development', 'tips', 'templates',
  'nutrition', 'profile',
];
subScreens.forEach(id => {
  const scr = document.getElementById('screen-' + id);
  if (!scr || scr.querySelector('.back-btn-custom')) return;
  const btn = document.createElement('button');
  btn.className = 'back-btn-custom';
  btn.textContent = '← Geri';
  btn.style.cssText = 'background:none;border:none;color:var(--accent);font-size:14px;font-weight:600;cursor:pointer;padding:0 0 16px 0;display:block;';
  btn.addEventListener('click', () => {
    const moreBtn = document.querySelector('.nav-btn[aria-label="Daha fazla"]');
    if (moreBtn) navBtns.forEach(b => b.classList.remove('active'));
    showScreen('more');
    if (moreBtn) moreBtn.classList.add('active');
  });
  scr.insertBefore(btn, scr.firstChild);
});

// ============================================================
// WORKOUT DAY CARDS (home → workout tab)
// ============================================================
function goToWorkoutTab() {
  navBtns.forEach((b) => b.classList.remove('active'));
  if (navBtns[1]) navBtns[1].classList.add('active');
  showScreen('workout');
}

document.getElementById('homeStartBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  goToWorkoutTab();
});
document.getElementById('homeTodayCard')?.addEventListener('click', (e) => {
  if (e.target.closest('#homeStartBtn')) return;
  goToWorkoutTab();
});

const homeDateLabel = document.getElementById('homeDateLabel');
if (homeDateLabel) {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  homeDateLabel.textContent = 'Bugün · ' + days[new Date().getDay()];
}

document.querySelectorAll('.workout-day-card').forEach((card) => {
  card.addEventListener('click', () => goToWorkoutTab());
});

// ============================================================
// DAY CHIPS (generic tab switcher)
// ============================================================
document.querySelectorAll('.day-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const parent = chip.parentElement;
    parent.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// ============================================================
// TOAST — FIX: use class toggle for opacity animation
// ============================================================
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ============================================================
// TIMER OVERLAY — FIX: MM:SS format, proper display
// ============================================================
const timerOverlay = document.getElementById('timerOverlay');
const timerDisplay = document.getElementById('timerDisplay');
const timerPauseBtn = document.getElementById('timerPauseBtn');
let timerSec = 90, timerIv = null, timerPaused = false;

function formatTime(s) {
  if (s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return m + ':' + String(sec).padStart(2, '0');
  return String(sec);
}

function startTimer(sec) {
  if (timerIv) clearInterval(timerIv);
  timerSec = sec;
  timerPaused = false;
  if (timerDisplay) timerDisplay.textContent = formatTime(timerSec);
  if (timerPauseBtn) timerPauseBtn.textContent = '⏸';
  if (timerOverlay) timerOverlay.classList.add('show');
  timerIv = setInterval(() => {
    if (!timerPaused) {
      timerSec--;
      if (timerDisplay) timerDisplay.textContent = formatTime(Math.max(0, timerSec));
    }
    if (timerSec <= 0) {
      clearInterval(timerIv);
      timerIv = null;
      if (timerOverlay) timerOverlay.classList.remove('show');
      showToast('⏰ Süre doldu! Sonraki sete geç.');
    }
  }, 1000);
}

if (timerOverlay) {
  timerOverlay.querySelectorAll('.timer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.textContent.trim();
      if (t === '−15') { timerSec = Math.max(0, timerSec - 15); if (timerDisplay) timerDisplay.textContent = formatTime(timerSec); }
      else if (t === '+15') { timerSec += 15; if (timerDisplay) timerDisplay.textContent = formatTime(timerSec); }
      else if (t === '60sn') startTimer(60);
      else if (t === '90sn') startTimer(90);
      else if (t === '2dk') startTimer(120);
      else if (t === '3dk') startTimer(180);
      else if (t === '↺') startTimer(timerSec > 0 ? timerSec : 90);
    });
  });
  if (timerPauseBtn) timerPauseBtn.addEventListener('click', () => {
    timerPaused = !timerPaused;
    timerPauseBtn.textContent = timerPaused ? '▶' : '⏸';
  });
  const tc = timerOverlay.querySelector('.timer-close');
  if (tc) tc.addEventListener('click', () => { timerOverlay.classList.remove('show'); clearInterval(timerIv); });
}

// ============================================================
// WORKOUT HEADER TİMER BUTONU — timerOverlay dışındaki .timer-btn
// ============================================================
document.addEventListener('click', e => {
  const btn = e.target.closest('button.timer-btn');
  if (!btn || timerOverlay.contains(btn)) return;
  const t = btn.textContent.trim();
  if (t.includes('90')) startTimer(90);
  else if (t.includes('60')) startTimer(60);
  else if (t.includes('2dk') || t.includes('2 dk')) startTimer(120);
  else if (t.includes('3dk') || t.includes('3 dk')) startTimer(180);
  else startTimer(90);
});


document.querySelectorAll('.exercise-header').forEach(header => {
  header.addEventListener('click', () => {
    const card = header.closest('.exercise-card');
    if (!card) return;
    const sets = card.querySelector('.sets-container');
    if (!sets) return;
    const isOpen = sets.classList.contains('open');
    // Close all others in same workout block
    const parent = card.parentElement;
    parent.querySelectorAll('.sets-container').forEach(s => s.classList.remove('open'));
    if (!isOpen) sets.classList.add('open');
  });
});

// ============================================================
// SET CHECK BUTTONS — FIX: add click handler + rest timer
// ============================================================
document.addEventListener('click', e => {
  const check = e.target.closest('.set-check');
  if (!check) return;
  const wasDown = check.classList.contains('done');
  check.classList.toggle('done');
  if (!wasDown) {
    // Mark done — show checkmark and start rest timer
    check.innerHTML = '✓';
    check.style.color = '#000';
    updateCompletedSets();
    if (typeof startRestCountdown === 'function') startRestCountdown();
    else startTimer(typeof getRestSeconds === 'function' ? getRestSeconds() : 90);
  } else {
    check.innerHTML = '';
    check.style.color = '';
    updateCompletedSets();
  }
});

function updateCompletedSets() {
  const total = document.querySelectorAll('#workoutContent .set-check.done').length;
  // Update home stats
  const homeTotalSets = document.getElementById('homeTotalSets');
  if (homeTotalSets) {
    const saved = parseInt(localStorage.getItem('mex_total_sets') || '0');
    // We don't persist per-session sets separately; just count current session
    homeTotalSets.textContent = total;
  }
}

// ============================================================
// SET TYPE BUTTONS — FIX: cycle N→W→D→F on click
// ============================================================
const SET_TYPES = [
  { code: 'N', label: 'Normal',   color: 'var(--text3)',  bg: 'rgba(255,255,255,0.06)', border: 'var(--text3)' },
  { code: 'W', label: 'Isınma',   color: 'var(--accent3)', bg: 'rgba(71,184,255,0.12)', border: 'var(--accent3)' },
  { code: 'D', label: 'Drop Set', color: 'var(--accent2)', bg: 'rgba(255,107,53,0.12)', border: 'var(--accent2)' },
  { code: 'F', label: 'Failure',  color: 'var(--red)',     bg: 'rgba(255,71,71,0.12)',  border: 'var(--red)' },
  { code: 'B', label: 'Back-off', color: 'var(--gold)',    bg: 'rgba(245,200,66,0.12)', border: 'var(--gold)' },
];

document.addEventListener('click', e => {
  const typeBtn = e.target.closest('[title*="dokun: değiştir"]');
  if (!typeBtn) return;
  const cur = typeBtn.textContent.trim();
  const idx = SET_TYPES.findIndex(t => t.code === cur);
  const next = SET_TYPES[(idx + 1) % SET_TYPES.length];
  typeBtn.textContent = next.code;
  typeBtn.style.color = next.color;
  typeBtn.style.background = next.bg;
  typeBtn.style.borderColor = next.border;
  typeBtn.title = `${next.label} (dokun: değiştir)`;
  showToast(next.label + ' seti');
});

// ============================================================
// ONLINE / OFFLINE
// ============================================================
const offlineToast = document.getElementById('offlineToast');
const onlineToast = document.getElementById('onlineToast');
function updateOnline() {
  if (navigator.onLine) {
    if (offlineToast) offlineToast.style.display = 'none';
    if (onlineToast) { onlineToast.style.display = 'block'; setTimeout(() => { onlineToast.style.display = 'none'; }, 3000); }
  } else {
    if (onlineToast) onlineToast.style.display = 'none';
    if (offlineToast) offlineToast.style.display = 'block';
  }
}
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);

// ============================================================
// STRESS BUTTONS
// ============================================================
document.querySelectorAll('.stress-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.stress-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ============================================================
// WORKOUT START BUTTON (static HTML — ilk ekran)
// ============================================================
(function() {
  const startBtn = document.getElementById('startWorkoutBtn');
  const timerDisp = document.getElementById('workoutTimerDisplay');
  const timerTime = document.getElementById('workoutTimerTime');
  if (!startBtn || !timerDisp) return;
  let wInterval = null, wSeconds = 0;
  startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    timerDisp.style.display = 'flex';
    wSeconds = 0;
    if (wInterval) clearInterval(wInterval);
    wInterval = setInterval(() => {
      wSeconds++;
      const m = Math.floor(wSeconds / 60);
      const s = wSeconds % 60;
      if (timerTime) timerTime.textContent = m + ':' + String(s).padStart(2, '0');
    }, 1000);
    showToast('💪 Antrenman başladı!', 3000);
  });
  const finishStaticBtn = timerDisp.querySelector('button');
  if (finishStaticBtn) {
    finishStaticBtn.addEventListener('click', () => {
      if (wInterval) { clearInterval(wInterval); wInterval = null; }
      timerDisp.style.display = 'none';
      startBtn.style.display = '';
      markWorkoutComplete('Push');
      showToast('🎉 Antrenman tamamlandı!', 3000);
    });
  }
})();


let workoutStarted = false;
const workoutScreen = document.getElementById('screen-workout');

// Find start button and finish button in workout screen
function setupWorkoutButtons() {
  const content = document.getElementById('workoutContent');
  if (!content) return;

  // Start button — the first .start-btn inside workoutContent header area
  const startBtn = content.querySelector('.start-btn');
  const finishBtn = content.querySelector('.finish-btn');

  if (startBtn && !startBtn._mexSetup) {
    startBtn._mexSetup = true;
    startBtn.addEventListener('click', () => {
      workoutStarted = true;
      startBtn.style.display = 'none';
      if (finishBtn) finishBtn.classList.add('show');
      showToast('💪 Antrenman başladı! Hadi başla!', 3000);
    });
  }

  if (finishBtn && !finishBtn._mexSetup) {
    finishBtn._mexSetup = true;
    finishBtn.addEventListener('click', () => {
      workoutStarted = false;
      finishBtn.classList.remove('show');
      if (startBtn) startBtn.style.display = '';
      // Track completion
      const dayChip = document.querySelector('#daySelector .day-chip.active');
      const dayName = dayChip ? dayChip.textContent.trim() : 'Push';
      markWorkoutComplete(dayName);
      showToast('🎉 Antrenman tamamlandı! Harika iş!', 3000);
    });
  }
}

function markWorkoutComplete(dayName) {
  // Update completed count
  const count = parseInt(localStorage.getItem('mex_workouts') || '0') + 1;
  localStorage.setItem('mex_workouts', count);

  // Update streak
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem('mex_last_workout_date');
  let streak = parseInt(localStorage.getItem('mex_streak') || '0');
  if (lastDate) {
    const last = new Date(lastDate);
    const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
    if (diff <= 1) streak++;
    else streak = 1;
  } else {
    streak = 1;
  }
  localStorage.setItem('mex_streak', streak);
  localStorage.setItem('mex_last_workout_date', today);

  if (window.MexFeatures) window.MexFeatures.recordSession(dayName);

  updateHomeStats();
}

// ============================================================
// WORKOUT DAY CONTENT SWITCHING — FIX: show different content per day
// ============================================================
window.workoutDayData = {
  push: {
    id: 'push',
    title: 'PUSH DAY', color: 'var(--accent2)', emoji: '💪',
    desc: 'Göğüs + Omuz + Triceps', sets: '7 hareket',
    warning: '⚠ Omuz ağrısına dikkat — lateral raise ve press hafif yap',
    exercises: [
      { name: 'Barbell Bench Press', badge: '4x6-8', warn: '', muscle: '💪 Göğüs • Omuz • Triceps',
        steps: ['Düz bankaya uzan, kürek kemiklerini birbirine sık', 'Barı omuz genişliğinden biraz geniş kavra', 'Derin nefes al, karın ve sırtı sıkıştır', 'Barı göğse kontrollü indir (2 sn)', 'Göğse değince patlayıcı şekilde it', 'Dirsekler tam açılmadan tekrarla'] },
      { name: 'İncline Dumbbell Press', badge: '4x8-10', warn: '', muscle: '💪 Üst Göğüs • Omuz • Triceps',
        steps: ['Bankayı 30-45° ayarla', 'Her elde dumbbell, omuz hizasında tut', 'Dirsekler 45° açıyla aşağı iner', 'Göğse dokunmadan 1 sn dur', 'Dumbbellları yukarı it, tepede sık', 'Kontrollü indir, sırtı bankaya bastır'] },
      { name: 'Machine Chest Press', badge: '4x10-12', warn: '', muscle: '💪 Göğüs • Triceps',
        steps: ['Oturak ve kolu göğüs hizasına ayarla', 'Sırtını makinaya tam daya', 'Kürek kemiklerini birbirine çek', 'Kolları öne it, göğsü sık', 'Kontrollü geri çek — tam uzatma'] },
      { name: 'Lateral Raise', badge: '4x12-15', warn: '⚠ Hafif ağırlık — form önce', muscle: '🔺 Yan Omuz (Medial Deltoid)',
        steps: ['Ayaklar omuz genişliğinde, hafif öne eğik dur', 'Dumbbellları yanlardan kaldır — dirsek hafif bükük', 'Omuz hizasında dur (T şekli), 1 sn tut', 'Kontrollü indir — momentum kullanma', 'Başparmak hafif aşağı — daha iyi aktivasyon'] },
      { name: 'Cable Lateral Raise', badge: '4x15', warn: '', muscle: '🔺 Yan Omuz',
        steps: ['Kablo makinanın yanında dur, tutamağı alt noktadan kavra', 'Kolu vücuttan uzak tutarak yana kaldır', 'Omuz hizasında dur, 1 sn sık', 'Kontrollü indir — tam hareket açısı'] },
      { name: 'Tricep Rope Pushdown', badge: '4x10-12', warn: '', muscle: '🔧 Triceps (Tüm başlar)',
        steps: ['Halatı yüksek makaradan tut, dirsekler gövdeye yapışık', 'Sadece ön kol hareket eder — üst kol sabit', 'Aşağı iterken halatı iki yana aç', 'Tam uzat, tricepsi sık — 1 sn tut', 'Kontrollü yukarı çek, dirsekler 90°ye kadar'] },
      { name: 'Overhead Rope Extension', badge: '4x12', warn: '', muscle: '🔧 Triceps (Uzun baş)',
        steps: ['Halatı düşük makaradan tut, öne doğru eğil', 'Kollar başın üstünde uzanır, dirsekler sabit', 'Önkolu yukarı-öne it, tam uzat', 'Tricepsi sık, 1 sn tut', 'Kontrollü geri çek — uzun baş tam gerilir'] },
    ]
  },
  pull: {
    id: 'pull',
    title: 'PULL DAY', color: 'var(--accent3)', emoji: '🔵',
    desc: 'Sırt + Biceps', sets: '7 hareket',
    warning: '',
    exercises: [
      { name: 'Lat Pulldown (Geniş Tutuş)', badge: '4x8-10', warn: '', muscle: '🏔 Latissimus • Biceps',
        steps: ['Uylukları pedi altına kilitle, göğsü hafif ileri çıkar', 'Barı omuzden geniş kavra, bilekler düz', 'Barı göğse çekerken dirsekleri aşağı-arkaya çek', 'Göğse değince kürek kemiklerini sık, 1 sn tut', 'Kontrollü yukarı bırak — tam uzanma önemli'] },
      { name: 'Cable Row (Dar Tutuş)', badge: '4x10-12', warn: '', muscle: '🏔 Orta Sırt • Biceps',
        steps: ['Otur, ayaklar platformda, dizler hafif bükük', 'Gövde dik — öne eğilme yok', 'Tutamağı karna doğru çek, dirsekler arkaya geçer', 'Kürek kemiklerini sık, 1 sn tut', 'Kontrollü uzat — kollar tam açılır'] },
      { name: 'Machine Row', badge: '4x10-12', warn: '', muscle: '🏔 Sırt • Arka Omuz',
        steps: ['Göğsü pede daya, göğüs ve omuz hizasına ayarla', 'Tutamağı çekerken dirsekler 45° açıyla arkaya gider', 'Kürek kemiklerini sık, 1 sn tut', 'Kontrollü bırak — tam uzanma'] },
      { name: 'Face Pull', badge: '4x15-20', warn: '⚠ Çok hafif — omuz sağlığı', muscle: '🔱 Arka Omuz • Trapez',
        steps: ['Halatı göz hizasına ayarla, her iki uçtan tut', 'Halatı yüze doğru çek — dirsekler omuz hizasında açılır', 'Halatın iki ucu kulak hizasına gelir', 'Arka omzu sık, 2 sn tut — çok önemli!', 'Kontrollü uzat'] },
      { name: 'Barbell Curl', badge: '4x8-10', warn: '', muscle: '💪 Biceps',
        steps: ['Ayaklar omuz genişliğinde, bar önden kavranır', 'Dirsekler gövdeye yapışık — sabit kalır', 'Barı yukarı çekerken önkol kasılır', 'Tepeye gelince sık, 1 sn tut', 'Kontrollü indir — tam uzanma'] },
      { name: 'Hammer Curl', badge: '4x10-12', warn: '', muscle: '💪 Biceps • Brachialis',
        steps: ['Nötr tutuş — başparmak yukarı bakar', 'Dirsekler sabit, önkolu yukarı kaldır', 'Tepeye gelince sık, 1 sn tut', 'Kontrollü indir — momentum yok', 'Her iki kolu birden veya sırayla yapabilirsin'] },
      { name: 'Preacher Curl (Makine)', badge: '4x12', warn: '', muscle: '💪 Biceps (Alt kısım)',
        steps: ['Kolları desteğe tam daya, dirsekler köşede', 'Barı yukarı çek — dirsekler kalkmamalı', 'Tepeye gelince sık, 1 sn tut', 'Kontrollü ve tam indir — en zor kısım burası'] },
    ]
  },
  legs: {
    id: 'legs',
    title: 'LEGS + CORE', color: 'var(--green)', emoji: '🟢',
    desc: 'Bacak + Core', sets: '8 hareket',
    warning: '',
    exercises: [
      { name: 'Squat', badge: '4x6-8', warn: '', muscle: '🦵 Quadriceps • Glutes • Hamstring',
        steps: ['Bar omuzda, ayaklar omuz genişliğinde veya biraz geniş', 'Nefes al, karın sıkıştır (valsalva)', 'Diz parmak yönünde açılarak aşağı in', 'Kalça diz hizasının altına gelene kadar in', 'Topuklardan iterek kalk — diz içe kapanmasın', 'Tepeye çıkınca nefes ver'] },
      { name: 'Leg Press', badge: '4x10-12', warn: '', muscle: '🦵 Quadriceps • Glutes',
        steps: ['Ayaklar platformda omuz genişliğinde', 'Sırt sündaya tam yapışık', 'Dizler 90° gelene kadar kontrollü indir', 'Dizleri tam kilitlemeden it', 'Ayak pozisyonu: yüksek = glute, alçak = quad'] },
      { name: 'Romanian Deadlift', badge: '4x10', warn: '⚠ Boyun nötr — ağır kaldırma', muscle: '🦿 Hamstring • Glutes',
        steps: ['Bar önde, ayaklar kalça genişliğinde', 'Hafif diz bükümü — sabit kalır', 'Kalçayı geriye it, gövde öne eğilir', 'Bar bacak boyunca kayar, sırt düz kalır', 'Hamstringte gerilme hissedince dur', 'Kalçayı öne iterek kalk, glute sık'] },
      { name: 'Leg Extension', badge: '4x12-15', warn: '', muscle: '🦵 Quadriceps',
        steps: ['Sırt sandaleye tam yapışık, dizi köşede', 'Kontrol altında kaldır — hamle yok', 'Tepeye gelince quadı sık, 2 sn tut', 'Kontrollü indir — tam açı'] },
      { name: 'Leg Curl', badge: '4x12-15', warn: '', muscle: '🦿 Hamstring',
        steps: ['Yüzüstü uzan, topuklar pede tam değsin', 'Topukları kalçaya doğru çek', 'Tepeye gelince sık, 1 sn tut', 'Kontrollü indir — kalçalar platformdan kalkmasın'] },
      { name: 'Standing Calf Raise', badge: '4x15-20', warn: '', muscle: '🦶 Gastrocnemius',
        steps: ['Parmak uçları platformda, topuklar serbest', 'Tamamen indir — germe hissi önemli', 'Mümkün olduğunca yüksek kalk', 'Tepeye gelince sık, 2 sn tut', 'Yavaş yavaş indir — 3 sn iniş'] },
      { name: 'Plank', badge: '4x60sn', warn: '', muscle: '⚡ Core (Tüm karın)',
        steps: ['Dirsekler omuz altında, önkol yerde', 'Vücut tepeden topuğa düz — kalça ne yukarı ne aşağı', 'Karın, glute ve quad aynı anda sıkıştır', 'Nefesi tutma — düzenli nefes al', 'Boyun nötr — aşağı bakma'] },
      { name: 'Cable Crunch', badge: '4x15', warn: '', muscle: '⚡ Üst Karın',
        steps: ['Halat başın üstünden, diz üstü çök', 'Kalçalar topuklara yakın — sabit kalır', 'Dirseği dize doğru kıvır — sadece gövde hareket eder', 'Alt karnı sık, 1 sn tut', 'Kontrollü aç — tam uzanma'] },
    ]
  },
  upper: {
    id: 'upper',
    title: 'UPPER HYPERTROPHY', color: 'var(--purple)', emoji: '🟡',
    desc: 'Tüm Üst Vücut', sets: '8 hareket',
    warning: '',
    exercises: [
      { name: 'İncline Dumbbell Press', badge: '4x8-10', warn: '', muscle: '💪 Üst Göğüs • Omuz',
        steps: ['Bankayı 30-45° ayarla', 'Dumbbelllar omuz hizasında, dirsekler 45°', 'Kontrollü indir — göğse yaklaş ama değme', 'Yukarı it, tepeye gelince sık', 'Kontrollü indir, ritmi koru'] },
      { name: 'Lat Pulldown', badge: '4x8-10', warn: '', muscle: '🏔 Latissimus',
        steps: ['Geniş kavrama, uyluklar kilitte', 'Göğsü hafif geri yasla', 'Barı göğse doğru çek, dirsekler aşağı', 'Kürek kemiklerini sık, 1 sn tut', 'Kontrollü yukarı bırak — tam uzanma'] },
      { name: 'Shoulder Press (Makine)', badge: '4x10-12', warn: '⚠ Overhead — sadece ağrısız yapıyorsan', muscle: '🔺 Omuz (Ön + Yan)',
        steps: ['Koltuk ve tutamağı omuz hizasına ayarla', 'Sırt makinaya yapışık — sırtı boşaltma', 'Kolları yukarı it — tam uzatma', 'Kontrollü indir, omuz hizasında dur'] },
      { name: 'Cable Row', badge: '4x10-12', warn: '', muscle: '🏔 Orta Sırt',
        steps: ['Otur, gövde dik, hafif öne eğik başla', 'Tutamağı karna doğru çek', 'Dirsekler arkaya geçer, kürek sıkışır', '1 sn tut, kontrollü uzat'] },
      { name: 'Lateral Raise', badge: '4x12-15', warn: '', muscle: '🔺 Yan Omuz',
        steps: ['Ayaklar omuz genişliğinde, hafif öne eğil', 'Dumbbellları yanlardan kaldır — dirsek hafif bükük', 'Omuz hizasında 1 sn tut', 'Kontrollü indir — momentum kullanma'] },
      { name: 'Rope Pushdown', badge: '4x12', warn: '', muscle: '🔧 Triceps',
        steps: ['Dirsekler gövdeye yapışık — sabit', 'Halatı aşağı it, iki yana aç', 'Tam uzat, tricepsi sık', 'Kontrollü yukarı çek'] },
      { name: 'Hammer Curl', badge: '4x10-12', warn: '', muscle: '💪 Biceps • Brachialis',
        steps: ['Nötr tutuş — başparmak yukarı bakar', 'Dirsekler sabit, önkolu kaldır', 'Tepeye gelince sık', 'Kontrollü indir'] },
      { name: 'Face Pull', badge: '4x15', warn: '', muscle: '🔱 Arka Omuz',
        steps: ['Halat göz hizasında', 'Yüze doğru çek, dirsekler açılır', 'Arka omzu 2 sn sık', 'Kontrollü uzat'] },
    ]
  },
  rest: {
    id: 'rest',
    title: 'DİNLENME GÜNÜ', color: 'var(--text3)', emoji: '😴',
    desc: 'Aktif Dinlenme', sets: '',
    warning: '',
    exercises: []
  }
};

function buildWorkoutContent(dayKey) {
  const day = workoutDayData[dayKey] || workoutDayData.push;
  if (dayKey === 'rest') {
    return `
      <div class="rest-card">
        <div class="rest-icon">😴</div>
        <div class="rest-title">DİNLENME GÜNÜ</div>
        <ul class="rest-items">
          <li>Yeterince uy (7.5-8 saat)</li>
          <li>Bol su iç (en az 2.5L)</li>
          <li>170g protein hedefini tut</li>
          <li>Hafif yürüyüş yapabilirsin</li>
          <li>Omuz mobilite egzersizleri yap</li>
        </ul>
      </div>`;
  }

  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;">
      <div>
        <div style="font-family:var(--font);font-size:28px;letter-spacing:1px;color:${day.color};">${day.title}</div>
        <div style="font-size:12px;color:var(--text2);">${day.desc} • ${day.sets}</div>
      </div>
      <button class="start-btn" style="width:auto;padding:12px 20px;margin-bottom:0;font-size:16px;">BAŞLA</button>
    </div>`;

  if (day.warning) {
    html += `<div class="exercise-warn" style="margin-bottom:12px;font-size:12px;">${day.warning}</div>`;
  }

  day.exercises.forEach((rawEx, idx) => {
    const ex = window.MexExerciseDetails ? window.MexExerciseDetails.enrich(rawEx) : rawEx;
    const setsCount = parseInt(ex.badge.split('x')[0]) || 3;
    let setsHTML = '';
    for (let i = 1; i <= setsCount; i++) {
      setsHTML += `
        <div class="set-row" style="grid-template-columns:28px 28px 1fr 1fr auto !important;">
          <div class="set-num">${i}</div>
          <div title="Normal (dokun: değiştir)" style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--text3);background:rgba(255,255,255,0.06);border:1px solid rgba(64,64,96,0.5);cursor:pointer;user-select:none;">N</div>
          <input class="set-input" type="number" placeholder="kg" inputmode="decimal">
          <input class="set-input" type="number" placeholder="rep" inputmode="numeric">
          <div class="set-check" style="background:var(--bg3);border-color:var(--border);"></div>
        </div>`;
    }

    const stepsHTML = window.MexExerciseDetails && window.MexExerciseDetails.stepsHTML(ex)
      ? window.MexExerciseDetails.stepsHTML(ex)
      : ex.steps
        ? `<div class="exercise-steps-block"><div class="exercise-steps-muscle">${ex.muscle || '💪 Kas Grubu'}</div><div class="exercise-steps-label">📋 Adım adım</div><div class="exercise-steps-list">${ex.steps.map((s, i) => `<div class="exercise-step-row"><span class="exercise-step-num">${i + 1}</span><span class="exercise-step-text">${s}</span></div>`).join('')}</div></div>`
        : '';
    const detailHint = ex.hasDetail ? '⭐ Detaylı rehber — dokun' : 'Dokunarak detay gör 👆';

    html += `
      <div class="exercise-card">
        <div class="exercise-header">
          <div>
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-detail-hint" style="font-size:11px;color:var(--text3);margin-top:2px;">${detailHint}</div>
          </div>
          <div class="exercise-sets-badge">${ex.badge}</div>
        </div>
        ${ex.warn ? `<div class="exercise-warn">${ex.warn}</div>` : ''}
        <div class="sets-container" id="sets-${dayKey}-${idx}">
          ${stepsHTML}
          <div style="display:grid;grid-template-columns:28px 28px 1fr 1fr auto;gap:8px;margin-bottom:4px;margin-top:6px;">
            <div></div><div class="set-label" style="font-size:9px;">TİP</div><div class="set-label">KG</div><div class="set-label">TEKRAR</div><div class="set-label">✓</div>
          </div>
          ${setsHTML}
          <div class="target-text">Hedef: <strong>${ex.badge} tekrar</strong></div>
        </div>
      </div>`;
  });

  html += `<button class="finish-btn">✅ ANTRENMAN TAMAMLANDI</button>`;
  return html;
}

// Day selector in workout screen
const daySelector = document.getElementById('daySelector');
const workoutContent = document.getElementById('workoutContent');
let currentDay = 'push';
window.__mexCurrentDay = 'push';

function afterWorkoutRender(dayKey) {
  window.__mexCurrentDay = dayKey;
  if (window.MexFeatures) window.MexFeatures.onWorkoutRendered(dayKey);
  if (window.MexExerciseDetails) {
    window.MexExerciseDetails.loadDetails().then(() => window.MexExerciseDetails.refreshWorkoutSteps());
  }
}

if (daySelector && workoutContent) {
  const dayKeys = ['push', 'pull', 'legs', 'upper', 'rest'];
  daySelector.querySelectorAll('.day-chip').forEach((chip, i) => {
    chip.addEventListener('click', () => {
      daySelector.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentDay = dayKeys[i] || 'push';
      workoutContent.innerHTML = buildWorkoutContent(currentDay);
      setupWorkoutButtons();
      reattachExerciseAccordions();
      afterWorkoutRender(currentDay);
    });
  });

  // Render initial push day
  workoutContent.innerHTML = buildWorkoutContent('push');
  setupWorkoutButtons();
  reattachExerciseAccordions();
  afterWorkoutRender('push');
}

window.buildWorkoutContent = buildWorkoutContent;
window.setupWorkoutButtons = setupWorkoutButtons;
window.reattachExerciseAccordions = reattachExerciseAccordions;
window.workoutDayData = workoutDayData;

function reattachExerciseAccordions() {
  document.querySelectorAll('#workoutContent .exercise-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.exercise-card');
      if (!card) return;
      const sets = card.querySelector('.sets-container');
      if (!sets) return;
      const isOpen = sets.classList.contains('open');
      card.parentElement.querySelectorAll('.sets-container').forEach(s => s.classList.remove('open'));
      if (!isOpen) sets.classList.add('open');
    });
  });
}

// ============================================================
// PR SAVE — FIX: update display + persist to localStorage
// ============================================================
const prConfig = [
  { inputId: 'prBenchInput', currentId: 'prBenchCurrent', displayId: 'progBench', storageKey: 'mex_pr_bench', label: 'Bench', unit: 'kg', defaultVal: 60 },
  { inputId: 'prSquatInput', currentId: 'prSquatCurrent', displayId: 'progSquat', storageKey: 'mex_pr_squat', label: 'Squat', unit: 'kg', defaultVal: 120 },
  { inputId: 'prPushupInput', currentId: 'prPushupCurrent', displayId: 'progPushup', storageKey: 'mex_pr_pushup', label: 'Şınav', unit: 'adet', defaultVal: 50 },
  { inputId: 'prWeightInput', currentId: 'prWeightCurrent', displayId: 'progWeight', storageKey: 'mex_pr_weight', label: 'Vücut Ağırlığı', unit: 'kg', defaultVal: 84 },
];

document.querySelectorAll('.pr-save-btn').forEach((btn, i) => {
  const cfg = prConfig[i];
  if (!cfg) return;
  btn.addEventListener('click', () => {
    const input = document.getElementById(cfg.inputId);
    if (!input || !input.value) { showToast('Yeni değeri gir!'); return; }
    const newVal = parseFloat(input.value);
    if (isNaN(newVal) || newVal <= 0) { showToast('Geçerli bir değer gir!'); return; }

    // Save to localStorage
    localStorage.setItem(cfg.storageKey, newVal);

    // Update current label
    const currentEl = document.getElementById(cfg.currentId);
    if (currentEl) currentEl.textContent = `Şu an: ${newVal} ${cfg.unit}`;

    // Update progress display
    const dispEl = document.getElementById(cfg.displayId);
    if (dispEl) dispEl.textContent = newVal;

    // Track PR count
    const prCount = parseInt(localStorage.getItem('mex_pr_count') || '0') + 1;
    localStorage.setItem('mex_pr_count', prCount);

    input.value = '';
    updateHomeStats();
    showToast('🏆 Yeni PR: ' + newVal + ' ' + cfg.unit + '!', 3000);
  });
});

// ============================================================
// HOME STATS UPDATE
// ============================================================
function updateHomeStats() {
  const workouts = parseInt(localStorage.getItem('mex_workouts') || '0');
  const streak = parseInt(localStorage.getItem('mex_streak') || '0');
  const prCount = parseInt(localStorage.getItem('mex_pr_count') || '0');

  const el = (id) => document.getElementById(id);
  if (el('homeCompletedWorkouts')) el('homeCompletedWorkouts').textContent = workouts;
  if (el('homeStreak')) el('homeStreak').textContent = streak;
  if (el('homePRCount')) el('homePRCount').textContent = prCount;
  if (el('homeCurrentWeek')) {
    const week = Math.max(1, Math.ceil(workouts / 4));
    el('homeCurrentWeek').textContent = week;
  }
}

// ============================================================
// LOAD STATE FROM LOCALSTORAGE ON INIT
// ============================================================
function loadSavedState() {
  // Load PRs
  prConfig.forEach(cfg => {
    const saved = parseFloat(localStorage.getItem(cfg.storageKey));
    const val = isNaN(saved) ? cfg.defaultVal : saved;
    const currentEl = document.getElementById(cfg.currentId);
    const dispEl = document.getElementById(cfg.displayId);
    if (currentEl) currentEl.textContent = `Şu an: ${val} ${cfg.unit}`;
    if (dispEl) dispEl.textContent = val;
  });

  updateHomeStats();
}

// ============================================================
// SU TAKİBİ
// ============================================================
let waterML = parseInt(localStorage.getItem('mex_water_today') || '0');
const WATER_GOAL = 3000;

// Reset water if new day
const waterDate = localStorage.getItem('mex_water_date');
const today = new Date().toDateString();
if (waterDate !== today) {
  waterML = 0;
  localStorage.setItem('mex_water_date', today);
  localStorage.setItem('mex_water_today', '0');
}

function updateWater() {
  const disp = document.getElementById('waterDisplay');
  const bar = document.getElementById('waterBar');
  const status = document.getElementById('waterStatus');
  if (disp) disp.textContent = waterML;
  if (bar) bar.style.width = Math.min(100, (waterML / WATER_GOAL) * 100) + '%';
  if (status) {
    if (waterML === 0) status.textContent = 'Henüz su içmedin 😐';
    else if (waterML < 1000) status.textContent = 'Az içtin, devam et 💧';
    else if (waterML < 2000) status.textContent = 'İyi gidiyorsun! 👍';
    else if (waterML < 3000) status.textContent = 'Neredeyse hedefe ulaştın! 💪';
    else status.textContent = '🎉 Hedef tamamlandı!';
  }
  localStorage.setItem('mex_water_today', waterML);

  // Badge check
  if (waterML >= 3000) {
    const badge = localStorage.getItem('mex_badge_water');
    if (!badge) { localStorage.setItem('mex_badge_water', '1'); showToast('💧 Rozet: Su Ustası kazanıldı!', 4000); }
  }
}

const waterScreen = document.getElementById('screen-water');
if (waterScreen) {
  waterScreen.querySelectorAll('button').forEach(btn => {
    const txt = btn.textContent.replace(/\n/g, ' ').trim();
    let ml = 0;
    if (txt.includes('200ml') || txt.includes('200')) ml = 200;
    else if (txt.includes('330ml') || txt.includes('330')) ml = 330;
    else if (txt.includes('500ml') || txt.includes('500')) ml = 500;
    else if (txt.includes('1000ml') || txt.includes('1000')) ml = 1000;
    else if (txt.includes('SIFIRLA')) ml = -1;

    if (ml > 0) btn.addEventListener('click', () => { waterML = Math.min(waterML + ml, 9999); updateWater(); showToast(`+${ml}ml eklendi 💧`); });
    else if (ml === -1) btn.addEventListener('click', () => { waterML = 0; updateWater(); showToast('Su takibi sıfırlandı'); });
  });
  updateWater();
}

// ============================================================
// BMI HESAPLA
// ============================================================
const bmiScreen = document.getElementById('screen-bmi');
if (bmiScreen) {
  bmiScreen.querySelector('.start-btn').addEventListener('click', () => {
    const h = parseFloat(document.getElementById('bmiHeight').value) || 185;
    const w = parseFloat(document.getElementById('bmiWeight').value) || 84;
    const age = parseInt(document.getElementById('bmiAge').value) || 27;
    const bmi = w / ((h / 100) * (h / 100));
    let cat = '', color = '', advice = '';
    if (bmi < 18.5) { cat = 'Zayıf'; color = 'var(--accent3)'; advice = 'Kilo almanı öneriyoruz. Kalori artır.'; }
    else if (bmi < 25) { cat = 'Normal'; color = 'var(--green)'; advice = 'Sağlıklı kilo aralığındasın! 🎉'; }
    else if (bmi < 30) { cat = 'Fazla Kilolu'; color = 'var(--gold)'; advice = 'Hafif kalori açığı ve kardiyo ekle.'; }
    else { cat = 'Obez'; color = 'var(--red)'; advice = 'Bir uzmana danışmanı öneririz.'; }
    const ideal = (22 * (h / 100) * (h / 100)).toFixed(1);
    const diff = (w - parseFloat(ideal)).toFixed(1);
    document.getElementById('bmiResult').innerHTML = `
      <div class="card" style="margin-bottom:14px;text-align:center;">
        <div style="font-family:var(--font);font-size:72px;color:${color};line-height:1;">${bmi.toFixed(1)}</div>
        <div style="font-size:18px;font-weight:600;color:${color};margin-bottom:8px;">${cat}</div>
        <div style="font-size:13px;color:var(--text2);">${advice}</div>
      </div>
      <div class="card">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:center;">
          <div><div style="font-family:var(--font);font-size:24px;color:var(--accent);">${ideal}kg</div><div style="font-size:11px;color:var(--text3);">İdeal Kilo</div></div>
          <div><div style="font-family:var(--font);font-size:24px;color:${parseFloat(diff) > 0 ? 'var(--red)' : 'var(--green)'};">${parseFloat(diff) > 0 ? '+' : ''}${diff}kg</div><div style="font-size:11px;color:var(--text3);">Fark</div></div>
        </div>
      </div>`;
  });
}

// ============================================================
// KALORİ YAKMA
// ============================================================
let activities = [];
const calScreen = document.getElementById('screen-calories');
if (calScreen) {
  const actType = document.getElementById('calorieActivityType');
  const customInput = document.getElementById('customCalInput');
  if (actType) actType.addEventListener('change', () => {
    if (customInput) customInput.style.display = actType.value === 'custom' ? 'block' : 'none';
  });
  calScreen.querySelector('.start-btn').addEventListener('click', () => {
    if (!actType) return;
    let cal = actType.value === 'custom' ? (parseInt(document.getElementById('customCal').value) || 0) : parseInt(actType.value, 10);
    const name = actType.options[actType.selectedIndex].text;
    activities.push({ name, cal });
    const total = activities.reduce((s, a) => s + a.cal, 0);
    document.getElementById('totalBurn').textContent = total;
    const list = document.getElementById('calorieActivityList');
    list.innerHTML = activities.map(a => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="font-size:13px;">${a.name}</div>
        <div style="font-family:var(--font);font-size:20px;color:var(--accent2);">${a.cal} kal</div>
      </div>`).join('');
    showToast(`+${cal} kalori eklendi 🔥`);
  });
}

// ============================================================
// UYKU & STRES
// ============================================================
let sleepRecords = JSON.parse(localStorage.getItem('mex_sleep_records') || '[]');
const sleepScreen = document.getElementById('screen-sleep');

function renderSleepHistory() {
  const hist = document.getElementById('sleepHistory');
  if (!hist) return;
  if (!sleepRecords.length) { hist.innerHTML = '<div style="text-align:center;color:var(--text3);padding:40px;font-size:14px;">Henüz kayıt yok</div>'; return; }
  const qLabel = { iyi: '😊 İyi', orta: '😐 Orta', kotu: '😴 Kötü' };
  hist.innerHTML = sleepRecords.map(r => `
    <div class="card" style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-family:var(--font);font-size:22px;color:#bf47ff;">${r.hours} saat</div>
          <div style="font-size:12px;color:var(--text2);">${r.date} • ${qLabel[r.quality] || r.quality} • Stres: ${r.stress}</div>
        </div>
      </div>
    </div>`).join('');
}

if (sleepScreen) {
  renderSleepHistory();
  sleepScreen.querySelector('.start-btn').addEventListener('click', () => {
    const hours = parseFloat(document.getElementById('sleepHours').value) || 0;
    const quality = document.getElementById('sleepQuality').value;
    const activeStress = document.querySelector('.stress-btn.active');
    const stress = activeStress ? activeStress.querySelector('div') ? activeStress.querySelector('div').textContent : activeStress.textContent.trim() : 'Düşük';
    if (!hours) { showToast('Kaç saat uyuduğunu gir!'); return; }
    const rec = { hours, quality, stress, date: new Date().toLocaleDateString('tr-TR') };
    sleepRecords.unshift(rec);
    localStorage.setItem('mex_sleep_records', JSON.stringify(sleepRecords.slice(0, 30)));
    renderSleepHistory();
    document.getElementById('sleepHours').value = '';
    showToast('😴 Uyku kaydedildi!');
    // Badge check
    if (hours >= 8 && !localStorage.getItem('mex_badge_sleep')) {
      localStorage.setItem('mex_badge_sleep', '1');
      showToast('😴 Rozet: İyi Uyku kazanıldı!', 4000);
    }
  });
}

// ============================================================
// VÜCUT ÖLÇÜLERİ
// ============================================================

// ============================================================
// VARDİYA MODU
// ============================================================
const shiftScreen = document.getElementById('screen-shift');
if (shiftScreen) {
  const shiftType = document.getElementById('shiftType');
  const shiftEnergy = document.getElementById('shiftEnergy');
  const shiftPlans = {
    gunduz: { label:'☀️ Gündüz Vardiyası', time:'08:00-20:00', train:'Sabah 06:30-07:30 — İşe gitmeden önce en iyi zaman', meals:[{t:'06:00',n:'Sabah',c:'4 yumurta, ekmek, peynir, muz + kahve'},{t:'10:00',n:'Öğle',c:'200g tavuk + pilav + yoğurt'},{t:'14:00',n:'Ara',c:'Muz + lor peyniri'},{t:'19:00',n:'Akşam (iş çıkışı)',c:'Köfte/tavuk + salata + yoğurt'}], tip:'Sabah antrenmanı kortizol doğal yüksek olduğunda yağ yakmayı artırır.' },
    gece: { label:'🌙 Gece Vardiyası', time:'20:00-08:00', train:'Öğleden sonra 17:00-18:00 — İşe gitmeden önce', meals:[{t:'16:00',n:'Uyanış',c:'4 yumurta, ekmek + protein shake'},{t:'19:00',n:'İş öncesi',c:'200g et + makarna + salata'},{t:'01:00',n:'Gece Arası',c:'Yoğurt + muz'},{t:'08:30',n:'İş Sonrası',c:'Tavuk + pirinç + uyku öncesi'}], tip:'Gece vardiyasında melatonin ritmi bozulur. D vitamini takviyesi al.' },
    sabah: { label:'🌅 Sabah Vardiyası', time:'06:00-14:00', train:'Öğleden sonra 15:00-16:00', meals:[{t:'05:30',n:'İş Öncesi',c:'Hızlı: yumurta, muz, kahve'},{t:'09:00',n:'Ara',c:'Protein bar + meyve'},{t:'13:00',n:'Öğle',c:'200g tavuk + pilav + yoğurt'},{t:'17:00',n:'Antrenman Sonrası',c:'Protein shake + muz'}], tip:'Erken uyanış için yatma saatini 22:00 olarak ayarla.' },
    ogle: { label:'🌤 Öğleden Sonra', time:'14:00-22:00', train:'Sabah 10:00-11:00', meals:[{t:'09:00',n:'Kahvaltı',c:'4 yumurta, ekmek, peynir + kahve'},{t:'12:00',n:'Antrenman Sonrası',c:'Protein shake + muz + yoğurt'},{t:'15:00',n:'Ara',c:'Lor peyniri + meyve'},{t:'20:00',n:'Gece',c:'Et/tavuk + sebze + pirinç'}], tip:'Sabah antrenmanı yapabilmek için 22:30 yatış saati ideal.' },
    tatil: { label:'🏖 Tatil / İzin Günü', time:'Dinlenme', train:'Hafif yürüyüş veya tam dinlenme', meals:[{t:'09:00',n:'Kahvaltı',c:'Yumurta, peynir, domates, zeytin'},{t:'13:00',n:'Öğle',c:'Hafif: salata + yoğurt + et'},{t:'16:00',n:'Ara',c:'Meyve + kuruyemiş'},{t:'19:00',n:'Akşam',c:'Normal akşam yemeği'}], tip:'Dinlenme günleri kasların büyüdüğü gündür. Protein almayı ihmal etme.' }
  };

  function updateShiftPlan() {
    const plan = shiftPlans[shiftType.value] || shiftPlans.gunduz;
    const energy = shiftEnergy.value;
    let trainText = plan.train;
    if (energy === 'yorgun') trainText = '😴 Bugün dinlenme günü — toparlanmaya odaklan';
    else if (energy === 'orta') trainText = '⚡ Hafif tempo — ' + trainText;
    document.getElementById('shiftPlanContent').innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(71,184,255,0.08),rgba(0,0,0,0));border:1px solid rgba(71,184,255,0.2);border-radius:var(--radius);padding:18px;margin-bottom:16px;">
        <div style="font-family:var(--font);font-size:22px;letter-spacing:1px;color:var(--accent3);">${plan.label}</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">${plan.time}</div>
        <div style="font-size:12px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Antrenman Zamanı</div>
        <div style="font-size:14px;color:var(--green);font-weight:600;">${trainText}</div>
      </div>
      <div style="font-family:var(--font);font-size:14px;letter-spacing:2px;color:var(--text3);margin-bottom:10px;">🍽 ÖĞÜN PLANI</div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
        ${plan.meals.map((m, i) => `<div style="display:flex;gap:12px;padding:12px 16px;${i < plan.meals.length - 1 ? 'border-bottom:1px solid var(--border);' : ''}">
          <div style="min-width:44px;text-align:center;"><div style="font-family:var(--font);font-size:16px;color:var(--accent);">${m.t}</div></div>
          <div><div style="font-weight:600;font-size:13px;margin-bottom:2px;">${m.n}</div><div style="font-size:12px;color:var(--text2);">${m.c}</div></div>
        </div>`).join('')}
      </div>
      <div style="background:rgba(232,255,71,0.04);border:1px solid rgba(232,255,71,0.12);border-radius:var(--radius);padding:14px;">
        <div style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">💡 İpucu</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.7;">${plan.tip}</div>
      </div>`;
  }

  if (shiftType) shiftType.addEventListener('change', updateShiftPlan);
  if (shiftEnergy) shiftEnergy.addEventListener('change', updateShiftPlan);
  updateShiftPlan();
}

// ============================================================
// ANATOMİ HARİTASI
// ============================================================
const anatomyScreen = document.getElementById('screen-anatomy');
if (anatomyScreen) {
  const muscles = {
    front: [
      { name:'Göğüs (Pectoralis)', icon:'💪', moves:['Bench Press','İncline Press','Dumbbell Fly','Cable Crossover','Push-Up'] },
      { name:'Omuz (Deltoid)', icon:'🔺', moves:['Lateral Raise','Front Raise','Arnold Press (dikkat!)','Upright Row','Machine Press'] },
      { name:'Biceps', icon:'💪', moves:['Barbell Curl','Hammer Curl','Preacher Curl','Incline Curl','Cable Curl'] },
      { name:'Karın (Core)', icon:'⚡', moves:['Crunch','Plank','Leg Raise','Russian Twist','Cable Crunch'] },
      { name:'Quadriceps', icon:'🦵', moves:['Squat','Leg Press','Lunge','Leg Extension','Front Squat'] },
    ],
    back: [
      { name:'Sırt (Latissimus)', icon:'🏔', moves:['Pull-Up','Lat Pulldown','Bent Row','Cable Row','T-Bar Row'] },
      { name:'Trapez', icon:'🔱', moves:['Shrug','Face Pull','Upright Row','Rack Pull','Deadlift'] },
      { name:'Triceps', icon:'🔧', moves:['Skull Crusher','Rope Pushdown','Close Grip Bench','Overhead Extension','Dips'] },
      { name:'Hamstring', icon:'🦿', moves:['Romanian Deadlift','Leg Curl','Good Morning','Nordic Curl','Stiff Leg DL'] },
      { name:'Baldır (Gastrocnemius)', icon:'🦶', moves:['Standing Calf Raise','Seated Calf Raise','Donkey Calf','Smith Calf','Leg Press Calf'] },
    ]
  };
  let currentSide = 'front';

  function renderAnatomy() {
    const map = document.getElementById('anatomyMap');
    if (!map) return;
    map.innerHTML = muscles[currentSide].map(m => `
      <div class="card" style="margin-bottom:10px;cursor:pointer;" onclick="const next=this.nextElementSibling;next.style.display=next.style.display==='none'?'block':'none'">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:28px;">${m.icon}</div>
          <div style="font-weight:600;font-size:14px;">${m.name}</div>
          <div style="margin-left:auto;color:var(--text3);">▼</div>
        </div>
      </div>
      <div style="display:none;background:var(--bg3);border-radius:12px;padding:12px;margin-top:-8px;margin-bottom:10px;">
        ${m.moves.map(mv => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2);">• ${mv}</div>`).join('')}
      </div>`).join('');
  }

  anatomyScreen.querySelectorAll('.day-chip').forEach((chip, i) => {
    chip.addEventListener('click', () => {
      anatomyScreen.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentSide = i === 0 ? 'front' : 'back';
      renderAnatomy();
    });
  });
  renderAnatomy();
}

// ============================================================
// DAHA FAZLA — Rozetler, ısınma, ipuçları, şablonlar
// ============================================================
function renderBadgesScreen() {
  const el = document.getElementById('badgesContent');
  if (!el) return;
  const badges = [
    { key: 'mex_badge_water', icon: '💧', name: 'Su Ustası', desc: 'Günde 3000 ml su hedefi' },
    { key: 'mex_badge_sleep', icon: '😴', name: 'İyi Uyku', desc: '8+ saat uyku kaydı' },
    { key: 'mex_badge_measurement', icon: '📏', name: 'Ölçüm', desc: 'İlk vücut ölçümünü kaydet' },
    { key: 'mex_badge_protein', icon: '🥩', name: 'Protein Hedefi', desc: 'Günde 170g protein' },
    { key: 'mex_badge_photo', icon: '📸', name: 'Fotoğraf', desc: 'Vücut fotoğrafı ekle' },
    { key: 'mex_workouts', icon: '🏋️', name: 'İlk Antrenman', desc: '1 antrenman tamamla', check: () => parseInt(localStorage.getItem('mex_workouts') || '0', 10) >= 1 },
    { key: 'mex_streak', icon: '🔥', name: '3 Gün Seri', desc: '3 gün üst üste antrenman', check: () => parseInt(localStorage.getItem('mex_streak') || '0', 10) >= 3 },
    { key: 'mex_pr_count', icon: '🏆', name: 'PR Avcısı', desc: '3 PR kaydı', check: () => parseInt(localStorage.getItem('mex_pr_count') || '0', 10) >= 3 },
  ];
  el.innerHTML = badges
    .map((b) => {
      const earned = b.check ? b.check() : !!localStorage.getItem(b.key);
      return `
      <div class="card" style="margin-bottom:10px;opacity:${earned ? 1 : 0.55};border-color:${earned ? 'var(--border2)' : 'var(--border)'};">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="font-size:32px;">${b.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:15px;">${b.name}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px;">${b.desc}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:${earned ? 'var(--green)' : 'var(--text3)'};">${earned ? '✓ Kazanıldı' : 'Kilitli'}</div>
        </div>
      </div>`;
    })
    .join('');
}

function renderWarmupScreen() {
  const el = document.getElementById('warmupContent');
  if (!el) return;
  const moves = [
    { name: 'Band Pull-Apart', sets: '2 x 15', icon: '🔸' },
    { name: 'Dislocates (PVC)', sets: '2 x 10', icon: '🔸' },
    { name: 'Cat-Cow', sets: '1 x 10', icon: '🐈' },
    { name: 'World\'s Greatest Stretch', sets: '5/sn', icon: '🧘' },
    { name: 'Hafif Kardiyo', sets: '5 dk', icon: '🏃' },
    { name: 'Boş Bar Squat', sets: '2 x 10', icon: '🦵' },
    { name: 'Push-Up', sets: '2 x 10', icon: '💪' },
    { name: 'Face Pull (hafif)', sets: '2 x 15', icon: '🎯' },
  ];
  el.innerHTML = moves
    .map(
      (m) => `
    <div class="card" style="margin-bottom:8px;">
      <div class="rehab-move">
        <div class="rehab-icon">${m.icon}</div>
        <div><div class="rehab-name">${m.name}</div><div class="rehab-sets">${m.sets}</div></div>
      </div>
    </div>`
    )
    .join('');
}

function renderTipsScreen() {
  const el = document.getElementById('tipsContent');
  if (!el) return;
  const tips = [
    { title: '💪 Progresif Yüklenme', text: 'Her hafta ağırlığı veya tekrarı küçük artır (2.5–5 kg compound, +1–2 rep izolasyon).' },
    { title: '🥩 Protein', text: 'Lean bulk için günde ~1.8–2 g protein / kg vücut ağırlığı hedefle.' },
    { title: '😴 Uyku', text: 'Kas büyümesi için 7–8 saat uyku şart. Gece vardiyasında melatonin ritmine dikkat.' },
    { title: '⚠ Omuz Sağlığı', text: 'Ağrı varsa overhead press ve ağır lateral raise azalt; face pull ve band work ekle.' },
    { title: '💧 Su', text: 'Antrenman günü en az 2.5–3 L su. Set aralarında da iç.' },
    { title: '📈 Deload', text: 'Her 4–6 haftada bir hacmi %40–50 düşür — toparlanma haftası.' },
  ];
  el.innerHTML = tips
    .map(
      (t) => `
    <div class="tip-card">
      <div class="tip-title">${t.title}</div>
      <div class="tip-content">${t.text}</div>
    </div>`
    )
    .join('');
}

function renderTemplatesScreen() {
  const el = document.getElementById('templatesContent');
  if (!el) return;
  const templates = [
    { name: 'Push (Kısa)', lines: ['Bench Press | 4x6-8', 'İncline DB Press | 3x10', 'Lateral Raise | 4x12', 'Tricep Pushdown | 3x12'] },
    { name: 'Pull (Kısa)', lines: ['Lat Pulldown | 4x8', 'Cable Row | 4x10', 'Face Pull | 3x15', 'Barbell Curl | 3x10'] },
    { name: 'Legs (Kısa)', lines: ['Squat | 4x6', 'Leg Press | 3x12', 'RDL | 3x10', 'Leg Curl | 3x12', 'Calf Raise | 4x15'] },
    { name: 'Full Body', lines: ['Squat | 3x8', 'Bench Press | 3x8', 'Row | 3x10', 'OHP | 3x10', 'Plank | 3x60sn'] },
  ];
  el.innerHTML = templates
    .map(
      (t, i) => `
    <div class="card" style="margin-bottom:10px;">
      <div style="font-family:var(--font);font-size:20px;color:var(--accent);margin-bottom:8px;">${t.name}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:10px;">${t.lines.join('<br>')}</div>
      <button type="button" class="day-chip mex-template-use" data-idx="${i}" style="width:100%;">Program oluşturucuya kopyala</button>
    </div>`
    )
    .join('');

  el.querySelectorAll('.mex-template-use').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = templates[parseInt(btn.getAttribute('data-idx'), 10)];
      if (!t) return;
      showScreen('programs');
      navBtns.forEach((b, i) => b.classList.toggle('active', i === 2));
      document.querySelector('#programMainTabs [data-prog-tab="builder"]')?.click();
      const dayList = document.getElementById('customDayList');
      const nameInput = document.getElementById('customProgramName');
      if (nameInput) nameInput.value = t.name;
      if (dayList) {
        dayList.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'card day-pick-active';
        card.style.marginBottom = '10px';
        card.innerHTML = `
          <div style="font-size:12px;color:var(--accent);margin-bottom:8px;">Gün 1</div>
          <input class="pr-input mex-custom-day-label" value="${t.name}" style="width:100%;margin-bottom:8px;">
          <textarea class="mex-custom-exercises" rows="6" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px;color:var(--text);font-family:inherit;font-size:13px;">${t.lines.join('\n')}</textarea>`;
        dayList.appendChild(card);
      }
      if (typeof showToast === 'function') showToast('Şablon yüklendi — Program → Oluştur', 3000);
    });
  });
}

renderBadgesScreen();
renderWarmupScreen();
renderTipsScreen();
renderTemplatesScreen();

// ============================================================
// HAFTALIK RAPOR
// ============================================================
const weeklyReportContent = document.getElementById('weeklyReportContent');
if (weeklyReportContent) {
  const workouts = parseInt(localStorage.getItem('mex_workouts') || '0');
  const grade = workouts >= 4 ? 'A' : workouts >= 3 ? 'B+' : workouts >= 2 ? 'B' : workouts >= 1 ? 'C+' : 'C';
  weeklyReportContent.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(191,71,255,0.1),rgba(0,0,0,0));border:1px solid rgba(191,71,255,0.2);border-radius:var(--radius);padding:20px;margin-bottom:16px;text-align:center;">
      <div style="font-size:13px;color:var(--text3);margin-bottom:4px;">Bu Hafta Genel Skor</div>
      <div style="font-family:var(--font);font-size:80px;color:#bf47ff;line-height:1;">${grade}</div>
      <div style="font-size:13px;color:var(--text2);">${workouts}/4 antrenman tamam.</div>
    </div>
    ${[
      {icon:'🏋️',label:'Antrenman',val:`${workouts} / 4`,color:'var(--accent)'},
      {icon:'🥗',label:'Beslenme',val:'Orta',color:'var(--gold)'},
      {icon:'😴',label:'Uyku Ort.',val: sleepRecords.length ? (sleepRecords.reduce((s,r)=>s+r.hours,0)/sleepRecords.length).toFixed(1)+' saat' : '—',color:'#bf47ff'},
      {icon:'💧',label:'Su Hedefi',val: waterML >= 3000 ? '✅ Tamam' : Math.round((waterML/3000)*100)+'%',color:'var(--accent3)'},
    ].map(r=>`<div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;align-items:center;gap:10px;"><div style="font-size:24px;">${r.icon}</div><div style="font-weight:600;font-size:14px;">${r.label}</div></div>
      <div style="font-family:var(--font);font-size:20px;color:${r.color};">${r.val}</div>
    </div>`).join('')}
    <div class="card" style="margin-top:6px;border-color:rgba(232,255,71,0.2);">
      <div style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">🎯 Öncelik</div>
      <div style="font-size:14px;color:var(--text);line-height:1.7;">Bu hafta Perşembe Legs+Core ve Cuma Upper antrenmanlarını tamamla. Protein hedefine daha çok dikkat et.</div>
    </div>`;
}

// ============================================================
// HAFTALIK GELİŞİM (DEVELOPMENT)
// ============================================================
const devContent = document.getElementById('developmentContent');
if (devContent) {
  devContent.innerHTML = `
    ${[
      {label:'Toplam Hacim',this_:'8.400 kg',last:'7.200 kg',up:true},
      {label:'Antrenman Sayısı',this_:String(parseInt(localStorage.getItem('mex_workouts')||'0')),last:'1',up:true},
      {label:'Ortalama Set',this_:'4.2',last:'3.8',up:true},
      {label:'Ortalama Uyku',this_: sleepRecords.length ? (sleepRecords.reduce((s,r)=>s+r.hours,0)/sleepRecords.length).toFixed(1)+' saat' : '7.5 saat',last:'6.8 saat',up:true},
    ].map(r=>`<div class="card" style="margin-bottom:10px;">
      <div style="font-size:12px;color:var(--text3);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">${r.label}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><div style="font-family:var(--font);font-size:26px;color:var(--text);">${r.this_}</div><div style="font-size:11px;color:var(--text3);">Bu hafta</div></div>
        <div style="font-size:22px;">${r.up?'📈':'📉'}</div>
        <div style="text-align:right;"><div style="font-family:var(--font);font-size:20px;color:var(--text3);">${r.last}</div><div style="font-size:11px;color:var(--text3);">Geçen hafta</div></div>
      </div>
    </div>`).join('')}`;
}

// ============================================================
// ALIŞVERİŞ LİSTESİ
// ============================================================
const shoppingContent = document.getElementById('shoppingContent');
if (shoppingContent) {
  const items = [
    {cat:'🥩 Protein',items:['Tavuk göğsü (1kg)','Yumurta (30 adet)','Lor peyniri (500g)','Hindi füme','Ton balığı (4 adet)']},
    {cat:'🥛 Süt Ürünleri',items:['Yoğurt (2kg)','Süt (2L)','Beyaz peynir (500g)']},
    {cat:'🌾 Karbonhidrat',items:['Pirinç (1kg)','Yulaf ezmesi (500g)','Tam tahıl ekmek','Makarna (500g)']},
    {cat:'🥦 Sebze-Meyve',items:['Muz (1 demet)','Brokoli','Ispanak','Domates','Salatalık']},
  ];
  shoppingContent.innerHTML = items.map(cat => `
    <div class="card" style="margin-bottom:12px;">
      <div style="font-family:var(--font);font-size:16px;letter-spacing:1px;margin-bottom:10px;">${cat.cat}</div>
      ${cat.items.map(item => `<label style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;">
        <input type="checkbox" style="width:18px;height:18px;accent-color:var(--accent);">
        <span style="font-size:13px;color:var(--text);">${item}</span>
      </label>`).join('')}
    </div>`).join('');
}

// ============================================================
// VÜCUT FOTOĞRAF GÜNLÜĞÜ
// ============================================================
const bodyPhotoScreen = document.getElementById('screen-bodyphotos');
let bodyPhotos = JSON.parse(localStorage.getItem('mex_body_photos') || '[]');

function renderBodyPhotos() {
  const list = document.getElementById('bodyPhotoList');
  if (!list) return;
  if (!bodyPhotos.length) { list.innerHTML = '<div style="text-align:center;color:var(--text3);padding:40px;">Henüz fotoğraf yok</div>'; return; }
  list.innerHTML = bodyPhotos.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <img src="${p.src}" style="width:100%;border-radius:10px;max-height:250px;object-fit:cover;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:600;">${p.note || 'Fotoğraf'}</div>
      <div style="font-size:11px;color:var(--text2);">${p.date} • ${p.weight ? p.weight + 'kg' : ''}</div>
    </div>`).join('');
}

if (bodyPhotoScreen) {
  renderBodyPhotos();
  const bodyPhoto = document.getElementById('bodyPhoto');
  const bodyPhotoPreview = document.getElementById('bodyPhotoPreview');
  const bodyPhotoImg = document.getElementById('bodyPhotoImg');
  let bodyPhotoData = null;

  if (bodyPhoto) {
    bodyPhoto.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        bodyPhotoData = ev.target.result;
        if (bodyPhotoImg) bodyPhotoImg.src = bodyPhotoData;
        if (bodyPhotoPreview) bodyPhotoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  const saveBodyPhotoBtn = bodyPhotoScreen.querySelector('.start-btn');
  if (saveBodyPhotoBtn) {
    saveBodyPhotoBtn.addEventListener('click', () => {
      if (!bodyPhotoData) { showToast('Önce fotoğraf seç!'); return; }
      const note = document.getElementById('bodyPhotoNote').value.trim() || 'Ön';
      const weight = document.getElementById('bodyPhotoWeight').value;
      bodyPhotos.unshift({ src: bodyPhotoData, note, weight, date: new Date().toLocaleDateString('tr-TR') });
      localStorage.setItem('mex_body_photos', JSON.stringify(bodyPhotos.slice(0, 20)));
      renderBodyPhotos();
      if (bodyPhotoPreview) bodyPhotoPreview.style.display = 'none';
      bodyPhotoData = null;
      document.getElementById('bodyPhotoNote').value = '';
      document.getElementById('bodyPhotoWeight').value = '';
      showToast('📸 Fotoğraf kaydedildi!');
      if (!localStorage.getItem('mex_badge_photo')) {
        localStorage.setItem('mex_badge_photo', '1');
        showToast('📸 Rozet: Fotoğraf kazanıldı!', 4000);
      }
    });
  }
}

// ============================================================
// PROGRAMLAR — detail data + navigation + difficulty filter
// ============================================================
const programData = [
  {
    id: 'ppl',
    title: 'PPL — Push Pull Legs',
    emoji: '🔄',
    color: 'var(--accent)',
    difficulty: 'orta',
    diffLabel: '🟡 ORTA',
    days: '5 GÜN',
    goal: '🎯 Hacim + Güç',
    desc: 'Haftada 5 gün, her kas grubu 2 kez çalışır. Düzenli ve dengeli büyüme için ideal.',
    schedule: [
      { day: 'Pazartesi', label: 'PUSH', color: 'var(--accent2)', exercises: ['Bench Press 4x6-8', 'İncline DB Press 4x8-10', 'Machine Chest Press 3x10-12', 'Lateral Raise 4x12-15', 'Tricep Rope Pushdown 4x10-12', 'Overhead Extension 3x12'] },
      { day: 'Salı', label: 'PULL', color: 'var(--accent3)', exercises: ['Lat Pulldown 4x8-10', 'Cable Row 4x10-12', 'Machine Row 3x10-12', 'Face Pull 3x15-20', 'Barbell Curl 3x8-10', 'Hammer Curl 3x10-12'] },
      { day: 'Çarşamba', label: 'LEGS', color: 'var(--green)', exercises: ['Squat 4x6-8', 'Leg Press 4x10-12', 'Romanian DL 3x10', 'Leg Extension 3x12-15', 'Leg Curl 3x12-15', 'Calf Raise 4x15-20', 'Plank 3x60sn'] },
      { day: 'Perşembe', label: 'PUSH', color: 'var(--accent2)', exercises: ['İncline Bench 4x8-10', 'Cable Fly 3x12-15', 'Shoulder Press 3x10-12', 'Cable Lateral Raise 4x12', 'Close Grip Bench 3x10', 'Skull Crusher 3x10-12'] },
      { day: 'Cuma', label: 'PULL', color: 'var(--accent3)', exercises: ['Deadlift 3x5', 'T-Bar Row 4x8-10', 'Seated Cable Row 3x10-12', 'Preacher Curl 3x10-12', 'Incline Curl 3x12', 'Face Pull 3x15'] },
      { day: 'Cumartesi', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Bol su', '7-8 saat uyku', 'Protein hedefini koru', 'Hafif yürüyüş yapabilirsin'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Bol su', '7-8 saat uyku', 'Protein hedefini koru', 'Aktif toparlanma'] },
    ],
    tips: ['Her set arasında 90-120 sn dinlen', 'Progression: Her hafta 2.5kg artır', 'Protein: 1.8-2g × vücut ağırlığı', 'Uyku en az 7.5 saat olmalı'],
  },
  {
    id: 'upperlower',
    title: 'Upper / Lower Split',
    emoji: '⚡',
    color: 'var(--accent3)',
    difficulty: 'orta',
    diffLabel: '🟡 ORTA',
    days: '4 GÜN',
    goal: '🎯 Güç + Hacim',
    desc: 'Haftada 4 gün, 2 üst vücut 2 alt vücut. Toparlanması kolay, 12 saat mesai için ideal.',
    schedule: [
      { day: 'Pazartesi', label: 'ÜST VÜCUT A', color: 'var(--accent3)', exercises: ['Bench Press 4x4-6', 'Barbell Row 4x4-6', 'Shoulder Press 3x8-10', 'Lat Pulldown 3x10-12', 'Lateral Raise 3x12-15', 'Barbell Curl 3x10-12', 'Rope Pushdown 3x12'] },
      { day: 'Salı', label: 'ALT VÜCUT A', color: 'var(--green)', exercises: ['Squat 4x4-6', 'Romanian DL 4x8-10', 'Leg Press 3x10-12', 'Leg Extension 3x12-15', 'Leg Curl 3x12-15', 'Calf Raise 4x15-20'] },
      { day: 'Çarşamba', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Aktif toparlanma', 'Mobilite egzersizleri', 'Bol su'] },
      { day: 'Perşembe', label: 'ÜST VÜCUT B', color: 'var(--accent3)', exercises: ['İncline DB Press 4x8-10', 'Cable Row 4x10-12', 'DB Shoulder Press 3x10-12', 'Straight Arm Pulldown 3x12', 'Face Pull 3x15-20', 'Hammer Curl 3x12', 'Overhead Extension 3x12'] },
      { day: 'Cuma', label: 'ALT VÜCUT B', color: 'var(--green)', exercises: ['Deadlift 4x4-6', 'Leg Press 4x10-12', 'Walking Lunge 3x12/bacak', 'Seated Leg Curl 3x12-15', 'Seated Calf Raise 4x15-20', 'Plank 3x60sn'] },
      { day: 'Cumartesi', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Bol su', 'Uyku en az 8 saat', 'Protein al'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Hafif yürüyüş', 'Mobilite çalışması'] },
    ],
    tips: ['Perşembe-Cuma için mutlaka toparlan', 'Güç setlerinde 3-5 dk dinlen', 'Hacim setlerinde 60-90 sn dinlen', '4 haftada 1 deload haftası yap'],
  },
  {
    id: 'fullbody',
    title: 'Full Body — 3 Gün',
    emoji: '🌍',
    color: 'var(--green)',
    difficulty: 'orta',
    diffLabel: '🟡 ORTA',
    days: '3 GÜN',
    goal: '🎯 Genel Kondisyon + Hacim',
    desc: 'Haftada 3 gün tam vücut. Çok yorucu iş günleri için. Az gün, maksimum etki.',
    schedule: [
      { day: 'Pazartesi', label: 'FULL BODY A', color: 'var(--green)', exercises: ['Squat 4x6-8', 'Bench Press 4x6-8', 'Barbell Row 4x6-8', 'Shoulder Press 3x10-12', 'Romanian DL 3x10-12', 'Barbell Curl 3x10-12', 'Rope Pushdown 3x12'] },
      { day: 'Salı', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Bol su', 'Toparlanma'] },
      { day: 'Çarşamba', label: 'FULL BODY B', color: 'var(--green)', exercises: ['Deadlift 4x5', 'İncline Bench 4x8-10', 'Lat Pulldown 4x8-10', 'DB Shoulder Press 3x10-12', 'Leg Press 3x12-15', 'Hammer Curl 3x12', 'Skull Crusher 3x12'] },
      { day: 'Perşembe', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Bol su', 'Mobilite'] },
      { day: 'Cuma', label: 'FULL BODY C', color: 'var(--green)', exercises: ['Front Squat / Goblet Squat 4x8-10', 'DB Bench Press 4x8-10', 'Cable Row 4x10-12', 'Lateral Raise 4x12-15', 'Good Morning 3x10', 'Face Pull 3x15-20', 'Plank 3x60sn'] },
      { day: 'Cumartesi', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Dinlenme', 'Bol su'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Aktif toparlanma', 'Yürüyüş'] },
    ],
    tips: ['Her antrenman arasında en az 1 gün dinlen', '3 compound + 4 izolasyon ideal', 'Compound setlerde 2-3 dk dinlen', 'Mesaili günler için biçilmiş kaftan'],
  },
  {
    id: 'arnold',
    title: 'Arnold Split',
    emoji: '💀',
    color: 'var(--accent2)',
    difficulty: 'zor',
    diffLabel: '🔴 ZOR',
    days: '6 GÜN',
    goal: '🎯 Maksimum Hacim',
    desc: 'Arnold Schwarzenegger\'ın programı. 6 gün, her kas 2 kez. Sadece toparlanman çok iyiyse yap.',
    schedule: [
      { day: 'Pazartesi', label: 'GÖĞÜS + SIRT', color: 'var(--accent2)', exercises: ['Bench Press 4x8-12', 'İncline Bench 4x8-12', 'DB Fly 3x12-15', 'Barbell Row 4x8-12', 'T-Bar Row 4x8-12', 'Lat Pulldown 3x10-12', 'Cable Pullover 3x12-15'] },
      { day: 'Salı', label: 'OMUZ + KOL', color: 'var(--accent2)', exercises: ['Arnold Press 4x8-12', 'Lateral Raise 4x12-15', 'Front Raise 3x12', 'Barbell Curl 4x8-12', 'İncline DB Curl 3x12', 'Skull Crusher 4x8-12', 'Overhead Extension 3x12'] },
      { day: 'Çarşamba', label: 'BACAK', color: 'var(--green)', exercises: ['Squat 5x8-12', 'Leg Press 4x10-15', 'Leg Extension 4x12-15', 'Leg Curl 4x12-15', 'Standing Calf Raise 5x15-20', 'Seated Calf Raise 4x15-20'] },
      { day: 'Perşembe', label: 'GÖĞÜS + SIRT', color: 'var(--accent2)', exercises: ['İncline DB Press 4x8-12', 'Cable Fly 3x12-15', 'Pec Deck 3x12-15', 'Deadlift 4x6-8', 'Seated Row 4x10-12', 'Straight Arm Pulldown 3x12-15', 'Face Pull 3x15-20'] },
      { day: 'Cuma', label: 'OMUZ + KOL', color: 'var(--accent2)', exercises: ['DB Shoulder Press 4x8-12', 'Upright Row 3x12', 'Rear Delt Fly 3x15', 'Preacher Curl 4x10-12', 'Hammer Curl 3x12', 'Dips 4x12-15', 'Cable Pushdown 3x12-15'] },
      { day: 'Cumartesi', label: 'BACAK', color: 'var(--green)', exercises: ['Front Squat 4x8-10', 'Hack Squat 4x10-12', 'Romanian DL 4x10-12', 'Leg Curl 4x12-15', 'Calf Raise (makine) 5x15-20', 'Plank 3x60sn'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['⚠ Mutlaka dinlen', 'Bol su ve protein', 'Masaj / streching yap', '8+ saat uyku'] },
    ],
    tips: ['⚠ Sadece ileri seviye için!', 'Her hafta deload gerekebilir', 'Protein: 2-2.2g × kg', 'Uyku 8+ saat zorunlu', '6 haftada 1 deload haftası'],
  },
  {
    id: 'powerbuilding',
    title: 'Powerbuilding',
    emoji: '⚡💪',
    color: '#ff47b8',
    difficulty: 'zor',
    diffLabel: '🔴 ZOR',
    days: '5 GÜN',
    goal: '🎯 Güç + Estetik',
    desc: 'Powerlifting + Bodybuilding karışımı. Ağır temel hareketler + izolasyon. Hem güçlü hem estetik.',
    schedule: [
      { day: 'Pazartesi', label: 'GÖĞÜS / GÜÇ', color: '#ff47b8', exercises: ['Bench Press 5x3 (%85-90)', 'Paused Bench 3x5', 'İncline DB Press 4x8-10', 'Cable Fly 3x12-15', 'Rope Pushdown 4x10-12', 'Lateral Raise 3x15'] },
      { day: 'Salı', label: 'SIRT / GÜÇ', color: '#ff47b8', exercises: ['Deadlift 5x3 (%85-90)', 'Deficit Deadlift 3x5', 'Weighted Pull-Up 4x6-8', 'Bent-Over Row 4x8-10', 'Face Pull 3x15-20', 'Barbell Curl 3x10-12'] },
      { day: 'Çarşamba', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Aktif toparlanma', 'Foam rolling', 'Mobilite çalışması'] },
      { day: 'Perşembe', label: 'OMUZ / HACİM', color: '#ff47b8', exercises: ['Strict Press 4x5-6', 'DB Shoulder Press 4x10-12', 'Lateral Raise 4x15', 'Rear Delt Row 4x15', 'Upright Row 3x12', 'Hammer Curl 4x10-12', 'Skull Crusher 4x10-12'] },
      { day: 'Cuma', label: 'BACAK / GÜÇ', color: '#ff47b8', exercises: ['Squat 5x3 (%85-90)', 'Pause Squat 3x5', 'Romanian DL 4x8-10', 'Leg Press 4x10-12', 'Leg Curl 3x12-15', 'Calf Raise 4x15-20'] },
      { day: 'Cumartesi', label: 'KOL / HACİM', color: '#ff47b8', exercises: ['Barbell Curl 4x8-10', 'Incline Curl 3x10-12', 'Cable Curl 3x12-15', 'Close Grip Bench 4x8-10', 'Overhead Extension 3x12', 'Cable Pushdown 3x12-15', 'Lateral Raise 3x15'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Tam dinlenme', 'Bol su ve beslenme', 'Uyku 8+ saat'] },
    ],
    tips: ['Güç setleri: 3-5 dk dinlen', 'Hacim setleri: 60-90 sn dinlen', 'Güç bloğu: 4 hafta → deload', '1RM testini her 8 haftada bir yap', 'Creatine + Protein takviyesi önerilir'],
  },
  {
    id: 'gvt',
    title: 'GVT — Alman Hacim',
    emoji: '🔥',
    color: '#ff4747',
    difficulty: 'zor',
    diffLabel: '🔴 ZOR',
    days: '4 GÜN',
    goal: '🎯 Maksimum Kas Büyümesi',
    desc: '10x10 protokolü. Aynı hareketi 10 set 10 tekrar yaparsın. Acımasız ama çok etkili.',
    schedule: [
      { day: 'Pazartesi', label: 'GÖĞÜS + SIRT', color: '#ff4747', exercises: ['Bench Press 10x10 (%60 1RM) ⚠ Ana hareket', 'Barbell Row 10x10 (%60 1RM) ⚠ Süperset', 'İncline DB Fly 3x12-15 (aksesuar)', 'Face Pull 3x15-20 (aksesuar)'] },
      { day: 'Salı', label: 'BACAK + CORE', color: '#ff4747', exercises: ['Squat 10x10 (%60 1RM) ⚠ Ana hareket', 'Romanian DL 10x10 (%60 1RM) ⚠ Süperset', 'Calf Raise 3x15-20 (aksesuar)', 'Plank 3x60sn (aksesuar)', 'Cable Crunch 3x15 (aksesuar)'] },
      { day: 'Çarşamba', label: 'DİNLENME', color: 'var(--text3)', exercises: ['⚠ Çok önemli — tam dinlenme', 'Foam rolling yap', 'Protein almayı unutma', 'Bol su'] },
      { day: 'Perşembe', label: 'OMUZ + KOL', color: '#ff4747', exercises: ['DB Shoulder Press 10x10 (%60 1RM) ⚠ Ana hareket', 'Barbell Curl 10x10 (%60 1RM) ⚠ Süperset ile', 'Lateral Raise 3x12-15 (aksesuar)', 'Skull Crusher 3x10-12 (aksesuar)', 'Face Pull 3x15 (aksesuar)'] },
      { day: 'Cuma', label: 'BACAK + CORE', color: '#ff4747', exercises: ['Leg Press 10x10 (%60 1RM) ⚠ Ana hareket', 'Leg Curl 10x10 (%60 1RM) ⚠ Süperset', 'Leg Extension 3x15 (aksesuar)', 'Standing Calf Raise 3x20 (aksesuar)', 'Ab Wheel 3x10 (aksesuar)'] },
      { day: 'Cumartesi', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Tam dinlenme', 'Masaj / streching', '8+ saat uyku'] },
      { day: 'Pazar', label: 'DİNLENME', color: 'var(--text3)', exercises: ['Aktif toparlanma', 'Hafif yürüyüş', 'Bol su ve protein'] },
    ],
    tips: ['⚠ Başlangıçta 1RM\'in %40-50\'siyle başla', 'Setler arası DİNLENME 90 sn — sabit kal', '6 haftalık blok — sonra deload', 'Süperset: A hareketi → dinlen → B hareketi', 'İlk hafta çok yorucu olacak — normal'],
  },
];

function buildProgramDetail(prog) {
  const scheduleHTML = prog.schedule.map(day => `
    <div style="margin-bottom:10px;border:1px solid var(--border);border-radius:12px;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--bg3);cursor:pointer;"
           onclick="const body=this.nextElementSibling;body.style.display=body.style.display==='none'?'block':'none'">
        <div>
          <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;">${day.day}</div>
          <div style="font-family:var(--font);font-size:18px;color:${day.color};letter-spacing:1px;">${day.label}</div>
        </div>
        <div style="color:var(--text3);font-size:13px;">▼ gör</div>
      </div>
      <div style="display:none;padding:12px 14px;">
        ${day.exercises.map(ex => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2);">
          <div style="width:6px;height:6px;border-radius:50%;background:${day.color};flex-shrink:0;"></div>${ex}
        </div>`).join('')}
      </div>
    </div>`).join('');

  const tipsHTML = prog.tips.map(t => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;color:var(--text2);">• ${t}</div>`).join('');

  return `
    <button onclick="showScreen('programs');navBtns.forEach((b,i)=>{b.classList.toggle('active',i===2)});" 
      style="background:none;border:none;color:var(--accent);font-size:14px;font-weight:600;cursor:pointer;padding:0 0 16px 0;display:block;">
      ← Programlara Dön
    </button>
    <div style="margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <div style="font-size:36px;">${prog.emoji}</div>
        <div style="display:flex;gap:6px;">
          <div style="background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;">${prog.diffLabel}</div>
          <div style="background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:12px;font-size:11px;color:var(--text2);">${prog.days}</div>
        </div>
      </div>
      <div style="font-family:var(--font);font-size:28px;letter-spacing:1px;color:${prog.color};line-height:1.1;margin-bottom:4px;">${prog.title}</div>
      <div style="font-size:12px;color:var(--accent);font-weight:600;margin-bottom:8px;">${prog.goal}</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.7;">${prog.desc}</div>
    </div>

    <div style="font-family:var(--font);font-size:14px;letter-spacing:2px;color:var(--text3);margin-bottom:10px;">📅 HAFTALIK PROGRAM</div>
    ${scheduleHTML}

    <div style="margin-top:16px;background:rgba(232,255,71,0.04);border:1px solid rgba(232,255,71,0.12);border-radius:var(--radius);padding:14px;">
      <div style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">💡 İPUÇLARI</div>
      ${tipsHTML}
    </div>

    <button onclick="
      localStorage.setItem('mex_active_program','${prog.id}');
      showToast('✅ ${prog.title} aktif edildi!', 3000);
      showScreen('programs');
      navBtns.forEach((b,i)=>{b.classList.toggle('active',i===2)});
    " style="width:100%;margin-top:20px;padding:16px;background:${prog.color};color:#000;border:none;border-radius:12px;font-family:var(--font);font-size:18px;letter-spacing:2px;cursor:pointer;">
      ✅ BU PROGRAMI SEÇ
    </button>`;
}

// Wire up program card clicks
const programCards = document.querySelectorAll('#programsContent .exercise-card');
programCards.forEach((card, i) => {
  card.addEventListener('click', () => {
    const prog = programData[i];
    if (!prog) return;
    const detail = document.getElementById('programDetailContent');
    if (detail) detail.innerHTML = buildProgramDetail(prog);
    showScreen('programdetail');
    navBtns.forEach((b, idx) => b.classList.toggle('active', idx === 2));
  });
});

// Difficulty filter chips
const diffChips = document.querySelectorAll('#programDiffFilters .day-chip');
diffChips.forEach(chip => {
  chip.addEventListener('click', () => {
    diffChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.textContent.trim().toLowerCase();
    programCards.forEach((card, i) => {
      const prog = programData[i];
      if (!prog) return;
      const show = filter === 'tümü' || prog.difficulty === (filter.includes('orta') ? 'orta' : 'zor');
      card.style.display = show ? 'block' : 'none';
    });
  });
});

// ============================================================
// INIT
// ============================================================
loadSavedState();
showScreen('home');
