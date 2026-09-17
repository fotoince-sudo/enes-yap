import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import { breadcrumbJsonLd, GUIDES, pageHead } from "@/lib/seo";

const TITLE = "İzmir Tadilat ve Yapı Rehberi — Enes Yapı";
const DESCRIPTION =
  "İzmir'de tadilat süreci, banyo yenileme, kentsel dönüşüm ve maliyet kalemleri hakkında uygulamaya dayalı rehber yazıları.";

export const Route = createFileRoute("/rehber/")({
  component: GuideIndex,
  head: () => {
    const base = pageHead({ path: "/rehber", title: TITLE, description: DESCRIPTION });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Rehber", path: "/rehber" },
            ]),
          ),
        },
      ],
    };
  },
});

function GuideIndex() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs items={[{ name: "Rehber", to: "/rehber" }]} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">İzmir tadilat ve yapı rehberi</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Sahada karşılaştığımız sorulardan yola çıkarak hazırladığımız rehberler. Genel geçer bilgi yerine, İzmir'de
          yürüttüğümüz işlerdeki uygulama kararlarını anlatıyoruz.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              to="/rehber/$slug"
              params={{ slug: g.slug }}
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary"
            >
              <h2 className="font-medium">{g.h1}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <CtaSection />
    </SiteShell>
  );
}
