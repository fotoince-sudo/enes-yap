import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import {
  breadcrumbJsonLd,
  CORE_SERVICES,
  districtBusinessJsonLd,
  districtBySlug,
  pageHead,
  serviceBySlug,
  serviceJsonLd,
  SITE,
} from "@/lib/seo";

export const Route = createFileRoute("/bolgeler/$ilce/$hizmet")({
  loader: ({ params }) => {
    const district = districtBySlug(params.ilce);
    const service = serviceBySlug(params.hizmet);
    if (!district || !service || !service.core) throw notFound();
    return { district, service };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Sayfa bulunamadı — Enes Yapı" }, { name: "robots", content: "noindex" }] };
    }
    const { district, service } = loaderData;
    const path = `/bolgeler/${params.ilce}/${params.hizmet}`;
    const lower = service.name.toLocaleLowerCase("tr-TR");
    const title = `${district.name} ${service.name} — İzmir | Enes Yapı`;
    const description = `${district.name}, İzmir'de ${lower} işleri: yerinde keşif, malzeme ve işçilik ayrı yazılan teklif, ekip organizasyonu ve teslim kontrolü.`;
    const base = pageHead({ path, title, description });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            serviceJsonLd({
              name: `${district.name} ${service.name}`,
              description,
              path,
              area: `${district.name}, İzmir`,
            }),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Ana sayfa", path: "/" },
              { name: "Hizmet bölgeleri", path: "/bolgeler" },
              { name: district.name, path: `/bolgeler/${params.ilce}` },
              { name: service.name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: DistrictService,
});

function DistrictService() {
  const { district, service } = Route.useLoaderData();
  const lower = service.name.toLocaleLowerCase("tr-TR");
  const otherServices = CORE_SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Hizmet bölgeleri", to: "/bolgeler" },
            { name: district.name, to: "/bolgeler/$ilce", params: { ilce: district.slug } },
            {
              name: service.name,
              to: "/bolgeler/$ilce/$hizmet",
              params: { ilce: district.slug, hizmet: service.slug },
            },
          ]}
        />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {district.name} {lower}
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{district.note}</p>
        <p className="mt-3 max-w-3xl text-muted-foreground">{service.intro}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {district.name}'da {lower} kapsamı
            </h2>
            <ul className="mt-3 space-y-2">
              {service.scope.map((item) => (
                <li key={item} className="rounded-lg border bg-card px-4 py-2.5 text-sm">
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">Keşif ve teklif nasıl ilerler?</h2>
            <p className="mt-3 text-muted-foreground">
              {district.name} için keşif randevusunu telefon veya form üzerinden planlıyoruz. Yerinde ölçü alındıktan
              sonra kapsam ve fiyat kalem kalem yazılır; iş başladığında süreç sahada takip edilir ve teslimde önce/sonra
              kaydı bırakılır. Kesin fiyat, keşif yapılmadan verilmez.
            </p>

            <h2 className="mt-10 text-2xl font-semibold tracking-tight">
              {district.name}'daki diğer hizmetlerimiz
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {otherServices.map((s) => (
                <Link
                  key={s.slug}
                  to="/bolgeler/$ilce/$hizmet"
                  params={{ ilce: district.slug, hizmet: s.slug }}
                  className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
                >
                  {district.name} {s.name.toLocaleLowerCase("tr-TR")}
                </Link>
              ))}
              <Link
                to="/bolgeler/$ilce"
                params={{ ilce: district.slug }}
                className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
              >
                {district.name} tüm hizmetler
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="text-base font-semibold">Keşif randevusu</h2>
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
            </div>
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <h2 className="text-base font-semibold text-foreground">Hizmet detayı</h2>
              <p className="mt-2">
                {service.name} hizmetinin tüm kapsamı için{" "}
                <Link
                  to="/hizmetler/$slug"
                  params={{ slug: service.slug }}
                  className="text-foreground underline underline-offset-4"
                >
                  hizmet sayfasına
                </Link>{" "}
                bakabilirsiniz.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <CtaSection label={`${district.name} ${lower} için teklif alın`} />
    </SiteShell>
  );
}
