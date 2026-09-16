# Potansiyel Müşteriler / İnternet Taraması Modülü — Uygulama Planı

Bu plan yalnızca hazırlıktır: hiçbir dış siteye tarama başlatılmaz, API/scraper kurulmaz, mevcut CRM verisi ve ekranları değişmez.

## Amaç

İnternette tadilat, yenileme, boya, mutfak, banyo, dekorasyon, anahtar teslim gibi hizmet ihtiyacı belirten adayları tek listede toplayıp Emir'in takip edebileceği fırsatlara dönüştürmek.

## Panelde ne eklenecek

Yönetim panelinin sol menüsüne yeni bir bölüm: **Potansiyel Müşteriler / İnternet Taraması** (mevcut "Tadilat Fırsatları" bölümü olduğu gibi kalır).

Bu ekranda:
- Aday listesi: başlık, konum, ihtiyaç türü, kaynak, tarih, durum, sorumlu, son iletişim
- Arama ve durum/konum/kaynak filtreleri
- Yeni aday ekleme ve düzenleme formu
- Aday kartında: kısa açıklama, Emir'in notları, ilan bağlantısı
- "Fırsata dönüştür" düğmesi: aday, mevcut Tadilat Fırsatları akışına aktarılır (aday kaydı korunur, bağlantı kurulur)
- Mobil öncelikli görünüm, tüm metinler Türkçe

## Her aday için tutulacak bilgiler

Kaynak, ilan/başvuru bağlantısı, başlık, il/ilçe/mahalle, ihtiyaç türü, ilan veya talep tarihi, iletişim bilgisi (yalnızca kaynak tarafından açıkça ve hukuken sunulmuşsa; zorunlu değil), kısa açıklama, tahmini iş türü, tahmini bütçe/değer, durum, sorumlu personel, Emir'in notları, ilk ve son iletişim tarihi.

## Durumlar

Yeni · İnceleniyor · İletişime Geçildi · Cevap Bekleniyor · Keşif Planlandı · Teklif Verildi · Kazanıldı · Kaybedildi · Uygun Değil

## Mükerrer kayıt engeli

Aynı aday ikinci kez eklenemez:
- Aynı ilan bağlantısı tek kez kaydedilebilir (bağlantı sadeleştirilerek karşılaştırılır: takip parametreleri temizlenir)
- Bağlantı yoksa: aynı telefon + aynı ihtiyaç türü kombinasyonu tek kez
- Bunlar da yoksa: başlık + ilçe + tarih birleşimi tek kez
- Bir aday zaten varsa kullanıcıya "Bu aday zaten kayıtlı" uyarısı verilir ve mevcut kayda yönlendirilir

## Mevcut yapıyla ilişkiler

- Aday → **Tadilat Fırsatı**: dönüştürme sırasında bağ kurulur, fırsat mevcut akışta ilerler
- Aday → **Müşteri**: müşteri oldu durumunda mevcut müşteri kaydına bağlanır
- Aday → **Gayrimenkul**: adres/ilan bilgisinden gayrimenkul kaydı oluşturulursa bağlanır
- Sorumlu personel mevcut kullanıcı/rol yapısından seçilir
- Yetkilendirme: yöneticiler tüm adayları, personel yalnızca kendisine atanan adayları görür — mevcut rol mantığıyla aynı

## Hukuki ve teknik sınırlar (tasarıma gömülü)

- Yalnızca erişimine ve otomatik kullanımına açıkça izin verilen kaynaklar (resmî API, açık veri, izin verilen ilan/talep kaynakları, kendi web formunuz, tavsiye ve saha kayıtları)
- Kaynak başına "izin durumu" alanı: izinli / manuel giriş / izinsiz (izinsiz kaynak listeye alınamaz)
- CAPTCHA aşma, oturum/erişim engeli aşma, gizli iletişim bilgisi toplama **yapılmaz**
- İletişim bilgisi yalnızca kaynakta açıkça yayınlanmışsa kaydedilir; kaydın kaynağı ve tarihi her zaman saklanır (KVKK izlenebilirliği)
- Aday talebi üzerine kayıt silme/gizleme desteklenir

## Aşamalar

1. **Bu aşama:** veri modeli ve ekran tasarımının planı (şu an tamamlandı)
2. Aday tablosu + mükerrer engeli + yetkilendirme kuralları
3. Panel ekranı: liste, filtre, form, notlar, fırsata dönüştürme
4. Elle/toplu aday girişi (kopyala-yapıştır ile hızlı ekleme)
5. Ancak siz onay verdikten sonra: izin verilen kaynaklar için otomatik tarama

## Teknik notlar

- Yeni tablo `lead_prospects`; mevcut tablolar değişmez, veri silinmez
- Yeni durum listesi `src/lib/domain.ts` içine `PROSPECT_STATUS` olarak eklenir (mevcut sabitler korunur)
- Mükerrer engeli veritabanı düzeyinde: `normalized_url` üzerinde tekil indeks + telefon/ihtiyaç türü ve başlık/ilçe/tarih için kısmi tekil indeksler
- Ekran mevcut `CrudTable` deseniyle, `/yonetim/potansiyel-musteriler` rotasında
- RLS: yöneticiler tam erişim (`is_manager`), personel `assigned_to = auth.uid()` satırları
- 2. aşamada tek bir migration; sadece ekleme yapan, mevcut şemaya dokunmayan SQL
