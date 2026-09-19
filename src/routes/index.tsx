import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { EnesEmlakReferral } from "@/components/site/SiteShell";
import { RequestForm } from "@/components/site/RequestForm";
import { ChatBubble } from "@/components/site/ChatBubble";
import { Button } from "@/components/ui/button";
import { trDate } from "@/lib/domain";
import { CORE_SERVICES, DISTRICTS, GUIDES, localBusinessJsonLd, pageHead, SERVICES, SITE } from "@/lib/seo";
import heroImage from "@/assets/hero.jpg";
import logoAsset from "@/assets/enes-yapi-logo.png.asset.json";
import beforeImage from "@/assets/proje-tadilat.jpg";
import afterImage from "@/assets/proje-daire.jpg";

const HOME_TITLE = "İzmir Tadilat, Yenileme ve Dekorasyon — Enes Yapı";
const HOME_DESCRIPTION =
  "İzmir'de komple tadilat, banyo ve mutfak yenileme, boya, dış cephe ve ofis tadilatı. Bayraklı merkezli Enes Yapı ile yerinde keşif ve kalem kalem teklif.";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => {
    const base = pageHead({ path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION });
    return {
      ...base,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusinessJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            inLanguage: "tr-TR",
          }),
        },
      ],
    };
  },
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
        .rpc("get_public_project_showcase");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: beforeAfter = [] } = useQuery({
    queryKey: ["public-before-after"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("before_after")
        .select("id, title, work_type, description, before_url, after_url, happened_on")
        .eq("is_published", true)
        .order("sort_order")
        .limit(6);
      if (error) throw error;
      // Yalnızca herkese açık (http) görsel bağlantıları sitede gösterilebilir.
      return (data ?? []).filter((r) => r.before_url?.startsWith("http") && r.after_url?.startsWith("http"));
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="Enes Yapı logosu" className="h-9 w-9 object-contain" />
            <span className="text-lg font-semibold tracking-tight">
              ENES <span className="text-primary">YAPI</span>
            </span>
          </span>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link to="/hizmetler" className="text-muted-foreground hover:text-foreground">
              Hizmetler
            </Link>
            <Link to="/bolgeler" className="text-muted-foreground hover:text-foreground">
              Hizmet bölgeleri
            </Link>
            <Link to="/rehber" className="text-muted-foreground hover:text-foreground">
              Rehber
            </Link>
            <Link to="/iletisim" className="text-muted-foreground hover:text-foreground">
              İletişim
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <a href="#talep">Talep oluştur</a>
            </Button>
            <Button size="sm" variant="ghost" asChild aria-label="Hesabım">
              <Link to="/hesabim" className="gap-1.5">
                <UserRound className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Hesabım</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:py-12 md:grid-cols-2 md:items-center md:gap-8 md:py-20">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary sm:text-sm">
                İzmir · Tadilat · Yenileme · Uygulama
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:mt-3 sm:text-3xl md:text-5xl">
                İzmir'de tadilat, yenileme ve dekorasyon çözümleri.
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                Bayraklı merkezli ekibimizle İzmir'de daire, ev, ofis ve iş yerlerinde tadilat, bakım, onarım ve komple
                yenileme işlerini planlıyor, ekipleri organize ediyor ve işi teslim edene kadar takip ediyoruz.
              </p>
              <div className="mt-4 border-l-4 border-primary pl-4 sm:mt-6 sm:pl-5">
                <p className="text-lg font-bold uppercase leading-tight tracking-tight sm:text-2xl">
                  &ldquo;BİZDE HER ŞEY GERÇEK.&rdquo;
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Hayal değil, gerçek iş.</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
                <Button size="lg" asChild>
                  <a href="#talep">Tadilat talebi oluştur</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="https://wa.me/905307641717" target="_blank" rel="noopener noreferrer">
                    WhatsApp'tan yazın
                  </a>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <a href="#nasil">Süreci inceleyin</a>
                </Button>
              </div>
            </div>
            <img
              src={heroImage}
              alt="Tadilat uygulaması yapılan bir iç mekân"
              className="h-48 w-full rounded-lg border object-cover sm:h-64 md:h-80"
              loading="lazy"
            />
          </div>
        </section>

        {/* Hizmetler */}
        <section id="hizmetler" className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">İzmir'de sunduğumuz hizmetler</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tek bir işten komple yenilemeye kadar tüm kapsamlarda çalışıyoruz. Detay için hizmet sayfalarına
            bakabilirsiniz.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            İzmir tadilat, yapı ve inşaat işlerinde daire, villa, ofis ve dükkanlarda çalışıyoruz; dekorasyon ve
            iç mekân yenileme, müteahhitlik ve komple inşaat ile kentsel dönüşüm danışmanlığı da hizmet
            kapsamımızdadır. Her işte ölçü keşifte alınır, teklif kalem kalem verilir.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.slug}
                to="/hizmetler/$slug"
                params={{ slug: s.slug }}
                className="rounded-lg border bg-card p-4 transition-colors hover:border-primary"
              >
                <h3 className="font-medium">{s.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </Link>
            ))}
          </div>
          {categories.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  {c.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/hizmetler">Tüm hizmetleri görün</Link>
            </Button>
          </div>
        </section>

        <EnesEmlakReferral />

        {/* Hizmet bölgeleri */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">İzmir hizmet bölgelerimiz</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              İzmir merkez ilçelerinin tamamında, ayrıca Urla, Çeşme ve Seferihisar'da çalışıyoruz.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {DISTRICTS.map((d) => (
                <Link
                  key={d.slug}
                  to="/bolgeler/$ilce"
                  params={{ ilce: d.slug }}
                  className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
                >
                  {d.name} tadilat
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CORE_SERVICES.map((s) => (
                <Link
                  key={s.slug}
                  to="/bolgeler/$ilce/$hizmet"
                  params={{ ilce: "bayrakli", hizmet: s.slug }}
                  className="rounded-lg border bg-card p-3 text-sm hover:border-primary"
                >
                  Bayraklı {s.name.toLocaleLowerCase("tr-TR")}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Rehber */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">İzmir tadilat rehberi</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                to="/rehber/$slug"
                params={{ slug: g.slug }}
                className="rounded-lg border bg-card p-4 transition-colors hover:border-primary"
              >
                <h3 className="font-medium">{g.h1}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </Link>
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
            {beforeAfter.length > 0 ? (
              <div className="mt-6 space-y-8">
                {beforeAfter.map((r) => (
                  <div key={r.id}>
                    <h3 className="font-medium">
                      {r.title ?? r.work_type ?? "Tadilat çalışması"}
                      {r.happened_on ? (
                        <span className="text-muted-foreground"> · {trDate(r.happened_on)}</span>
                      ) : null}
                    </h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <figure>
                        <img src={r.before_url!} alt={`${r.title ?? "Tadilat"} öncesi`} className="h-56 w-full rounded-lg border object-cover" loading="lazy" />
                        <figcaption className="mt-2 text-sm text-muted-foreground">Önce</figcaption>
                      </figure>
                      <figure>
                        <img src={r.after_url!} alt={`${r.title ?? "Tadilat"} sonrası`} className="h-56 w-full rounded-lg border object-cover" loading="lazy" />
                        <figcaption className="mt-2 text-sm text-muted-foreground">Sonra</figcaption>
                      </figure>
                    </div>
                    {r.description ? <p className="mt-2 text-sm text-muted-foreground">{r.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
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
            )}
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
                <div key={p.id} className="overflow-hidden rounded-lg border bg-card">
                  {p.photo_urls?.[0] ? (
                    <img
                      src={p.photo_urls[0]}
                      alt={`${p.title} proje fotoğrafı`}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="p-4">
                    <h3 className="font-medium">{p.title}</h3>
                    {p.district ? <p className="mt-1 text-sm text-muted-foreground">{p.district} / İzmir</p> : null}
                  </div>
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
                <a href="tel:+905307641717" className="mt-1 block font-medium hover:text-primary">
                  0530 764 17 17
                </a>
                <a
                  href="https://wa.me/905307641717"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
                >
                  WhatsApp'tan yazın
                </a>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Adres & çalışma saatleri</h3>
                <p className="mt-1 font-medium">Manavkuyu Mah. Sakarya Cad.</p>
                <p className="mt-1 text-sm text-muted-foreground">Bayraklı / İzmir</p>
                <p className="mt-1 text-sm text-muted-foreground">Pazartesi – Cumartesi 09:00 – 19:00</p>
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
          <span className="flex items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-6 w-6 object-contain" />
            <span>{"© 2026 Enes Yapı · Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir · 0530 764 17 17"}</span>
          </span>
          <Link to="/auth" className="hover:text-foreground">
            Müşteri / personel girişi
          </Link>
        </div>
      </footer>

      <ChatBubble />
    </div>
  );
}
