import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import { breadcrumbJsonLd, DISTRICTS, pageHead, SERVICES } from "@/lib/seo";

const TITLE = "İzmir Tadilat ve Yapı Hizmetleri — Enes Yapı";
const DESCRIPTION =
  "İzmir'de komple tadilat, banyo ve mutfak yenileme, boya, dış cephe, çatı ve ofis tadilatı. Keşifli, kalem kalem tekliflendirilen yapı hizmetleri.";

export const Route = createFileRoute("/hizmetler/")({
  component: ServicesIndex,
  head: () => {
    const base = pageHead({ path: "/hizmetler", title: TITLE, description: DESCRIPTION });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Hizmetler", path: "/hizmetler" },
            ]),
          ),
        },
      ],
    };
  },
});

function ServicesIndex() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Hizmetler", to: "/hizmetler" }]} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">İzmir yapı ve tadilat hizmetleri</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          İzmir'de konut, iş yeri ve gayrimenkuller için tadilat, yenileme, dekorasyon, dış cephe ve uygulama işleri
          yapıyoruz. Her iş yerinde keşifle başlar; kapsam ve fiyat malzeme ve işçilik ayrı yazılarak sunulur.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to="/hizmetler/$slug"
              params={{ slug: s.slug }}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <h2 className="font-medium">{s.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="text-2xl font-semibold tracking-tight">Hizmet verdiğimiz İzmir ilçeleri</h2>
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

      <CtaSection />
    </SiteShell>
  );
}
