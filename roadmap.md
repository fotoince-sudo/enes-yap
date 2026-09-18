# Enes Yapı — açık işler

- [x] WhatsApp Business (Meta Platform API) bağlantısı: KULLANICI KARARI (18 Eyl 2026) — bağlantı/entegrasyon KURULMAYACAK. Site yalnızca doğrudan wa.me/905307641717 sohbet bağlantısı kullanıyor (tüm butonlar + Emir handoff bu numaraya gidiyor; eski 905333992540 sitede yok).

- [ ] WhatsApp Business bağlantısı (18 Eyl 14:20): Meta Embedded Signup ONAYLANDI — WhatsApp Business "İzmir Enes Yapı", WABA "Enes Yapı" (ID 161950678560356), numara +90 530 764 17 17. Kalan sorun: Lovable bağlantı kartı "Complete the WhatsApp signup with Meta" aşamasında kalıyor; Meta'dan dönüş sonrası "Hesabınızı bağlama" ekranında takılıyor. Oturum kimliği (destek talebi için): 01a0b434-3a54-7fb6-828e-7f26c6e515ca. Demo/test numarası kullanılmayacak; yeni Facebook Sayfası oluşturulmayacak; mevcut Facebook/Instagram bağlantıları bozulmayacak.
  - [x] Mesajlaşma altyapısı panelde hazır (18 Eyl): imzalı webhook alıcısı (/api/public/whatsapp/webhook) + inbox (whatsapp_webhook_events) + mesaj tablosu (whatsapp_messages), yönetim panelinde "WhatsApp Mesajları" sayfası (sohbet listesi, mesaj balonları, panelden yanıt gönderme, 20 sn'de yenilenme). Bağlantı tamamlandığı anda mesajlar akmaya başlar.

  - [ ] Bağlantı tamamlandıktan sonra Meta doğrulama akışını bitir: WhatsApp Business hesabı, Facebook Sayfası ve WABA ID (161950678560356) uygulama ayarlarına kaydedilecek; WHATSAPP_API_KEY gizli anahtarı webhook (/api/public/whatsapp/webhook) ve panelden gönderimde kullanılacak.
  - [ ] Sohbet butonu: mesaj gönderip okunma/cevaplanma durumunu canlı izleme (panel sohbetinde ✓/✓✓ okundu işaretleri + yeni gelen mesaj vurgusu).
  - [x] Meta entegrasyon izleme sayfası (panel): bağlantı durumu, bağlı sayfa/numara, WABA ID ve mesaj akışı tek ekranda.

- [ ] E-posta bildirimleri: gönderen alan adı (örn. bilgi@enesyapi.com) tanımlanmasını bekliyor.
- [ ] Source Research Motoru: AKTİF (elle çalıştırma + zamanlayıcı ucu hazır). Otomatik saatli/günlük zamanlama kullanıcı onayı bekliyor.
- [ ] Dış kaynakların izin durumu "inceleniyor" — kullanıcı hangi kaynakları "izinli" işaretleyeceğini bildirmeli (izinli olmayan kaynak otomatik taranmaz).
- [x] Source Research Motoru günlük otomatik çalışma (her gün 09:30 TR) + çalışma günlüğü kaydı.
- [x] Aday İşleme Zinciri (temizleme → tekilleştirme → fırsat puanlama → CRM eşleştirme) tarama turuna bağlandı; "Motor Durumu" ekranı eklendi.

## SEO (İzmir ilk sayfa hedefi)
- [x] Hizmet (18), ilçe (14), ilçe+hizmet (56), rehber (4), iletişim sayfaları + sitemap.xml (94 adres) + robots.txt (panel taramaya kapalı)
- [x] LocalBusiness/Organization, WebSite, Service, Article, BreadcrumbList structured data; canonical + tr dil etiketi
- [x] Yönetim panelinde "SEO Denetimi" ekranı
- [x] Google Search Console bağlantısı + sitemap gönderimi — site doğrulandı (fotoince@gmail.com sahibi), 94 URL'lik sitemap gönderildi, 0 hata/0 uyarı (17 Eyl 2026)
- [x] Halka açık proje vitrini güvenliği — yalnız proje adı, ilçe ve herkese açık fotoğraflar; sözleşme/ödeme/maliyet ve iç alanlar anonim erişime kapalı
- [ ] Google İşletme Profili (haritalarda görünürlük) — kullanıcı tarafında yapılacak
- [ ] Gerçek proje fotoğrafları ve önce/sonra kayıtlarının panelden yayına alınması
