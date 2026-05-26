# MEX Pro - Fitness & Workout Tracker

Modern, hızlı ve kapsamlı bir fitness takip uygulaması. Antrenmanlarınızı planlayın, ilerlemenizi grafiklerle takip edin ve beslenme hedeflerinize ulaşın.

## ✨ Özellikler

- **Antrenman Takibi:** Set set ağırlık ve tekrar kaydı, dinlenme süresi sayacı.
- **Program Oluşturucu:** Kendi özel programınızı oluşturun veya hazır programları kullanın (PPL, Arnold Split, vb.).
- **Gelişmiş İstatistikler:** Antrenman hacmi (volume) ve PR (Kişisel Rekor) gelişim grafikleri.
- **Beslenme Pro:** Günlük makro takibi, TR markalar veritabanı, tarifler ve alışveriş listesi.
- **Vardiya Modu:** Enerji seviyenize göre antrenman önerileri.
- **Kişisel Profil:** Hedefinize göre otomatik makro hesaplama (Lean Bulk, Cut, vb.).
- **PWA Desteği:** Uygulamayı telefonunuza veya bilgisayarınıza yükleyip uygulama gibi kullanın.

## 🚀 Kurulum ve Çalıştırma

Uygulamanın tüm özelliklerini (üyelik, veri senkronizasyonu vb.) kullanabilmek için yerel bir sunucu üzerinden çalıştırılması önerilir.

### Windows (Hızlı Başlat)
`start.bat` dosyasına çift tıklamanız yeterlidir (Python yüklü olmalıdır).

### Manuel Başlatma
```bash
python server.py
```
Ardından tarayıcınızda şu adresi açın: **http://127.0.0.1:8080**

## 🔑 Google ile Giriş Yapılandırması

1. [Google Cloud Console](https://console.cloud.google.com/) üzerinden bir OAuth Client ID (Web) oluşturun.
2. Yetkili köken (Authorized Origin) olarak `http://127.0.0.1:8080` ekleyin.
3. `config.example.js` dosyasını `config.js` olarak kopyalayın ve Client ID'nizi içine yapıştırın.

## 🛠️ Teknoloji Yığını

- **Frontend:** Vanilla JS, CSS3 (Modern Flex/Grid), HTML5.
- **Backend:** Python (Standard Library) - Ek paket kurulumu gerektirmez.
- **Veri Saklama:** LocalStorage + Local Server Sync.

## 📂 Dosya Yapısı

- `app.js`: Ana uygulama mantığı ve navigasyon.
- `mex-auth.js`: Üyelik ve Google Login sistemi.
- `mex-exercises.js`: Hareket kütüphanesi ve program oluşturucu.
- `mex-features.js`: İstatistikler, grafikler ve PR takibi.
- `mex-nutrition.js`: Beslenme Pro modülü.
- `theme-pro.css`: Modern ve profesyonel "Dark Mode" teması.

---
*Not: Bu uygulama tamamen cihazınızda ve yerel sunucunuzda çalışacak şekilde tasarlanmıştır. Verileriniz gizlidir.*
