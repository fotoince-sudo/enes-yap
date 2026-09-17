# Vitrin veri güvenliği düzeltmesi

## Yapılacaklar
- Halka açık proje erişimini güvenli bir vitrin görünümüne taşıyacağım.
- Vitrin görünümü yalnız proje kimliği, proje adı, ilçe ve herkese açık fotoğrafları döndürecek.
- Anonim ziyaretçilerin ana proje tablosuna doğrudan erişimini kaldıracağım; sözleşme, maliyet, ödeme, müşteri ve iç not alanları dışarıdan okunamayacak.
- Ana sayfadaki “Tamamlanan projeler” bölümünü yeni güvenli görünümden besleyip proje adı, ilçe ve fotoğrafları gösterecek şekilde düzenleyeceğim.
- Yönetim paneli ve müşteri hesabındaki yetkili finansal görünümleri değiştirmeyeceğim.
- Mobil görünümü ve anonim veri erişimini doğrulayacağım.

## Teknik ayrıntı
- Lovable Cloud üzerinde yalnız güvenli sütunları sunan bir SQL görünümü oluşturulacak.
- Görünüm, sadece `is_public_reference = true` projeleri ve `is_public = true` fotoğrafları kapsayacak.
- `projects` tablosundaki anonim `SELECT` yetkisi geri alınacak; personel/müşteri erişim politikaları korunacak.
