import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import {
  breadcrumbJsonLd,
  CORE_SERVICES,
  DISTRICTS,
  GUIDES,
  pageHead,
  SERVICES,
  serviceBySlug,
  serviceJsonLd,
  SITE,
} from "@/lib/seo";

export const Route = createFileRoute("/hizmetler/$slug")({
  loader: ({ params }) => {
    const service = serviceBySlug(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ params, loaderData }) => {
    const service = loaderData?.service;
    if (!service) {
      return { meta: [{ title: "Sayfa bulunamadı — Enes Yapı" }, { name: "robots", content: "noindex" }] };
    }
    const path = `/hizmetler/${params.slug}`;
    const base = pageHead({ path, title: service.title, description: service.description });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            serviceJsonLd({ name: service.name, description: service.description, path }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Hizmetler", path: "/hizmetler" },
              { name: service.name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: ServiceDetail,
});

function ServiceDetail() {
  const { service } = Route.useLoaderData();
  const isCore = CORE_SERVICES.some((s) => s.slug === service.slug);
  const others = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 6);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Hizmetler", to: "/hizmetler" },
            { name: service.name, to: "/hizmetler/$slug", params: { slug: service.slug } },
          ]}
        />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{service.h1}</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{service.intro}</p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          İzmir {service.name.toLocaleLowerCase("tr-TR")} işleri için {SITE.district}'daki ofisimizden bölgeye
          gelip ölçü alıyoruz. {service.name} fiyatları kapsam, mevcut altyapı ve malzeme sınıfına göre değişir;
          bu yüzden keşif yapmadan fiyat vermiyor, teklifi malzeme ve işçilik olarak ayrı yazıyoruz.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">İş kapsamı</h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {service.scope.map((item) => (
                <li key={item} className="rounded-lg border bg-card px-4 py-2.5 text-sm text-foreground">
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">Nasıl ilerliyoruz?</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">1. Keşif:</strong> Yerinde ölçü alınır, mevcut durum ve altyapı
                kontrol edilir.
              </li>
              <li>
                <strong className="text-foreground">2. Kapsam:</strong> Zorunlu ve tercihe bağlı işler ayrılır.
              </li>
              <li>
                <strong className="text-foreground">3. Teklif:</strong> Her kalem miktar, malzeme ve işçilik olarak
                ayrı yazılır.
              </li>
              <li>
                <strong className="text-foreground">4. Uygulama:</strong> Ekipler sıraya göre görevlendirilir, süreç
                sahada takip edilir.
              </li>
              <li>
                <strong className="text-foreground">5. Teslim:</strong> Kontrol listesi ve önce/sonra kaydıyla teslim
                edilir.
              </li>
            </ol>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">
              {service.name} hizmeti verdiğimiz İzmir ilçeleri
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {DISTRICTS.map((d) =>
                isCore ? (
                  <Link
                    key={d.slug}
                    to="/bolgeler/$ilce/$hizmet"
                    params={{ ilce: d.slug, hizmet: service.slug }}
                    className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
                  >
                    {d.name} {service.name.toLocaleLowerCase("tr-TR")}
                  </Link>
                ) : (
                  <Link
                    key={d.slug}
                    to="/bolgeler/$ilce"
                    params={{ ilce: d.slug }}
                    className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
                  >
                    {d.name}
                  </Link>
                ),
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold">Hızlı iletişim</h2>
              <a href={`tel:${SITE.phoneE164}`} className="mt-2 block font-medium hover:text-primary">
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
              <p className="mt-2 text-sm text-muted-foreground">{SITE.openingHours}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {SITE.street}, {SITE.district} / {SITE.city}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold">Diğer hizmetler</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link
                      to="/hizmetler/$slug"
                      params={{ slug: s.slug }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold">İzmir rehberi</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {GUIDES.slice(0, 3).map((g) => (
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
            </div>
          </aside>
        </div>
      </section>

      <CtaSection label={`${service.name} için keşif planlayalım`} />
    </SiteShell>
  );
}
