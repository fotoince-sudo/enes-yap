# Enes Yapı — Türkhosting (Plesk Node.js) kurulumu

Bu dal (`turkhosting`) Lovable'dan bağımsız çalışır. Talep formu Enes Emlak'ın Supabase
veritabanındaki ortak CRM'e (`create_yapi_web_talep`, `yapi-talep-gorseller`) yazar.

Plesk ayarları:
- Git: depo `fotoince-sudo/enes-yap`, dal `turkhosting`
- Node.js sürümü: 22 (en az 20)
- Uygulama kökü / belge kökü: depo klasörü
- Başlangıç dosyası: `app.cjs` (içinden `.output/server/index.mjs` başlar)
- Belge kökü: `/izmirenesyapi.com.tr/.output/public`
- Derlemeden önce Plesk'in varsayılan `index.html` ve yan dosyalarını silin (aksi halde derlemeye karışır)
- Sırayla: "NPM install" → "Run script: build" → "Restart App"

Kaldırılanlar (Lovable'a bağlıydı): yönetim paneli, müşteri girişi, Emir AI, WhatsApp
webhook, kaynak tarama motoru. Yönetim Enes Emlak panelinden yapılacak.
