import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import { breadcrumbJsonLd, DISTRICTS, pageHead } from "@/lib/seo";

const TITLE = "İzmir Hizmet Bölgeleri — Tadilat ve Yenileme | Enes Yapı";
const DESCRIPTION =
  "Enes Yapı'nın tadilat ve yenileme hizmeti verdiği İzmir ilçeleri: Bayraklı, Bornova, Karşıyaka, Konak, Buca, Balçova, Gaziemir, Urla, Çeşme ve çevresi.";

export const Route = createFileRoute("/bolgeler/")({
  component: DistrictsIndex,
  head: () => {
    const base = pageHead({ path: "/bolgeler", title: TITLE, description: DESCRIPTION });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Hizmet bölgeleri", path: "/bolgeler" },
            ]),
          ),
        },
      ],
    };
  },
});

function DistrictsIndex() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Hizmet bölgeleri", to: "/bolgeler" }]} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">İzmir hizmet bölgelerimiz</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Ofisimiz Bayraklı Manavkuyu'dadır. İzmir merkez ilçelerinin tamamında ve Urla, Çeşme, Seferihisar
          bölgelerinde tadilat, yenileme, dekorasyon, dış cephe ve uygulama işleri yapıyoruz. Aşağıdaki ilçelerden
          birini seçerek o bölgedeki çalışma şeklimizi görebilirsiniz.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DISTRICTS.map((d) => (
            <Link
              key={d.slug}
              to="/bolgeler/$ilce"
              params={{ ilce: d.slug }}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <h2 className="font-medium">{d.name} tadilat ve yenileme</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d.note}</p>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection />
    </SiteShell>
  );
}
