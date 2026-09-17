import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import { breadcrumbJsonLd, canonical, CORE_SERVICES, GUIDES, guideBySlug, pageHead, SITE } from "@/lib/seo";

export const Route = createFileRoute("/rehber/$slug")({
  loader: ({ params }) => {
    const guide = guideBySlug(params.slug);
    if (!guide) throw notFound();
    return { guide };
  },
  head: ({ params, loaderData }) => {
    const guide = loaderData?.guide;
    if (!guide) {
      return { meta: [{ title: "Sayfa bulunamadı — Enes Yapı" }, { name: "robots", content: "noindex" }] };
    }
    const path = `/rehber/${params.slug}`;
    const base = pageHead({ path, title: guide.title, description: guide.description, type: "article" });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.h1,
            description: guide.description,
            url: canonical(path),
            inLanguage: "tr-TR",
            author: { "@type": "Organization", name: SITE.name, url: SITE.url },
            publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Rehber", path: "/rehber" },
              { name: guide.h1, path },
            ]),
          ),
        },
      ],
    };
  },
  component: GuideDetail,
});

function GuideDetail() {
  const { guide } = Route.useLoaderData();
  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Rehber", to: "/rehber" },
            { name: guide.h1, to: "/rehber/$slug", params: { slug: guide.slug } },
          ]}
        />
      </div>

      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{guide.h1}</h1>
        <p className="mt-4 text-muted-foreground">{guide.intro}</p>

        {guide.sections.map((s) => (
          <section key={s.h2} className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight">{s.h2}</h2>
            <p className="mt-2 text-muted-foreground">{s.body}</p>
            {s.bullets ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <section className="mt-10 rounded-lg border bg-card p-5">
          <h2 className="text-lg font-semibold">İlgili hizmetler</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CORE_SERVICES.map((s) => (
              <Link
                key={s.slug}
                to="/hizmetler/$slug"
                params={{ slug: s.slug }}
                className="rounded-md border px-3 py-1.5 text-sm hover:border-primary"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>

        {others.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">Diğer rehberler</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    to="/rehber/$slug"
                    params={{ slug: g.slug }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {g.h1}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <CtaSection />
    </SiteShell>
  );
}
