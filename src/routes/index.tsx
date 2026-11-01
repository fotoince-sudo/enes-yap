import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bath,
  ChefHat,
  Hammer,
  House,
  MapPin,
  PaintRoller,
  PlugZap,
  UserRound,
} from "lucide-react";

import { RequestForm } from "@/components/site/RequestForm";
import { EnesEmlakReferral, SiteHeader } from "@/components/site/SiteShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { localBusinessJsonLd, pageHead, SERVICES, SITE, DISTRICTS } from "@/lib/seo";
import heroImage from "@/assets/hero.jpg";
import logoAsset from "@/assets/enes-yapi-logo.png.asset.json";

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

const FEATURED_SERVICE_SLUGS = [
  "komple-tadilat",
  "banyo-yenileme",
  "mutfak-yenileme",
  "boya-badana",
  "elektrik-tesisat",
  "daire-yenileme",
] as const;

const SERVICE_ICONS = {
  "komple-tadilat": Hammer,
  "banyo-yenileme": Bath,
  "mutfak-yenileme": ChefHat,
  "boya-badana": PaintRoller,
  "elektrik-tesisat": PlugZap,
  "daire-yenileme": House,
} as const;

const SERVICE_SUMMARIES = {
  "komple-tadilat": "Tüm iş kalemlerini tek plan ve tek ekip yönetimiyle yürütüyoruz.",
  "banyo-yenileme": "Tesisat, yalıtım, seramik ve montaj işlerini birlikte planlıyoruz.",
  "mutfak-yenileme": "Dolap, tezgâh, tesisat ve elektrik düzenini yeniliyoruz.",
  "boya-badana": "Yüzey hazırlığından son kata kadar temiz uygulama yapıyoruz.",
  "elektrik-tesisat": "Elektrik, su ve gider hatlarını ihtiyaca göre düzenliyoruz.",
  "daire-yenileme": "Dairenizi kullanım ihtiyacınıza göre bütüncül biçimde yeniliyoruz.",
} as const;

const STEPS = [
  { n: "01", t: "Talep oluşturma", d: "İhtiyacınızı ve iletişim bilgilerinizi bize iletin." },
  { n: "02", t: "Keşif ve ölçüm", d: "Alanı yerinde inceleyip gerekli ölçüleri alalım." },
  { n: "03", t: "Teklif hazırlama", d: "İş kapsamını ve kalemleri açık biçimde paylaşalım." },
  { n: "04", t: "Uygulama", d: "Planlanan işleri saha kontrolüyle tamamlayalım." },
  { n: "05", t: "Kontrol ve teslim", d: "Son kontrollerin ardından işi teslim edelim." },
];

const FAQS = [
  {
    q: "Tadilat fiyatı nasıl belirlenir?",
    a: "Fiyat; alanın durumu, iş kapsamı, ölçüler ve malzeme tercihleri yerinde değerlendirildikten sonra belirlenir.",
  },
  {
    q: "Keşif süreci nasıl ilerler?",
    a: "Talebinizi aldıktan sonra sizinle iletişime geçer, uygun zamanı birlikte planlar ve alanı yerinde inceleriz.",
  },
  {
    q: "Hangi bölgelerde hizmet veriyorsunuz?",
    a: "İzmir merkez ilçeleri ile Urla, Çeşme ve Seferihisar'da hizmet veriyoruz.",
  },
];

function HomePage() {
  const featuredServices = FEATURED_SERVICE_SLUGS.map((slug) => SERVICES.find((service) => service.slug === slug)).filter(
    (service): service is NonNullable<typeof service> => Boolean(service),
  );

  // Proje vitrini ve önce/sonra kayıtları ileride ortak CRM'den gelecek; şimdilik gösterilmiyor.
  const projects: { photo_urls?: string[] | null; [key: string]: any }[] = [];
  const beforeAfter: { id: string; title: string; work_type: string | null; before_url: string; after_url: string }[] = [];

  const hasRealApplications = beforeAfter.length > 0 || projects.some((project) => project.photo_urls?.[0]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        cta={
          <Button size="sm" asChild>
            <a href="#talep">Talep oluştur</a>
          </Button>
        }
      />

      <main>
        <section className="border-b bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:py-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-10 md:py-16">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">BİZDE HER ŞEY GERÇEK.</p>
              <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                İzmir’de tadilat, yenileme ve dekorasyon.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Keşiften uygulamaya, tadilat sürecinizi birlikte yönetiyoruz.
              </p>
              <p className="mt-4 border-l-4 border-primary pl-3 text-sm font-semibold sm:text-base">Hayal değil, gerçek iş.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                <Button size="lg" asChild><a href="#talep">Talep oluştur</a></Button>
                <Button size="lg" variant="outline" asChild><a href="#hizmetler">Hizmetlerimiz</a></Button>
              </div>
            </div>
            <img
              src={heroImage}
              alt="Tadilat uygulaması yapılan aydınlık bir iç mekân"
              className="aspect-[16/10] w-full rounded-lg border object-cover md:aspect-[4/3]"
            />
          </div>
        </section>

        <section id="hizmetler" className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Uzmanlık alanlarımız</p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Hizmetlerimiz</h2>
            </div>
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/hizmetler">Tüm hizmetler <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => {
              const Icon = SERVICE_ICONS[service.slug as keyof typeof SERVICE_ICONS];
              return (
                <Link
                  key={service.slug}
                  to="/hizmetler/$slug"
                  params={{ slug: service.slug }}
                  className="group grid min-h-40 grid-rows-[auto_1fr_auto] rounded-lg border bg-card p-4 transition-colors hover:border-primary sm:p-5"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary">
                    {Icon ? <Icon aria-hidden="true" /> : <Hammer aria-hidden="true" />}
                  </span>
                  <div className="mt-4">
                    <h3 className="font-display text-lg font-semibold">{service.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {SERVICE_SUMMARIES[service.slug as keyof typeof SERVICE_SUMMARIES]}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    İncele <ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
          <Button variant="outline" className="mt-4 w-full sm:hidden" asChild>
            <Link to="/hizmetler">Tüm hizmetleri görün</Link>
          </Button>
        </section>

        <section id="nasil" className="border-y bg-deep text-deep-foreground">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase text-primary">Adım adım</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Nasıl çalışıyoruz?</h2>
            <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-deep-foreground/15 bg-deep-foreground/15 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((step) => (
                <li key={step.n} className="min-h-32 bg-deep p-4 sm:p-5">
                  <span className="font-display text-2xl font-semibold text-primary">{step.n}</span>
                  <h3 className="mt-3 font-semibold">{step.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-deep-foreground/70">{step.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">İzmir</p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Hizmet bölgelerimiz</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Bulunduğunuz ilçedeki tadilat hizmetlerini inceleyin.</p>
              <Button variant="outline" className="mt-5 hidden lg:inline-flex" asChild><Link to="/bolgeler">Tüm bölgeler</Link></Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DISTRICTS.map((district) => (
                <Link
                  key={district.slug}
                  to="/bolgeler/$ilce"
                  params={{ ilce: district.slug }}
                  className="flex min-h-12 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:border-primary"
                >
                  <MapPin className="shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 truncate">{district.name}</span>
                </Link>
              ))}
            </div>
            <Button variant="outline" className="w-full lg:hidden" asChild><Link to="/bolgeler">Tüm bölgeler</Link></Button>
          </div>
        </section>

        {hasRealApplications ? (
          <section className="border-y bg-muted/30">
            <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
              <p className="text-xs font-semibold uppercase text-primary">Sahadan</p>
              <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Gerçek uygulamalar</h2>
              {beforeAfter.length > 0 ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {beforeAfter.map((row) => row.before_url && row.after_url ? (
                    <article key={row.id} className="overflow-hidden rounded-lg border bg-card">
                      <div className="grid grid-cols-2">
                        <figure className="relative"><img src={row.before_url} alt={`${row.title ?? row.work_type ?? "Tadilat"} öncesi`} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="absolute bottom-2 left-2 rounded bg-deep px-2 py-1 text-xs text-deep-foreground">Önce</figcaption></figure>
                        <figure className="relative"><img src={row.after_url} alt={`${row.title ?? row.work_type ?? "Tadilat"} sonrası`} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">Sonra</figcaption></figure>
                      </div>
                      <h3 className="p-4 font-medium">{row.title ?? row.work_type ?? "Tadilat uygulaması"}</h3>
                    </article>
                  ) : null)}
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.filter((project) => project.photo_urls?.[0]).slice(0, 3).map((project) => (
                    <article key={project.id} className="overflow-hidden rounded-lg border bg-card">
                      <img src={project.photo_urls?.[0]} alt={`${project.title} uygulama fotoğrafı`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      <div className="p-4"><h3 className="font-medium">{project.title}</h3>{project.district ? <p className="mt-1 text-sm text-muted-foreground">{project.district} / İzmir</p> : null}</div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <EnesEmlakReferral />

        <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase text-primary">Merak edilenler</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Sık sorulan sorular</h2>
          <Accordion type="single" collapsible className="mt-5 border-t">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-base no-underline hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="pr-8 leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="talep" className="border-y bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase text-primary">Keşif talebi</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Tadilat talebi oluştur</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Bilgilerinizi iletin, keşif planlaması için sizi arayalım.</p>
            <div className="mt-5"><RequestForm /></div>
          </div>
        </section>

        <section className="bg-deep text-deep-foreground">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Tadilat talebinizi bize iletin.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-deep-foreground/70 sm:text-base">İhtiyacınızı dinleyelim, keşif sürecini birlikte planlayalım.</p>
            <Button size="lg" className="mt-6" asChild><a href="#talep">Talep oluştur</a></Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 text-sm text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <span className="flex min-w-0 items-center gap-2">
            <img src={logoAsset.url} alt="" className="h-6 w-6 shrink-0 object-contain" />
            <span>© 2026 Enes Yapı · Bayraklı / İzmir · 0533 399 25 40</span>
          </span>
          <a href="https://izmirenesemlak.com.tr" className="hover:text-foreground">İş ortağımız: Enes Emlak</a>
        </div>
      </footer>

    </div>
  );
}