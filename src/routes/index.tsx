import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import heroImg from "@/assets/hero.jpg";
import projeDaire from "@/assets/proje-daire.jpg";
import projeOfis from "@/assets/proje-ofis.jpg";
import projeTadilat from "@/assets/proje-tadilat.jpg";
import hakkimizdaImg from "@/assets/hakkimizda.jpg";

const navLinks = [
  { href: "#hizmetler", label: "Hizmetler" },
  { href: "#projeler", label: "Projeler" },
  { href: "#hakkimizda", label: "Hakkımızda" },
  { href: "#iletisim", label: "İletişim" },
];

const services = [
  {
    no: "01",
    title: "Tadilat & Renovasyon",
    desc: "Daire, ofis ve iş yeri tadilatı; yıkımdan tesisata, elektrikten boyaya komple yenileme.",
  },
  {
    no: "02",
    title: "Dekorasyon & İç Mimar",
    desc: "Renk, doku ve aydınlatma seçiminden mobilya yerleşimine kadar mekânın iç tasarımı.",
  },
  {
    no: "03",
    title: "Boya, Alçı & Zemin",
    desc: "Saten alçı, silikonlu boya, parke ve seramik gibi tüm yüzey ve kaplama işleri.",
  },
  {
    no: "04",
    title: "Mutfak & Banyo Yenileme",
    desc: "Vitrin, tezgâh, armatür ve seramik değişimi; tesisatı dahil anahtar teslim yenileme.",
  },
];

const projects = [
  {
    img: projeDaire,
    alt: "Yenilenmiş aydınlık ve modern daire iç mekanı",
    title: "Bahçe Apartmanı Dairesi",
    meta: "Tadilat · İstanbul · 2024",
    tag: "120 m²",
  },
  {
    img: projeOfis,
    alt: "Yenilenmiş cam bölmeli modern ofis iç mekanı",
    title: "Meridyen Ofis",
    meta: "Ofis Tadilatı · Ankara · 2023",
    tag: "650 m²",
  },
  {
    img: projeTadilat,
    alt: "Ahşap kirişli, yenilenmiş loft iç mekan",
    title: "Merkez Loft",
    meta: "Dekorasyon · İzmir · 2024",
    tag: "340 m²",
  },
];

const stats = [
  { value: "15+", label: "Yıl Deneyim" },
  { value: "85", label: "Yenilenen Mekân" },
  { value: "35.000", label: "m² Yenilenen Alan" },
  { value: "%98", label: "Zamanında Teslim" },
];

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`grid size-9 place-items-center bg-primary font-display text-lg font-extrabold text-primary-foreground ${className}`}
    >
      E
    </span>
  );
}

function Index() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-lg font-extrabold tracking-tight">
              ENES <span className="text-primary">YAPI</span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="#iletisim"
            className="bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Teklif Al
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-12 md:pb-20 md:pt-16">
          <div className="md:col-span-7">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-primary" />
              2009'dan beri yeniliyoruz
            </p>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Titiz işçilik,
              <br />
              kusursuz <span className="text-primary">bitiş.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Enes Yapı; daire, ofis ve iş yeri tadilatı ile dekorasyon
              işlerinde uçtan uca sorumluluk alır. Ücretsiz keşif, şeffaf
              bütçe, net takvim, zamanında teslim.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#projeler"
                className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Projeleri Gör
                <span aria-hidden>→</span>
              </a>
              <a
                href="#iletisim"
                className="inline-flex items-center border-2 border-foreground/20 px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Bize Ulaşın
              </a>
            </div>
          </div>
          <div className="relative md:col-span-5">
            <img
              src={heroImg}
              alt="Yenilenmiş sıcak ve aydınlık oturma odası iç mekanı"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full object-cover"
            />
            <div className="absolute -bottom-5 left-4 flex items-end gap-6 bg-card px-5 py-4 shadow-lg ring-1 ring-border">
              <div>
                <p className="font-display text-3xl font-extrabold leading-none">15+</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Yıl deneyim</p>
              </div>
              <div className="h-9 w-px bg-border" />
              <div>
                <p className="font-display text-3xl font-extrabold leading-none">85</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">Proje</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="mt-8 bg-deep text-deep-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-extrabold tracking-tight">{s.value}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-deep-foreground/60">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Hizmetler */}
      <section id="hizmetler" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Hizmetler</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Ne yapıyoruz?
            </h2>
          </div>
            <p className="max-w-[36ch] text-sm text-muted-foreground">
              Keşiften teslime tüm tadilat ve dekorasyon işlerinde tek ekip,
              tek sorumluluk.
            </p>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {services.map((s) => (
            <div
              key={s.no}
              className="group grid gap-2 py-6 transition-colors hover:bg-secondary/60 sm:grid-cols-[80px_1fr_2fr] sm:items-baseline sm:gap-8 sm:px-4"
            >
              <span className="font-display text-sm font-extrabold text-primary">{s.no}</span>
              <h3 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                {s.title}
              </h3>
              <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projeler */}
      <section id="projeler" className="bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Portföy</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                Tamamlanan projeler
              </h2>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">2019 — 2024</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {projects.map((p) => (
              <article key={p.title} className="group overflow-hidden bg-card ring-1 ring-border">
                <div className="overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.alt}
                    width={1024}
                    height={768}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 p-5">
                  <div>
                    <h3 className="font-display text-lg font-extrabold tracking-tight">{p.title}</h3>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{p.meta}</p>
                  </div>
                  <span className="shrink-0 bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                    {p.tag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hakkımızda */}
      <section id="hakkimizda" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <img
              src={hakkimizdaImg}
              alt="İç mekanda duvar boyayan tadilat ustası"
              width={1024}
              height={1024}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="md:col-span-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Hakkımızda</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Mekânın hakkını veren ekip
            </h2>
            <p className="mt-5 max-w-[56ch] text-pretty leading-relaxed text-muted-foreground">
              2009'dan bu yana Türkiye genelinde 85'ten fazla daireyi, ofisi ve
              iş yerini yeniledik. Her işte aynı ilkeyle çalışırız: işi bir
              kez, doğru yapmak. Kaba inşaatın gürültüsünden son perdenin
              askısına kadar her detayla biz ilgileniriz.
            </p>
            <p className="mt-4 max-w-[56ch] text-pretty leading-relaxed text-muted-foreground">
              Bütçenizi baştan netleştirir, takvimi şeffaf yönetir ve her
              aşamada tek muhatap olursunuz.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { v: "%98", l: "Zamanında teslim" },
                { v: "320+", l: "Uzman ekip" },
                { v: "7/24", l: "Saha takibi" },
              ].map((b) => (
                <div key={b.l} className="bg-card p-4 ring-1 ring-border">
                  <p className="font-display text-2xl font-extrabold text-primary">{b.v}</p>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">{b.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* İletişim */}
      <section id="iletisim" className="bg-deep text-deep-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              İletişim
            </p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Projenizi konuşalım
            </h2>
            <p className="mt-5 max-w-[42ch] leading-relaxed text-deep-foreground/70">
              Keşif ve ölçüm ücretsizdir. Formu doldurun ya da doğrudan
              arayın; 24 saat içinde dönüş yaparız.
            </p>
            <div className="mt-8 space-y-3">
              <a
                href="tel:+902120000000"
                className="flex items-center justify-between border border-deep-foreground/20 px-5 py-4 transition-colors hover:border-deep-foreground hover:bg-deep-foreground hover:text-deep"
              >
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-deep-foreground/60">
                  Telefon
                </span>
                <span className="font-display font-bold">+90 (212) 000 00 00</span>
              </a>
              <a
                href="https://wa.me/905320000000"
                className="flex items-center justify-between border border-deep-foreground/20 px-5 py-4 transition-colors hover:border-deep-foreground hover:bg-deep-foreground hover:text-deep"
              >
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-deep-foreground/60">
                  WhatsApp
                </span>
                <span className="font-display font-bold">+90 (532) 000 00 00</span>
              </a>
              <a
                href="mailto:info@enesyapi.com"
                className="flex items-center justify-between border border-deep-foreground/20 px-5 py-4 transition-colors hover:border-deep-foreground hover:bg-deep-foreground hover:text-deep"
              >
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-deep-foreground/60">
                  E-posta
                </span>
                <span className="font-display font-bold">info@enesyapi.com</span>
              </a>
            </div>
          </div>
          <div className="bg-card p-6 text-foreground sm:p-8">
            {sent ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <span className="grid size-12 place-items-center bg-primary font-display text-xl font-extrabold text-primary-foreground">
                  ✓
                </span>
                <h3 className="mt-5 font-display text-2xl font-extrabold">Talebiniz alındı</h3>
                <p className="mt-2 max-w-[36ch] text-sm text-muted-foreground">
                  En kısa sürede sizinle iletişime geçeceğiz. Acil durumlar için
                  bizi doğrudan arayabilirsiniz.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ad Soyad
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Adınız"
                      className="mt-1.5 w-full border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Telefon
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="0555 000 00 00"
                      className="mt-1.5 w-full border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Hizmet
                  </span>
                  <select className="mt-1.5 w-full border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary">
                    <option>Tadilat & Renovasyon</option>
                    <option>Dekorasyon & İç Mimar</option>
                    <option>Boya, Alçı & Zemin</option>
                    <option>Mutfak & Banyo Yenileme</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Mesajınız
                  </span>
                  <textarea
                    rows={4}
                    placeholder="Projenizden kısaca bahsedin..."
                    className="mt-1.5 w-full resize-none border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
                <button
                  type="submit"
                  className="w-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Teklif İste
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="border-t border-deep-foreground/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs font-semibold text-deep-foreground/50 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2.5">
              <LogoMark className="!size-7 text-sm" />
              <span>ENES YAPI © 2026</span>
            </div>
            <span>İstanbul · Türkiye</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title: "Enes Yapı — Tadilat, Renovasyon ve Dekorasyon | İstanbul",
      },
      {
        name: "description",
        content:
          "Enes Yapı: daire, ofis ve iş yeri tadilatı, dekorasyon ve komple yenileme hizmetleri. 15+ yıl deneyim, ücretsiz keşif, zamanında teslim.",
      },
      {
        property: "og:title",
        content: "Enes Yapı — Tadilat, Renovasyon ve Dekorasyon | İstanbul",
      },
      {
        property: "og:description",
        content:
          "Daire, ofis ve iş yeri tadilatı ile dekorasyonda uçtan uca çözüm. 15+ yıl deneyim, ücretsiz keşif, zamanında teslim.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});
