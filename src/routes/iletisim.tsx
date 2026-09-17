import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs, SiteShell } from "@/components/site/SiteShell";
import { RequestForm } from "@/components/site/RequestForm";
import { breadcrumbJsonLd, DISTRICTS, localBusinessJsonLd, pageHead, SITE } from "@/lib/seo";

const TITLE = "İletişim ve Teklif — Enes Yapı | Bayraklı, İzmir";
const DESCRIPTION =
  "Enes Yapı iletişim: 0533 399 25 40, Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir. Pazartesi–Cumartesi 09:00–19:00. Tadilat talebinizi formla iletin, keşif planlayalım.";

export const Route = createFileRoute("/iletisim")({
  component: ContactPage,
  head: () => {
    const base = pageHead({ path: "/iletisim", title: TITLE, description: DESCRIPTION });
    return {
      ...base,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(localBusinessJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "İletişim", path: "/iletisim" },
            ]),
          ),
        },
      ],
    };
  },
});

function ContactPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "İletişim", to: "/iletisim" }]} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">İletişim ve teklif talebi</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Tadilat, yenileme veya uygulama işiniz için bize telefonla, WhatsApp'tan ya da aşağıdaki formla
          ulaşabilirsiniz. Talebiniz kayıt altına alınır ve keşif için sizinle iletişime geçilir.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Telefon & WhatsApp</h2>
            <a href={`tel:${SITE.phoneE164}`} className="mt-1 block font-medium hover:text-primary">
              {SITE.phoneDisplay}
            </a>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
            >
              WhatsApp'tan yazın
            </a>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Adres</h2>
            <p className="mt-1 font-medium">{SITE.street}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {SITE.district} / {SITE.city}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground">Çalışma saatleri</h2>
            <p className="mt-1 font-medium">{SITE.openingHours}</p>
            <p className="mt-1 text-sm text-muted-foreground">Pazar kapalı</p>
          </div>
        </div>

        <div className="mt-10 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">Tadilat talebi oluşturun</h2>
          <p className="mt-2 text-muted-foreground">
            Formu doldurun; talebiniz kayıt altına alınır, ekibimiz keşif için sizinle iletişime geçer.
          </p>
          <div className="mt-6">
            <RequestForm />
          </div>
        </div>

        <h2 className="mt-12 text-2xl font-semibold tracking-tight">Hizmet bölgelerimiz</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <Link
              key={d.slug}
              to="/bolgeler/$ilce"
              params={{ ilce: d.slug }}
              className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
            >
              {d.name}
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
