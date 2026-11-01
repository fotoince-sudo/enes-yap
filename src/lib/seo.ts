/**
 * Enes Yapı — site geneli SEO verileri (tek kaynak).
 *
 * Buradaki bilgiler gerçektir: işletme adı, telefon, adres, çalışma saatleri ve
 * hizmet bölgeleri yönetici tarafından doğrulanmıştır. Uydurma bilgi eklenmez.
 * CRM, Emir AI ve motorlar bu dosyadan etkilenmez.
 */

export const SITE = {
  name: "Enes Yapı",
  legalName: "Enes Yapı",
  url: "https://izmirenesyapi.com.tr",
  phoneDisplay: "0530 764 17 17",
  phoneE164: "+905307641717",
  whatsapp: "https://wa.me/905307641717",
  street: "Manavkuyu Mah. Sakarya Cad.",
  district: "Bayraklı",
  city: "İzmir",
  country: "TR",
  openingHours: "Pazartesi – Cumartesi 09:00 – 19:00",
  openingHoursData: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "19:00",
  },
} as const;

export type ServiceDef = {
  slug: string;
  name: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  scope: string[];
  /** İlçe + hizmet sayfası açılan çekirdek hizmetler. */
  core?: boolean;
};

/** Yönetim panelindeki gerçek hizmet kalemleriyle birebir aynıdır. */
export const SERVICES: ServiceDef[] = [
  {
    slug: "komple-tadilat",
    name: "Komple tadilat",
    core: true,
    h1: "İzmir komple tadilat ve anahtar teslim yenileme",
    title: "İzmir Komple Tadilat | Anahtar Teslim Yenileme — Enes Yapı",
    description:
      "İzmir'de daire, ev ve iş yerlerinde komple tadilat: keşif, kalem kalem teklif, ekip organizasyonu ve teslim. Bayraklı merkezli Enes Yapı ile tek muhatap.",
    intro:
      "Komple tadilat, bir mekânın elektrik, tesisat, zemin, duvar, mutfak ve banyo işlerinin birlikte planlanmasıdır. İzmir'de bu işleri tek elden yürütüyor; keşif sonrası kapsamı ve maliyeti kalem kalem yazıp teslime kadar sahada takip ediyoruz.",
    scope: [
      "Yıkım, moloz alımı ve zemin hazırlığı",
      "Elektrik ve sıhhi tesisat yenileme",
      "Duvar, alçı, alçıpan ve asma tavan işleri",
      "Zemin, parke ve seramik uygulamaları",
      "Mutfak ve banyo yenileme",
      "Boya, badana ve son kat işleri",
    ],
  },
  {
    slug: "banyo-yenileme",
    name: "Banyo yenileme",
    core: true,
    h1: "İzmir banyo yenileme ve banyo tadilatı",
    title: "İzmir Banyo Tadilatı ve Yenileme — Enes Yapı",
    description:
      "İzmir'de banyo tadilatı: su yalıtımı, tesisat yenileme, seramik, duşakabin ve vitrifiye montajı. Keşifle net kapsam, kalem kalem teklif.",
    intro:
      "Banyo yenilemede işin ömrünü belirleyen iki kalem su yalıtımı ve tesisattır. Seramik öncesi yalıtımı yapmadan kaplama yapmıyoruz; ölçüleri keşifte alıp malzeme ve işçiliği ayrı ayrı fiyatlıyoruz.",
    scope: [
      "Mevcut seramik ve vitrifiye sökümü",
      "Su ve gider tesisatının yenilenmesi",
      "Su yalıtımı (sürme izolasyon)",
      "Duvar ve zemin seramiği uygulaması",
      "Vitrifiye, duşakabin ve batarya montajı",
      "Havalandırma ve aydınlatma düzenlemesi",
    ],
  },
  {
    slug: "mutfak-yenileme",
    name: "Mutfak yenileme",
    core: true,
    h1: "İzmir mutfak yenileme ve mutfak tadilatı",
    title: "İzmir Mutfak Tadilatı ve Yenileme — Enes Yapı",
    description:
      "İzmir'de mutfak yenileme: tezgah, dolap, tesisat, seramik ve elektrik düzenlemesi. Ölçü keşifte alınır, teklif kalem kalem verilir.",
    intro:
      "Mutfak yenilemesi dolap değişiminden fazlasıdır: tesisat noktaları, priz düzeni, davlumbaz bacası ve tezgah yüksekliği birlikte planlanmalıdır. Ölçüyü keşifte alıp uygulama sırasını buna göre kuruyoruz.",
    scope: [
      "Mevcut mutfak sökümü",
      "Su, gider ve elektrik noktalarının yeniden düzenlenmesi",
      "Tezgah arası ve zemin kaplaması",
      "Mutfak dolabı ve tezgah montajı",
      "Ankastre ve davlumbaz bağlantıları",
      "Boya ve son temizlik",
    ],
  },
  {
    slug: "boya-badana",
    name: "Boya ve badana",
    core: true,
    h1: "İzmir boya badana ve iç mekân boya işleri",
    title: "İzmir Boya Badana — Daire ve Ofis Boyama — Enes Yapı",
    description:
      "İzmir'de boya badana: alçı tamiri, astar, silikonlu iç cephe ve tavan boyası. Oda bazlı ölçü, kalem kalem teklif, temiz teslim.",
    intro:
      "Boya işinin sonucu yüzey hazırlığına bağlıdır. Çatlak ve alçı tamiri yapılmadan atılan boya kısa sürede iz verir; bu yüzden hazırlık, astar ve kat sayısını teklifte ayrı yazıyoruz.",
    scope: [
      "Çatlak, alçı ve macun tamiri",
      "Astar uygulaması",
      "İç cephe ve tavan boyası (kat sayısı belirtilir)",
      "Kapı, pervaz ve doğrama boyası",
      "Mobilya koruma ve iş sonu temizlik",
    ],
  },
  {
    slug: "isyeri-ofis-tadilati",
    name: "İş yeri / ofis tadilatı",
    h1: "İzmir ofis ve iş yeri tadilatı",
    title: "İzmir Ofis ve İş Yeri Tadilatı — Enes Yapı",
    description:
      "İzmir'de ofis, dükkan ve iş yeri tadilatı: bölme duvar, aydınlatma, zemin, boya ve vitrin düzenlemesi. Çalışma düzenini aksatmayan planlama.",
    intro:
      "İş yeri tadilatında en kritik konu takvimdir. İşin hangi bölümünün hangi gün yapılacağını keşifte planlıyor, gerekirse mesai dışı çalışarak faaliyetin durmasını engelliyoruz.",
    scope: [
      "Bölme duvar, alçıpan ve asma tavan",
      "Aydınlatma ve elektrik altyapısı",
      "Zemin kaplama (laminat, seramik, epoksi yönlendirmesi)",
      "Boya ve cephe/vitrin düzenlemesi",
      "Islak hacim yenileme",
    ],
  },
  {
    slug: "daire-yenileme",
    name: "Daire yenileme",
    h1: "İzmir daire yenileme",
    title: "İzmir Daire Yenileme ve Tadilat — Enes Yapı",
    description:
      "İzmir'de daire yenileme: oda bazlı kapsam, elektrik-tesisat kontrolü, zemin ve boya. Keşifle netleşen teklif, tek muhatap.",
    intro:
      "Daire yenilemesinde bütçeyi en çok etkileyen kalem, görünmeyen altyapıdır. Keşifte tesisat ve elektriğin durumunu kontrol edip hangi işin şart, hangisinin tercih olduğunu ayrı yazıyoruz.",
    scope: [
      "Oda bazlı kapsam belirleme",
      "Elektrik ve tesisat kontrolü, gerekli yenileme",
      "Zemin ve kapı-pervaz yenileme",
      "Islak hacim düzenlemesi",
      "Boya ve teslim temizliği",
    ],
  },
  {
    slug: "gayrimenkul-yenileme",
    name: "Satış / kira öncesi gayrimenkul yenileme",
    h1: "İzmir'de satış ve kira öncesi gayrimenkul yenileme",
    title: "İzmir Satış ve Kira Öncesi Yenileme — Enes Yapı",
    description:
      "İzmir'de satışa veya kiraya hazırlık amaçlı yenileme: bütçeyi değeri artıran kalemlere ayırma, hızlı teslim, önce/sonra kaydı.",
    intro:
      "Yatırım amaçlı yenilemede amaç her şeyi yenilemek değil, geri dönüşü yüksek kalemleri seçmektir. Keşifte hangi işin ilan değerine etki edeceğini, hangisinin ertelenebileceğini ayırıyoruz.",
    scope: [
      "Öncelikli kalem analizi (mutfak, banyo, boya, zemin)",
      "Hızlı takvimli uygulama",
      "Önce/sonra fotoğraf kaydı",
      "Teslim öncesi detay tamiri",
    ],
  },
  {
    slug: "mantolama-dis-cephe",
    name: "Mantolama ve dış cephe",
    h1: "İzmir mantolama ve dış cephe yenileme",
    title: "İzmir Mantolama ve Dış Cephe İşleri — Enes Yapı",
    description:
      "İzmir'de mantolama, dış cephe boyası ve cephe onarımı. Bina kabuğunda ısı yalıtımı ve su alma sorunlarına yönelik uygulama.",
    intro:
      "Dış cephe işleri hem ısı kaybını hem de su alma kaynaklı iç mekân nemini etkiler. Cephe durumunu yerinde inceleyip yalıtım kalınlığı, sıva ve son kat kararlarını birlikte veriyoruz.",
    scope: [
      "Cephe temizliği ve yüzey onarımı",
      "Isı yalıtım plakası uygulaması",
      "File, sıva ve son kat cephe boyası",
      "Denizlik, parapet ve derz detayları",
    ],
  },
  {
    slug: "cati-izolasyon",
    name: "Çatı ve izolasyon",
    h1: "İzmir çatı onarımı ve izolasyon",
    title: "İzmir Çatı Onarımı ve Su İzolasyonu — Enes Yapı",
    description:
      "İzmir'de çatı onarımı, kiremit ve dere değişimi, teras ve çatı su izolasyonu. Sızıntı kaynağını tespit ederek kalıcı çözüm.",
    intro:
      "Çatı işinde önce sızıntının kaynağı bulunmalıdır; yalnızca iç mekân tamiri yapılırsa sorun kısa sürede geri döner. Kaynağı tespit ettikten sonra onarım kapsamını yazılı olarak veriyoruz.",
    scope: [
      "Sızıntı kaynağı tespiti",
      "Kiremit, dere ve baca dibi onarımı",
      "Teras ve çatı su yalıtımı",
      "İç mekândaki nem hasarının tamiri",
    ],
  },
  {
    slug: "kentsel-donusum-danismanligi",
    name: "Kentsel dönüşüm danışmanlığı",
    h1: "İzmir kentsel dönüşüm danışmanlığı",
    title: "İzmir Kentsel Dönüşüm Danışmanlığı — Enes Yapı",
    description:
      "İzmir'de kentsel dönüşüm sürecinde yönlendirme: mevcut yapının durumu, yenileme mi dönüşüm mü kararı, uygulama planlaması.",
    intro:
      "Kentsel dönüşüm sürecinde en sık sorulan soru, binanın yenilenmesinin mi yoksa dönüşüme girmesinin mi daha doğru olduğudur. Bu kararın teknik tarafında yönlendirme yapıyor, yenileme tercih edilirse uygulamayı yürütüyoruz. Resmî başvuru, ruhsat ve hukuki işlemler ilgili kurum ve meslek gruplarının yetkisindedir.",
    scope: [
      "Mevcut yapının yerinde incelenmesi",
      "Yenileme / dönüşüm karşılaştırması",
      "Uygulama kapsamı ve takvim planı",
      "Yenileme kararında kalem kalem teklif",
    ],
  },
  {
    slug: "muteahhitlik",
    name: "Müteahhitlik ve komple inşaat",
    h1: "İzmir müteahhitlik ve komple inşaat işleri",
    title: "İzmir Müteahhitlik ve Komple İnşaat — Enes Yapı",
    description:
      "İzmir'de komple inşaat ve müteahhitlik işleri: kaba yapıdan ince işlere kadar planlama, ekip organizasyonu ve saha takibi.",
    intro:
      "Komple inşaat işlerinde iş kalemleri, takvim ve ekip organizasyonu baştan yazılır. Projeyi yerinde değerlendirip kapsamı ve aşamaları netleştiriyoruz; ruhsat ve proje işleri yetkili mimar/mühendis tarafından yürütülür.",
    scope: [
      "Yerinde değerlendirme ve kapsam belirleme",
      "İş kalemi ve takvim planı",
      "Ekip ve tedarik organizasyonu",
      "Kaba yapı ve ince iş aşamalarının saha takibi",
    ],
  },
  {
    slug: "elektrik-tesisat",
    name: "Elektrik ve sıhhi tesisat",
    h1: "İzmir elektrik ve sıhhi tesisat işleri",
    title: "İzmir Elektrik ve Sıhhi Tesisat İşleri — Enes Yapı",
    description:
      "İzmir'de elektrik tesisatı yenileme, priz-aydınlatma düzenlemesi, su ve gider tesisatı onarımı. Tadilat kapsamında veya ayrı iş olarak.",
    intro:
      "Eski binalarda kesit yetersizliği ve topraklama eksikliği sık görülür. Tesisatı yenilerken pano, hat ve nokta düzenini birlikte planlıyor, kapalı kalan yerleri kayıt altına alıyoruz.",
    scope: [
      "Pano, hat ve topraklama yenileme",
      "Priz, anahtar ve aydınlatma noktaları",
      "Su ve gider tesisatı onarımı",
      "Kaçak tespiti ve nemli bölge müdahalesi",
    ],
  },
  {
    slug: "zemin-parke-seramik",
    name: "Zemin, parke ve seramik",
    h1: "İzmir zemin, parke ve seramik uygulamaları",
    title: "İzmir Parke, Laminat ve Seramik Uygulaması — Enes Yapı",
    description:
      "İzmir'de laminat parke, lamine parke ve seramik uygulaması. Zemin tesviyesi, süpürgelik ve geçiş detaylarıyla birlikte.",
    intro:
      "Zemin işinde kaplamanın kalitesi kadar tesviye ve şap durumu belirleyicidir. Zemini ölçüp gerekli tesviye ve şilte kararını uygulamadan önce netleştiriyoruz.",
    scope: [
      "Mevcut zemin sökümü",
      "Tesviye ve şap kontrolü",
      "Laminat / lamine parke uygulaması",
      "Seramik ve granit uygulaması",
      "Süpürgelik ve geçiş profilleri",
    ],
  },
  {
    slug: "alcipan-asma-tavan",
    name: "Alçıpan ve asma tavan",
    h1: "İzmir alçıpan ve asma tavan uygulamaları",
    title: "İzmir Alçıpan ve Asma Tavan Uygulaması — Enes Yapı",
    description:
      "İzmir'de alçıpan bölme duvar, asma tavan, kartonpiyer ve gizli aydınlatma uygulamaları. Ölçülü, temiz ve boyaya hazır teslim.",
    intro:
      "Asma tavan ve alçıpan işlerinde aydınlatma yerleşimi ile taşıyıcı düzeni birlikte kurulmalıdır. Aydınlatma planını önce çıkarıp taşıyıcıyı ona göre yerleştiriyoruz.",
    scope: [
      "Alçıpan bölme duvar",
      "Asma tavan ve kartonpiyer",
      "Gizli aydınlatma nişleri",
      "Derz, macun ve boyaya hazır yüzey",
    ],
  },
  {
    slug: "kapi-pencere",
    name: "Kapı ve pencere işleri",
    h1: "İzmir kapı ve pencere değişimi",
    title: "İzmir Kapı ve Pencere Değişimi — Enes Yapı",
    description:
      "İzmir'de iç kapı, çelik kapı montajı ve PVC/alüminyum pencere değişimi. Ölçü, söküm, montaj ve çevre tamiri dahil.",
    intro:
      "Pencere değişiminde asıl fark, montaj sonrası çevre yalıtımı ve iç sıva tamiriyle ortaya çıkar. Ölçüyü keşifte alıp söküm, montaj ve tamir kalemlerini ayrı yazıyoruz.",
    scope: [
      "Yerinde ölçü ve söküm",
      "İç kapı ve çelik kapı montajı",
      "PVC / alüminyum doğrama montajı",
      "Denizlik, mermer ve çevre sıva tamiri",
    ],
  },
];

export const CORE_SERVICES = SERVICES.filter((s) => s.core);

export type DistrictDef = { slug: string; name: string; note: string };

/**
 * Yalnızca yöneticinin doğruladığı hizmet bölgeleri:
 * İzmir merkez ilçeleri + Urla, Çeşme, Seferihisar.
 */
export const DISTRICTS: DistrictDef[] = [
  { slug: "bayrakli", name: "Bayraklı", note: "Ofisimizin bulunduğu ilçe; Manavkuyu ve çevresinde aynı gün keşif planlanabilir." },
  { slug: "bornova", name: "Bornova", note: "Yoğun konut stoku ve öğrenci kiralamaları nedeniyle daire yenileme ve boya işleri öne çıkıyor." },
  { slug: "karsiyaka", name: "Karşıyaka", note: "Eski apartman stokunda tesisat ve ıslak hacim yenileme talepleri ağırlıkta." },
  { slug: "konak", name: "Konak", note: "Merkez konumdaki daire ve iş yerlerinde tadilat; dükkan/ofis düzenlemeleri sık." },
  { slug: "buca", name: "Buca", note: "Geniş konut alanlarında komple tadilat ve mutfak-banyo yenileme talepleri yaygın." },
  { slug: "balcova", name: "Balçova", note: "Site içi dairelerde yenileme ve ıslak hacim işleri; site kurallarına uygun çalışma takvimi." },
  { slug: "gaziemir", name: "Gaziemir", note: "Konut ve iş yeri tadilatı; ofis ve dükkan düzenlemeleri için uygun bölge." },
  { slug: "cigli", name: "Çiğli", note: "Toplu konut alanlarında daire yenileme, boya ve zemin işleri." },
  { slug: "karabaglar", name: "Karabağlar", note: "Karma konut stokunda komple tadilat ve tesisat yenileme talepleri." },
  { slug: "narlidere", name: "Narlıdere", note: "Site ve villa tipi yapılarda yenileme, dış cephe ve ıslak hacim işleri." },
  { slug: "guzelbahce", name: "Güzelbahçe", note: "Müstakil ve villa tipi yapılarda yenileme, çatı ve cephe işleri." },
  { slug: "urla", name: "Urla", note: "Müstakil ev ve villa yenilemeleri; çatı, cephe ve bahçe cephesi işleri öne çıkıyor." },
  { slug: "cesme", name: "Çeşme", note: "Yazlık ve villa yenilemeleri; sezon öncesi takvimli çalışma planlanır." },
  { slug: "seferihisar", name: "Seferihisar", note: "Müstakil ev ve yazlık yenilemeleri; nem ve cephe kaynaklı onarımlar." },
];

export type GuideDef = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  sections: Array<{ h2: string; body: string; bullets?: string[] }>;
};

/** İzmir odaklı, gerçek uygulama bilgisine dayanan rehber içerikleri. */
export const GUIDES: GuideDef[] = [
  {
    slug: "izmirde-tadilat-sureci",
    title: "İzmir'de Tadilat Süreci: Keşiften Teslime — Enes Yapı",
    h1: "İzmir'de tadilat süreci: keşiften teslime",
    description:
      "İzmir'de bir tadilat işi hangi adımlardan geçer? Keşif, kapsam, teklif, uygulama sırası ve teslim kontrolü hakkında uygulamaya dayalı rehber.",
    intro:
      "Tadilatta yaşanan sorunların büyük kısmı, işin başında kapsamın yazılı hale getirilmemesinden kaynaklanır. Aşağıda İzmir'de yürüttüğümüz işlerde izlediğimiz sırayı ve her adımda nelerin netleşmesi gerektiğini anlattık.",
    sections: [
      {
        h2: "1. Keşif: ölçü ve mevcut durum",
        body: "Keşifte mekân ölçülür, elektrik ve tesisatın durumu kontrol edilir, hangi işin zorunlu hangisinin tercih olduğu ayrılır. Fotoğraf ve ölçü kaydı çıkarılmadan verilen fiyatlar uygulama sırasında değişir.",
      },
      {
        h2: "2. Kapsam: ne yapılacak, ne yapılmayacak",
        body: "Kapsam listesi işin sınırını belirler. Sonradan eklenen işler ayrı kalem olarak yazılır; böylece bütçe kontrolü kaybolmaz.",
      },
      {
        h2: "3. Teklif: malzeme ve işçilik ayrı",
        body: "Teklifte her iş kalemi miktar, birim, malzeme ve işçilik olarak ayrı görünmelidir. Toplam tek satırda verilen teklifler karşılaştırılamaz.",
      },
      {
        h2: "4. Uygulama sırası",
        body: "Doğru sıra hem süreyi hem maliyeti düşürür: yıkım, tesisat-elektrik, sıva ve alçı, ıslak hacim yalıtımı, kaplamalar, mobilya montajı, boya, temizlik.",
        bullets: [
          "Yıkım ve moloz alımı",
          "Tesisat ve elektrik altyapısı",
          "Alçı, alçıpan ve asma tavan",
          "Islak hacim yalıtımı ve seramik",
          "Zemin kaplamaları",
          "Mutfak ve dolap montajı",
          "Boya ve teslim temizliği",
        ],
      },
      {
        h2: "5. Teslim kontrolü",
        body: "Teslimde su-elektrik kontrolü, kapı-pencere ayarı, silikon ve derz detayları, boya iz kontrolü yapılır. Önce/sonra kaydı işin belgesi olarak saklanır.",
      },
    ],
  },
  {
    slug: "izmirde-banyo-tadilati-nelere-dikkat",
    title: "İzmir'de Banyo Tadilatında Nelere Dikkat Edilir? — Enes Yapı",
    h1: "İzmir'de banyo tadilatında dikkat edilecekler",
    description:
      "Banyo tadilatında su yalıtımı, tesisat, havalandırma ve seramik kararları. İzmir'deki apartman dairelerinde sık görülen sorunlar ve çözümleri.",
    intro:
      "Banyo, evin en çok sorun çıkaran bölümüdür; çünkü su, tesisat ve kaplama aynı yerde buluşur. İzmir'deki eski apartman stokunda en sık karşılaştığımız konuları sıraladık.",
    sections: [
      {
        h2: "Su yalıtımı ihmal edilmemeli",
        body: "Seramik su geçirmez değildir; suyu tutan katman altındaki yalıtımdır. Yalıtım yapılmadan kaplanan banyolarda alt komşuya sızıntı birkaç yıl içinde ortaya çıkar.",
      },
      {
        h2: "Tesisat yaşını kontrol edin",
        body: "Eski galvaniz hatlar daralır ve su basıncını düşürür. Banyo açıldığında hattın yenilenmesi, sonradan kırım yapmaktan daha ucuzdur.",
      },
      {
        h2: "Havalandırma ve nem",
        body: "Penceresiz banyolarda aspiratör bacasının çalıştığı doğrulanmalıdır. Nem tahliye edilmezse boya ve derzler kısa sürede bozulur.",
      },
      {
        h2: "Seramik ve derz seçimi",
        body: "Zeminde kaymaz sınıf, duvarda ölçüye uygun ebat seçilir. Derz rengi ve tipi temizlik kolaylığını doğrudan etkiler.",
      },
    ],
  },
  {
    slug: "izmirde-kentsel-donusum-ve-yapi-yenileme",
    title: "İzmir'de Kentsel Dönüşüm mü Yapı Yenileme mi? — Enes Yapı",
    h1: "İzmir'de kentsel dönüşüm mü, yapı yenileme mi?",
    description:
      "İzmir'de binanız için yenileme ile kentsel dönüşüm arasındaki teknik farklar, hangi durumda hangisinin değerlendirildiği ve süreçte kimin yetkili olduğu.",
    intro:
      "Bu karar tek başına maliyet sorusu değildir; yapının mevcut durumu, kullanım ihtiyacı ve resmî süreç birlikte değerlendirilir. Teknik tarafta yönlendirme yapıyoruz; resmî başvuru, rapor ve ruhsat işlemleri yetkili kurum ve meslek gruplarının sorumluluğundadır.",
    sections: [
      {
        h2: "Yenileme hangi durumda konuşulur?",
        body: "Taşıyıcı sistemde sorun bildirilmemiş, iç mekân ve altyapı yaşlanmış yapılarda yenileme genellikle daha hızlı ve öngörülebilir bir yoldur.",
      },
      {
        h2: "Dönüşüm hangi durumda gündeme gelir?",
        body: "Yapının teknik durumu yetkili raporla sorunlu bulunduğunda ya da kat/alan kazancı hedeflendiğinde dönüşüm değerlendirilir. Bu tespit mühendislik raporuyla yapılır.",
      },
      {
        h2: "Süreçte kim ne yapar?",
        body: "Teknik inceleme ve rapor yetkili mühendis, proje ve ruhsat mimar/ilgili belediye, uygulama ise yapı firması tarafından yürütülür. Enes Yapı uygulama ve yenileme tarafında çalışır.",
      },
      {
        h2: "Karar öncesi netleşmesi gerekenler",
        body: "Kullanım süresi beklentisi, bütçe, taşınma planı ve hangi işlerin şart olduğu netleşmeden karar vermek maliyeti artırır.",
        bullets: [
          "Yapının yaşı ve mevcut durumu",
          "Kullanım/kiralama/satış planı",
          "Bütçe ve takvim sınırları",
          "Yetkili rapor bulunup bulunmadığı",
        ],
      },
    ],
  },
  {
    slug: "izmirde-tadilat-fiyatlarini-etkileyen-kalemler",
    title: "İzmir'de Tadilat Fiyatını Etkileyen Kalemler — Enes Yapı",
    h1: "İzmir'de tadilat fiyatını etkileyen kalemler",
    description:
      "Tadilat maliyetini belirleyen gerçek kalemler: kapsam, mevcut altyapı, malzeme sınıfı, kat/asansör durumu ve takvim. Fiyat ancak keşifle netleşir.",
    intro:
      "Aynı metrekaredeki iki daire çok farklı maliyet çıkarabilir. Sebep, işin kapsamı ve görünmeyen altyapıdır. Aşağıdaki kalemler keşifte netleşir; bu yüzden yerinde görmeden fiyat vermiyoruz.",
    sections: [
      {
        h2: "Kapsam",
        body: "Yalnızca boya ile komple yenileme arasındaki fark, işçilik gün sayısını ve malzeme kalemini tümüyle değiştirir.",
      },
      {
        h2: "Mevcut altyapı",
        body: "Tesisat ve elektrik yenilenecekse kırım, tamir ve sıva kalemleri devreye girer. Bu kalem çoğu bütçe sapmasının kaynağıdır.",
      },
      {
        h2: "Malzeme sınıfı",
        body: "Seramik, parke, vitrifiye ve boya sınıfı aynı işte geniş bir fiyat aralığı oluşturur. Teklifte malzeme ayrı yazıldığında karşılaştırma yapılabilir.",
      },
      {
        h2: "Bina ve erişim koşulları",
        body: "Kat, asansör durumu, moloz tahliye mesafesi ve otopark imkânı işçilik süresini etkiler.",
      },
      {
        h2: "Takvim",
        body: "Sıkı teslim tarihi, ekiplerin paralel çalışmasını gerektirir ve maliyeti yükseltebilir.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const districtBySlug = (slug: string) => DISTRICTS.find((d) => d.slug === slug);

export const canonical = (path: string) => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Sayfa başına ortak head üretimi (title, description, og, canonical). */
export function pageHead(input: {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
}) {
  const url = canonical(input.path);
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:type", content: input.type ?? "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export const localBusinessJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${SITE.url}/#business`,
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phoneE164,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.street,
    addressLocality: SITE.district,
    addressRegion: SITE.city,
    addressCountry: SITE.country,
  },
  areaServed: DISTRICTS.map((d) => ({ "@type": "AdministrativeArea", name: `${d.name}, İzmir` })),
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SITE.openingHoursData.days,
      opens: SITE.openingHoursData.opens,
      closes: SITE.openingHoursData.closes,
    },
  ],
  makesOffer: SERVICES.map((s) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name: s.name, areaServed: "İzmir" },
  })),
});

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: canonical(item.path),
  })),
});

export const serviceJsonLd = (input: { name: string; description: string; path: string; area?: string }) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: input.name,
  description: input.description,
  serviceType: input.name,
  url: canonical(input.path),
  areaServed: { "@type": "AdministrativeArea", name: input.area ?? "İzmir" },
  provider: { "@type": "HomeAndConstructionBusiness", name: SITE.name, telephone: SITE.phoneE164, url: SITE.url },
});

/* ------------------------------------------------------------------ */
/* İzmir odaklı anahtar kelime kümeleri                                */
/* Yalnızca gerçekten sunulan hizmetler ve doğrulanmış bölgeler.       */
/* ------------------------------------------------------------------ */

/** Ana sayfanın hedeflediği İzmir kümesi. */
export const HOME_KEYWORDS = [
  "İzmir tadilat",
  "İzmir yapı",
  "İzmir inşaat",
  "İzmir dekorasyon",
  "İzmir müteahhit",
  "İzmir kentsel dönüşüm",
  "İzmir yapı hizmetleri",
  "İzmir inşaat firması",
] as const;

const lower = (v: string) => v.toLocaleLowerCase("tr-TR");

/** Hizmet sayfası anahtar kelimeleri: İzmir + hizmet (+ ihtiyaç). */
export function serviceKeywords(service: ServiceDef): string[] {
  const n = lower(service.name);
  return [`İzmir ${n}`, `${n} İzmir`, `İzmir ${n} firması`, `İzmir ${n} fiyatları`];
}

/** İlçe sayfası anahtar kelimeleri: ilçe + hizmet. */
export function districtKeywords(district: DistrictDef): string[] {
  return [
    `${district.name} tadilat`,
    `${district.name} tadilat firması`,
    ...CORE_SERVICES.map((s) => `${district.name} ${lower(s.name)}`),
  ];
}

/** İlçe + hizmet sayfası anahtar kelimeleri. */
export function districtServiceKeywords(district: DistrictDef, service: ServiceDef): string[] {
  const n = lower(service.name);
  return [`${district.name} ${n}`, `İzmir ${district.name} ${n}`, `${district.name} ${n} fiyatları`];
}

/** Denetim panelinin kullandığı yol → hedef anahtar kelime eşlemesi. */
export function keywordsForPath(path: string): string[] {
  const clean = path.replace(/\/+$/, "") || "/";
  if (clean === "/") return [...HOME_KEYWORDS];
  const parts = clean.split("/").filter(Boolean);
  if (parts[0] === "hizmetler") {
    const service = parts[1] ? serviceBySlug(parts[1]) : undefined;
    return service ? serviceKeywords(service) : ["İzmir tadilat", "İzmir yapı hizmetleri"];
  }
  if (parts[0] === "bolgeler") {
    const district = parts[1] ? districtBySlug(parts[1]) : undefined;
    if (!district) return ["İzmir tadilat", "İzmir hizmet bölgeleri"];
    const service = parts[2] ? serviceBySlug(parts[2]) : undefined;
    return service ? districtServiceKeywords(district, service) : districtKeywords(district);
  }
  if (parts[0] === "rehber") return ["İzmir tadilat", "İzmir yapı yenileme"];
  if (parts[0] === "iletisim") return ["İzmir tadilat firması", "İzmir yapı firması iletişim"];
  return ["İzmir tadilat"];
}

/**
 * İlçe sayfaları için lokal işletme (LocalBusiness) verisi.
 * Bilgiler gerçek işletme kaydından gelir; hizmet alanı yalnızca doğrulanmış ilçedir.
 */
export const districtBusinessJsonLd = (district: DistrictDef) => ({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${SITE.url}/bolgeler/${district.slug}#business`,
  name: `${SITE.name} — ${district.name} tadilat ve yenileme`,
  url: canonical(`/bolgeler/${district.slug}`),
  telephone: SITE.phoneE164,
  parentOrganization: { "@type": "Organization", name: SITE.name, url: SITE.url },
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.street,
    addressLocality: SITE.district,
    addressRegion: SITE.city,
    addressCountry: SITE.country,
  },
  areaServed: { "@type": "AdministrativeArea", name: `${district.name}, ${SITE.city}` },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SITE.openingHoursData.days,
      opens: SITE.openingHoursData.opens,
      closes: SITE.openingHoursData.closes,
    },
  ],
  makesOffer: CORE_SERVICES.map((s) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: `${district.name} ${s.name.toLocaleLowerCase("tr-TR")}`,
      areaServed: { "@type": "AdministrativeArea", name: `${district.name}, ${SITE.city}` },
    },
  })),
});
