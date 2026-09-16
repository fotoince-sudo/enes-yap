// Enes Yapı — alan modeli sabitleri ve etiketleri (tek kaynak).

export const REQUEST_STATUS = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  gorusuldu: "Müşteriyle görüşüldü",
  kesif_planlandi: "Keşif planlandı",
  kesif_yapildi: "Keşif yapıldı",
  teklif_hazirlaniyor: "Teklif hazırlanıyor",
  teklif_gonderildi: "Teklif gönderildi",
  onaylandi: "Onaylandı",
  uygulamada: "Uygulamada",
  tamamlandi: "Tamamlandı",
  iptal: "İptal",
} as const;
export type RequestStatus = keyof typeof REQUEST_STATUS;

export const QUOTE_STATUS = {
  taslak: "Taslak",
  hazirlaniyor: "Hazırlanıyor",
  gonderildi: "Gönderildi",
  musteri_inceliyor: "Müşteri inceliyor",
  kabul: "Kabul edildi",
  red: "Reddedildi",
} as const;
export type QuoteStatus = keyof typeof QUOTE_STATUS;

export const PROJECT_STATUS = {
  baslamadi: "Başlamadı",
  hazirlik: "Hazırlık",
  malzeme_bekleniyor: "Malzeme bekleniyor",
  basladi: "Başladı",
  devam: "Devam ediyor",
  kontrol: "Kontrolde",
  tamamlandi: "Tamamlandı",
} as const;
export type ProjectStatus = keyof typeof PROJECT_STATUS;

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
