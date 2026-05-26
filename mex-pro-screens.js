/** MEX Pro — Yeni ekranlar (mevcut yapıyı bozmadan ekler) */
window.showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const scr = document.getElementById('screen-' + id);
  if (scr) scr.classList.add('active');
};

(function () {
  const html = `
<div class="screen" id="screen-profile">
  <div class="pro-screen-title">PROFİL & HEDEF</div>
  <div class="card">
    <div class="section-title">Kişisel bilgiler</div>
    <input class="pr-input" id="profileName" placeholder="Ad" style="width:100%;margin-bottom:8px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
      <input class="pr-input" id="profileHeight" type="number" placeholder="Boy (cm)" inputmode="numeric">
      <input class="pr-input" id="profileWeight" type="number" placeholder="Kilo (kg)" inputmode="decimal">
    </div>
    <select class="pr-input" id="profileGoal" style="width:100%;margin-bottom:8px;">
      <option value="lean_bulk">Lean bulk</option>
      <option value="cut">Kesme (cut)</option>
      <option value="maintain">Koruma</option>
      <option value="strength">Güç</option>
    </select>
    <button type="button" class="start-btn" id="profileSaveBtn" style="margin:0;">KAYDET</button>
  </div>
  <div class="card">
    <div class="section-title">Günlük makro hedefi</div>
    <p style="font-size:12px;color:var(--text2);margin-bottom:10px;">Antrenman gününe göre otomatik (Leg day = daha fazla karb)</p>
    <div id="profileMacroPreview" class="macro-ring-row"></div>
  </div>
  <div class="card">
    <div class="section-title">Wearable / Sağlık</div>
    <p style="font-size:13px;color:var(--text2);line-height:1.6;">Apple Health / Google Fit tam entegrasyon web'de sınırlıdır. Verilerini JSON olarak dışa aktarabilirsin.</p>
    <button type="button" class="day-chip" id="profileExportBtn" style="width:100%;margin-top:10px;">Verileri dışa aktar (JSON)</button>
  </div>
</div>

<div class="screen" id="screen-nutrition">
  <div class="pro-screen-title">BESLENME PRO</div>
  <div class="pro-tabs" id="nutritionTabs">
    <button type="button" class="pro-tab active" data-nut="dashboard">Özet</button>
    <button type="button" class="pro-tab" data-nut="barcode">Barkod</button>
    <button type="button" class="pro-tab" data-nut="photo">Foto AI</button>
    <button type="button" class="pro-tab" data-nut="foods">TR Markalar</button>
    <button type="button" class="pro-tab" data-nut="recipes">Tarif</button>
    <button type="button" class="pro-tab" data-nut="shop">Market</button>
  </div>
  <div class="pro-panel active" id="nutPanel-dashboard">
    <div class="macro-ring-row" id="nutMacroRings"></div>
    <div class="card"><div class="section-title">Bugünkü öğünler</div><div id="nutMealLog"></div>
      <button type="button" class="day-chip" id="nutQuickMeal" style="width:100%;margin-top:8px;">+ Hızlı öğün ekle</button>
    </div>
    <div class="card" id="nutWorkoutTip"><div class="section-title">Antrenman öncesi / sonrası</div><p id="nutWorkoutTipText" style="font-size:13px;color:var(--text2);line-height:1.6;"></p></div>
  </div>
  <div class="pro-panel" id="nutPanel-barcode">
    <div class="card"><div class="section-title">Barkod tarayıcı</div>
      <video id="barcodeVideo" class="scanner-video" playsinline muted></video>
      <button type="button" class="start-btn" id="barcodeStartBtn" style="margin-top:10px;">Kamerayı aç</button>
      <input class="pr-input" id="barcodeManual" placeholder="Barkod numarası manuel" style="width:100%;margin-top:8px;">
      <button type="button" class="day-chip" id="barcodeSearchBtn" style="width:100%;margin-top:8px;">Ara</button>
      <div id="barcodeResult" style="margin-top:12px;font-size:13px;color:var(--text2);"></div>
    </div>
  </div>
  <div class="pro-panel" id="nutPanel-photo">
    <div class="card"><div class="section-title">Yemek fotoğrafı — AI tahmin</div>
      <input type="file" id="foodPhotoInput" accept="image/*" capture="environment" style="width:100%;margin-bottom:10px;color:var(--text2);">
      <canvas id="foodPhotoCanvas" style="display:none;"></canvas>
      <div id="foodPhotoPreview" style="margin-bottom:10px;"></div>
      <button type="button" class="start-btn" id="foodPhotoAnalyzeBtn">TAHMİN ET</button>
      <div id="foodPhotoResult" style="margin-top:12px;font-size:13px;color:var(--text2);line-height:1.6;"></div>
    </div>
  </div>
  <div class="pro-panel" id="nutPanel-foods"><div class="card"><input class="pr-input" id="trFoodSearch" placeholder="Marka veya yemek ara..." style="width:100%;margin-bottom:10px;"><div id="trFoodList"></div></div></div>
  <div class="pro-panel" id="nutPanel-recipes"><div id="recipeList"></div></div>
  <div class="pro-panel" id="nutPanel-shop"><div class="card"><div class="section-title">Alışveriş listesi</div><div id="shopList"></div>
    <input class="pr-input" id="shopNewItem" placeholder="Ürün ekle..." style="width:100%;margin-top:8px;"><button type="button" class="day-chip" id="shopAddBtn" style="width:100%;margin-top:8px;">Ekle</button>
  </div></div>
</div>
`;

  function inject() {
    const nav = document.querySelector('nav.nav');
    if (!nav || document.getElementById('screen-profile')) return;
    nav.insertAdjacentHTML('beforebegin', html);
    document.querySelectorAll('.pro-screen-title').forEach((el) => {
      // Inline stilleri kaldırdık, theme-pro.css üzerinden kontrol edilecek
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
