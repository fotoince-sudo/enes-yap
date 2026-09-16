import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { RequestForm } from "@/components/site/RequestForm";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUS } from "@/lib/domain";
import heroImage from "@/assets/hero.jpg";
import beforeImage from "@/assets/proje-tadilat.jpg";
import afterImage from "@/assets/proje-daire.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Enes Yapı — Tadilat, Yenileme ve Uygulama Çözümleri" },
      {
        name: "description",
        content:
          "Konut, iş yeri ve gayrimenkuller için tadilat, yenileme, bakım ve onarım çözümleri. Keşif, teklif, ekip organizasyonu ve iş takibi tek elden.",
      },
      { property: "og:title", content: "Enes Yapı — Tadilat, Yenileme ve Uygulama Çözümleri" },
      {
        property: "og:description",
        content: "Gayrimenkulünüz için tadilat ve yenileme çözümleri. Talebinizi oluşturun, keşif planlayalım.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STEPS = [
  { n: "01", t: "Talep oluşturun", d: "Gayrimenkulünüzü, yapılacak işi, bütçe ve zaman beklentinizi iletin." },
  { n: "02", t: "Keşif", d: "Sorumlu personel yerinde ölçü alır, işin kapsamını ve maliyetini belirler." },
  { n: "03", t: "Teklif", d: "Malzeme, işçilik ve ek giderler kalem kalem yazılır; net fiyat sunulur." },
  { n: "04", t: "Uygulama", d: "İş kalemlerine göre ekipler görevlendirilir, süreç sahada kontrol edilir." },
  { n: "05", t: "Teslim", d: "Kontrol listesi tamamlanır, önce/sonra kaydı ile iş teslim edilir." },
];

const WHY = [
  { t: "Tek muhatap", d: "Farklı ustalarla tek tek uğraşmazsınız; işi baştan sona biz organize ederiz." },
  { t: "Şeffaf teklif", d: "Her iş kalemi miktar, birim fiyat, malzeme ve işçilik olarak ayrı yazılır." },
  { t: "Kayıtlı süreç", d: "Talep, keşif, teklif ve uygulama adımlarının tamamı sistemde kayıt altındadır." },
  { t: "Gayrimenkul odaklı", d: "Satışa veya kiraya hazırlık gibi yatırım amaçlı yenilemelerde deneyimliyiz." },
];

function HomePage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name, description")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, start_date, actual_end_date")
        .eq("is_public_reference", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-semibold tracking-tight">
            ENES <span className="text-primary">YAPI</span>
          </span>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#hizmetler" className="text-muted-foreground hover:text-foreground">
              Hizmetler
            </a>
            <a href="#nasil" className="text-muted-foreground hover:text-foreground">
              Nasıl çalışıyoruz?
            </a>
            <a href="#projeler" className="text-muted-foreground hover:text-foreground">
              Projeler
            </a>
            <a href="#iletisim" className="text-muted-foreground hover:text-foreground">
              İletişim
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <a href="#talep">Talep oluştur</a>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/auth">Personel</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:py-20">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-primary">Tadilat · Yenileme · Uygulama</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Gayrimenkulünüz için tadilat ve yenileme çözümleri.
              </h1>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Daire, ev, ofis ve iş yerlerinde tadilat, bakım, onarım ve komple yenileme işlerini planlıyor, ekipleri
                organize ediyor ve işi teslim edene kadar takip ediyoruz.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <a href="#talep">Tadilat talebi oluştur</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#nasil">Süreci inceleyin</a>
                </Button>
              </div>
            </div>
            <img
              src={heroImage}
              alt="Tadilat uygulaması yapılan bir iç mekân"
              className="h-64 w-full rounded-lg border object-cover md:h-80"
              loading="lazy"
            />
          </div>
        </section>

        {/* Hizmetler */}
        <section id="hizmetler" className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hizmetler</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tek bir işten komple yenilemeye kadar tüm kapsamlarda çalışıyoruz.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4">
                <h3 className="font-medium">{c.name}</h3>
                {c.description ? <p className="mt-1 text-sm text-muted-foreground">{c.description}</p> : null}
              </div>
            ))}
          </div>
        </section>

        {/* Nasıl çalışıyoruz */}
        <section id="nasil" className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nasıl çalışıyoruz?</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-lg border bg-card p-4">
                  <span className="text-xs font-semibold text-primary">{s.n}</span>
                  <h3 className="mt-1 font-medium">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talep formu */}
        <section id="talep" className="mx-auto max-w-4xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tadilat talebi oluştur</h2>
          <p className="mt-2 text-muted-foreground">
            Formu doldurun; talebiniz kayıt altına alınır, ekibimiz keşif için sizinle iletişime geçer.
          </p>
          <div className="mt-6">
            <RequestForm />
          </div>
        </section>

        {/* Önce / Sonra */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Önce / Sonra</h2>
            <p className="mt-2 text-muted-foreground">
              Tamamlanan işlerin önce, uygulama sırası ve sonra kayıtlarını tutuyoruz.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <figure>
                <img src={beforeImage} alt="Tadilat öncesi mekân" className="h-56 w-full rounded-lg border object-cover" loading="lazy" />
                <figcaption className="mt-2 text-sm text-muted-foreground">Önce</figcaption>
              </figure>
              <figure>
                <img src={afterImage} alt="Tadilat sonrası yenilenen mekân" className="h-56 w-full rounded-lg border object-cover" loading="lazy" />
                <figcaption className="mt-2 text-sm text-muted-foreground">Sonra</figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Projeler */}
        <section id="projeler" className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tamamlanan projeler</h2>
          {projects.length === 0 ? (
            <p className="mt-2 text-muted-foreground">
              Referans projeler yönetim panelinde işaretlendikçe bu bölümde listelenir.
            </p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded-lg border bg-card p-4">
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Çözüm ortakları */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Çözüm ortaklarımız</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Sıhhi tesisat, elektrik, seramik, boya, alçıpan, mobilya ve dış cephe alanlarında kayıtlı ekiplerle
              çalışıyoruz. Her iş, kapsamına uygun uzman ekiple eşleştirilir.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Sıhhi tesisat", "Elektrik", "Seramik & zemin", "Boya & alçı", "Alçıpan & asma tavan", "Mutfak & banyo", "Mantolama & dış cephe", "Çatı & izolasyon"].map(
                (t) => (
                  <div key={t} className="rounded-lg border bg-card px-4 py-3 text-sm">
                    {t}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Neden */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Neden Enes Yapı?</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.t} className="rounded-lg border bg-card p-4">
                <h3 className="font-medium">{w.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{w.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* İletişim */}
        <section id="iletisim" className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">İletişim</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Telefon & WhatsApp</h3>
                <a href="tel:+905333992540" className="mt-1 block font-medium hover:text-primary">
                  0533 399 25 40
                </a>
                <a
                  href="https://wa.me/905333992540"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
                >
                  WhatsApp'tan yazın
                </a>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Adres</h3>
                <p className="mt-1 font-medium">Manavkuyu Mah. Sakarya Cad.</p>
                <p className="mt-1 text-sm text-muted-foreground">Bayraklı / İzmir</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Hızlı talep</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Formu doldurun, ekibimiz en kısa sürede sizi arasın.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <a href="#talep">Tadilat talebi oluştur</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Enes Yapı · Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir · 0533 399 25 40</span>
          <Link to="/auth" className="hover:text-foreground">
            Personel girişi
          </Link>
        </div>
      </footer>
    </div>
  );
}
