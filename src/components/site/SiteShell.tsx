import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import enesEmlakLogoAsset from "@/assets/enes-emlak-logo.png.asset.json";
import logoAsset from "@/assets/enes-yapi-logo.png.asset.json";
import { SITE } from "@/lib/seo";

const EMLAK = "https://izmirenesemlak.com.tr";

/** Menü: Enes Yapı sayfaları + kardeş firma Enes Emlak'ın ilan sayfaları (yeni sekmede) */
const MENU_ICI = [
  { to: "/hizmetler", label: "Hizmetlerimiz" },
  { to: "/bolgeler", label: "Hizmet bölgeleri" },
  { to: "/rehber", label: "Rehber" },
  { to: "/iletisim", label: "İletişim" },
] as const;
const MENU_DIS = [
  { href: `${EMLAK}/ilanlar`, label: "İlan Ara" },
  { href: `${EMLAK}/ilan-ver`, label: "İlan Ver" },
  { href: EMLAK, label: "Enes Emlak" },
] as const;

/** Site geneli başlık: masaüstünde yatay menü, telefonda açılır menü. cta: sağdaki ana düğme */
export function SiteHeader({ cta }: { cta?: ReactNode }) {
  const [acik, setAcik] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Enes Yapı ana sayfa" onClick={() => setAcik(false)}>
          <img src={logoAsset.url} alt="Enes Yapı logosu" className="h-9 w-9 shrink-0 object-contain" />
          <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
            ENES <span className="text-primary">YAPI</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm lg:flex">
          {MENU_ICI.map((m) => (
            <Link key={m.to} to={m.to} className="text-muted-foreground hover:text-foreground">
              {m.label}
            </Link>
          ))}
          {MENU_DIS.map((m) => (
            <a key={m.href} href={m.href} target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">
              {m.label}
            </a>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {cta ?? (
            <Button size="sm" asChild>
              <Link to="/iletisim">Teklif alın</Link>
            </Button>
          )}
          <button
            type="button"
            aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setAcik((v) => !v)}
            className="rounded-full border p-2 text-primary lg:hidden"
          >
            {acik ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {acik && (
        <nav className="border-t bg-background px-4 py-2 lg:hidden">
          {MENU_ICI.map((m) => (
            <Link key={m.to} to={m.to} onClick={() => setAcik(false)} className="block py-2.5 text-sm">
              {m.label}
            </Link>
          ))}
          <div className="my-1 border-t" />
          {MENU_DIS.map((m) => (
            <a key={m.href} href={m.href} target="_blank" rel="noopener" onClick={() => setAcik(false)} className="block py-2.5 text-sm">
              {m.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

/** Site geneli başlık/altlık — ana sayfanın tasarım diliyle aynıdır. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>{children}</main>

      <EnesEmlakReferral />
      <SiteFooter />
    </div>
  );
}

export function EnesEmlakReferral() {
  return (
    <section className="border-y bg-deep text-deep-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:py-12 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
        <div className="flex items-start gap-4 sm:gap-5">
          <img
            src={enesEmlakLogoAsset.url}
            alt="Enes Emlak logosu"
            className="size-16 shrink-0 rounded-full border border-deep-foreground/20 bg-deep-foreground object-contain p-1 shadow-sm sm:size-20"
            loading="lazy"
          />
          <div>
            <p className="text-base font-extrabold uppercase text-deep-foreground sm:text-lg">Enes Emlak</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Yeni Bir Ev mi Arıyorsunuz?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-deep-foreground/75 sm:text-base">
              Satılık ve kiralık gayrimenkul seçeneklerini keşfedin. İzmir’de size uygun mülkü bulmak için Enes
              Emlak’a göz atın.
            </p>
            <p className="mt-4 text-xs font-medium text-deep-foreground/60 sm:text-sm">
              Satılık <span aria-hidden="true">•</span> Kiralık <span aria-hidden="true">•</span> Gayrimenkul Talepleri
            </p>
          </div>
        </div>
        <Button size="lg" variant="secondary" className="w-full justify-between gap-3 md:w-auto" asChild>
          <a href="https://izmirenesemlak.com.tr" target="_blank" rel="noopener noreferrer">
            Enes Emlak’ı Keşfet
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t py-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 text-sm sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-medium">
            <img src={logoAsset.url} alt="" className="h-6 w-6 object-contain" />
            Enes Yapı
          </div>
          <p className="mt-2 text-muted-foreground">
            {SITE.street}, {SITE.district} / {SITE.city}
          </p>
          <a href={`tel:${SITE.phoneE164}`} className="mt-1 block text-muted-foreground hover:text-foreground">
            {SITE.phoneDisplay}
          </a>
          <p className="mt-1 text-muted-foreground">{SITE.openingHours}</p>
        </div>
        <nav className="space-y-1">
          <div className="font-medium">Sayfalar</div>
          <Link to="/hizmetler" className="block text-muted-foreground hover:text-foreground">
            Hizmetler
          </Link>
          <Link to="/bolgeler" className="block text-muted-foreground hover:text-foreground">
            Hizmet bölgeleri
          </Link>
          <Link to="/rehber" className="block text-muted-foreground hover:text-foreground">
            İzmir rehberi
          </Link>
          <Link to="/iletisim" className="block text-muted-foreground hover:text-foreground">
            İletişim ve teklif
          </Link>
        </nav>
        <div className="text-muted-foreground">
          <div className="font-medium text-foreground">Hizmet bölgesi</div>
          <p className="mt-2">
            İzmir merkez ilçeleri ile Urla, Çeşme ve Seferihisar'da tadilat, yenileme, dekorasyon, dış cephe ve
            uygulama işleri.
          </p>
          <a href="https://izmirenesemlak.com.tr" className="mt-3 inline-block hover:text-foreground">
            İş ortağımız: Enes Emlak
          </a>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl px-4 text-xs text-muted-foreground">
        {"© 2026 Enes Yapı · Bayraklı / İzmir"}
      </div>
    </footer>
  );
}

/** Kırıntı yolu (breadcrumb) — sayfa üstünde gezinme ve iç linkleme. */
export function Breadcrumbs({ items }: { items: Array<{ name: string; to: string; params?: Record<string, string> }> }) {
  return (
    <nav aria-label="Sayfa yolu" className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:text-foreground">
            Ana sayfa
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.to + i} className="flex items-center gap-1">
            <span aria-hidden>/</span>
            {i === items.length - 1 ? (
              <span className="text-foreground">{item.name}</span>
            ) : (
              <Link
                to={item.to as never}
                params={(item.params ?? {}) as never}
                className="hover:text-foreground"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Sayfa sonu teklif çağrısı. */
export function CtaSection({ label }: { label?: string }) {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">{label ?? "Keşif ve teklif alın"}</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Yerinde keşif sonrası kapsamı ve fiyatı kalem kalem yazıyoruz. Telefonla veya formla ulaşabilirsiniz.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/iletisim">Talep formunu doldur</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`tel:${SITE.phoneE164}`}>{SITE.phoneDisplay}</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              WhatsApp'tan yazın
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
