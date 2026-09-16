// Enes Yapı — alan modeli sabitleri ve etiketleri (tek kaynak).

export const REQUEST_STATUS = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  gorusuldu: "İletişim kuruldu",
  kesif_planlandi: "Keşif planlandı",
  kesif_yapildi: "Keşif yapıldı",
  teklif_hazirlaniyor: "Teklif hazırlanıyor",
  teklif_gonderildi: "Teklif gönderildi",
  onaylandi: "Onaylandı",
  is_basladi: "İş başladı",
  uygulamada: "Devam ediyor",
  beklemede: "Beklemede",
  tamamlandi: "Tamamlandı",
  iptal: "İptal edildi",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

export const QUOTE_STATUS = {
  taslak: "Taslak",
  hazirlaniyor: "Hazırlanıyor",
  gonderildi: "Müşteriye gönderildi",
  musteri_inceliyor: "Müşteri inceliyor",
  revizyon: "Revizyon istendi",
  kabul: "Onaylandı",
  red: "Reddedildi",
} as const;
export type QuoteStatus = keyof typeof QUOTE_STATUS;

export const PROJECT_STATUS = {
  planlandi: "Planlandı",
  baslamadi: "Başlamadı",
  hazirlik: "Hazırlık",
  malzeme_bekleniyor: "Malzeme bekleniyor",
  basladi: "Başladı",
  devam: "Devam ediyor",
  kontrol: "Kontrolde",
  beklemede: "Beklemede",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
} as const;
export type ProjectStatus = keyof typeof PROJECT_STATUS;

/** Tadilat fırsatı durumları (CRM akışı). */
export const OPPORTUNITY_STATUS = {
  yeni: "Yeni",
  incelenecek: "İncelenecek",
  iletisim_kurulacak: "İletişim kurulacak",
  iletisim_kuruldu: "İletişim kuruldu",
  ilgileniyor: "İlgileniyor",
  ilgilenmiyor: "İlgilenmiyor",
  takipte: "Takipte",
  musteri_oldu: "Müşteri oldu",
  kapandi: "Fırsat kapandı",
} as const;

export const RENOVATION_LIKELIHOOD = {
  yuksek: "Yüksek",
  orta: "Orta",
  dusuk: "Düşük",
  belirsiz: "Belirsiz",
} as const;

export const SALE_RENT_STATUS = {
  satilik: "Satılık",
  kiralik: "Kiralık",
  bilinmiyor: "Bilinmiyor",
} as const;

export const OPPORTUNITY_SOURCE = ["manuel", "telefon", "web-formu", "tavsiye", "saha", "ilan-taramasi", "diger"] as const;

/** Potansiyel müşteri (internet taraması) aday durumları. */
export const PROSPECT_STATUS = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  iletisime_gecildi: "İletişime Geçildi",
  cevap_bekleniyor: "Cevap Bekleniyor",
  kesif_planlandi: "Keşif Planlandı",
  teklif_verildi: "Teklif Verildi",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
  uygun_degil: "Uygun Değil",
} as const;

/** Aday kaynakları — yalnızca erişimi ve kullanımı açıkça izinli kaynaklar. */
export const PROSPECT_SOURCE = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google (arama / harita)",
  "ilan-siteleri": "İlan siteleri (izinli)",
  "kendi-web-formu": "Kendi web formu",
  telefon: "Telefon",
  tavsiye: "Tavsiye",
  saha: "Saha / broşür",
  "izinli-ilan-kaynagi": "İzinli ilan kaynağı",
  "resmi-api": "Resmî API",
  "acik-veri": "Açık veri",
  manuel: "Manuel giriş",
  diger: "Diğer",
} as const;

/** Kaynak değerinin görünen adı. */
export const prospectSourceLabel = (value: string) =>
  (PROSPECT_SOURCE as Record<string, string>)[value] ?? value;

/** Kaynağın otomatik kullanım izni durumu. */
export const PROSPECT_PERMISSION = {
  izinli: "İzinli (otomatik kullanılabilir)",
  manuel_giris: "Manuel giriş (elle eklendi)",
  izinsiz: "İzinsiz — kullanılamaz",
} as const;

/** Aday ihtiyaç türleri. */
export const PROSPECT_NEED_TYPES = [
  "Tadilat",
  "Komple yenileme",
  "Boya badana",
  "Mutfak yenileme",
  "Banyo yenileme",
  "Dekorasyon",
  "Anahtar teslim",
  "Ev yenileme",
  "İş yeri / ofis",
  "Diğer",
] as const;

export const CUSTOMER_STATUS = {
  aktif: "Aktif",
  potansiyel: "Potansiyel",
  pasif: "Pasif",
  kaybedildi: "Kaybedildi",
} as const;

export const PROPERTY_USAGE = ["Boş", "Sahibi oturuyor", "Kiracı var", "Satışta", "Kirada", "İnşaat halinde"] as const;

export const PAYMENT_STATUS = {
  odenmedi: "Ödenmedi",
  kismi: "Kısmi ödeme",
  odendi: "Ödendi",
  gecikmede: "Gecikmede",
} as const;

export const ROLE_LABELS = {
  admin: "Yönetici (admin)",
  yonetici: "Yönetici",
  operasyon: "Operasyon",
  saha: "Saha personeli",
  personel: "Personel",
  ekip: "Ekip / usta",
} as const;

/** Aktivite geçmişi işlem türleri. */
export const ACTIVITY_TYPES = {
  note: "Not eklendi",
  created: "Kayıt oluşturuldu",
  phone: "Telefon görüşmesi yapıldı",
  whatsapp: "WhatsApp görüşmesi yapıldı",
  survey_planned: "Keşif planlandı",
  survey_done: "Keşif tamamlandı",
  quote_created: "Teklif oluşturuldu",
  quote_sent: "Teklif gönderildi",
  status_change: "Durum değiştirildi",
} as const;

export const PARTNER_TYPE = {
  usta: "Usta",
  ekip: "Ekip",
  firma: "Firma",
  cozum_ortagi: "Çözüm ortağı",
} as const;

export const OPPORTUNITY_TYPE = {
  satisa_hazirlik: "Satışa hazırlık",
  kiraya_hazirlik: "Kiraya hazırlık",
  satis_ihtimali: "Gayrimenkul satış ihtimali",
  kiralama_ihtimali: "Gayrimenkul kiralama ihtimali",
  yatirim_yenileme: "Yatırım amaçlı yenileme",
  komple_yenileme: "Komple yenileme",
} as const;

export const PHOTO_PHASE = {
  once: "Önce",
  uygulama: "Uygulama sırasında",
  sonra: "Sonra",
} as const;

export const PROPERTY_TYPES = [
  "Daire",
  "Müstakil ev",
  "Villa",
  "Dubleks",
  "İş yeri / dükkan",
  "Ofis",
  "Bina",
  "Diğer",
] as const;

export const BUDGET_RANGES = [
  "50.000 TL altı",
  "50.000 - 100.000 TL",
  "100.000 - 250.000 TL",
  "250.000 - 500.000 TL",
  "500.000 - 1.000.000 TL",
  "1.000.000 TL üzeri",
  "Belirtmek istemiyorum",
] as const;

export const START_TIMES = [
  "En kısa sürede",
  "1 ay içinde",
  "1-3 ay içinde",
  "3-6 ay içinde",
  "Henüz net değil",
] as const;

export const UNITS = ["adet", "m²", "m", "mtül", "saat", "gün", "paket", "takım"] as const;

/** Hizmet alanına göre gereken ekip türleri — usta/ekip eşleştirme altyapısı. */
export const SERVICE_TEAM_MAP: Record<string, string[]> = {
  "banyo-yenileme": ["sihhi-tesisat", "seramik", "elektrik", "boya-badana"],
  "mutfak-yenileme": ["sihhi-tesisat", "seramik", "elektrik", "boya-badana", "kapi-pencere"],
  "komple-tadilat": [
    "sihhi-tesisat",
    "elektrik",
    "seramik",
    "alcipan-asma-tavan",
    "boya-badana",
    "zemin-parke",
    "kapi-pencere",
  ],
  "daire-yenileme": ["boya-badana", "zemin-parke", "elektrik", "alcipan-asma-tavan"],
  "ev-tadilati": ["boya-badana", "zemin-parke", "sihhi-tesisat", "elektrik"],
  "isyeri-ofis-tadilati": ["alcipan-asma-tavan", "elektrik", "boya-badana", "zemin-parke"],
  "kiraya-hazirlama": ["boya-badana", "zemin-parke", "sihhi-tesisat"],
  "satisa-hazirlama": ["boya-badana", "zemin-parke", "seramik"],
  "gayrimenkul-yenileme": ["boya-badana", "zemin-parke", "seramik", "elektrik"],
  "mantolama-dis-cephe": ["mantolama-dis-cephe", "boya-badana"],
  "cati-izolasyon": ["cati-izolasyon"],
};

export const tl = (value: number | null | undefined) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );

export const trDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

/** Tarama bölgesi: yalnızca İzmir ili ve ilçeleri. */
export const IZMIR_DISTRICTS = [
  "Aliağa","Balçova","Bayındır","Bayraklı","Bergama","Beydağ","Bornova","Buca","Çeşme","Çiğli",
  "Dikili","Foça","Gaziemir","Güzelbahçe","Karabağlar","Karaburun","Karşıyaka","Kemalpaşa","Kınık",
  "Kiraz","Konak","Menderes","Menemen","Narlıdere","Ödemiş","Seferihisar","Selçuk","Tire","Torbalı","Urla",
] as const;
