import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs, CtaSection, SiteShell } from "@/components/site/SiteShell";
import {
  breadcrumbJsonLd,
  CORE_SERVICES,
  districtBySlug,
  DISTRICTS,
  pageHead,
  SERVICES,
  serviceJsonLd,
  SITE,
} from "@/lib/seo";

export const Route = createFileRoute("/bolgeler/$ilce/")({
  loader: ({ params }) => {
    const district = districtBySlug(params.ilce);
    if (!district) throw notFound();
    return { district };
  },
  head: ({ params, loaderData }) => {
    const district = loaderData?.district;
    if (!district) {
      return { meta: [{ title: "Sayfa bulunamadı — Enes Yapı" }, { name: "robots", content: "noindex" }] };
    }
    const path = `/bolgeler/${params.ilce}`;
    const title = `${district.name} Tadilat ve Yenileme — İzmir | Enes Yapı`;
    const description = `${district.name}, İzmir'de komple tadilat, banyo ve mutfak yenileme, boya, zemin ve dış cephe işleri. Yerinde keşif, kalem kalem teklif, tek muhatap.`;
    const base = pageHead({ path, title, description });
    return {
      ...base,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            serviceJsonLd({
              name: `${district.name} tadilat ve yenileme`,
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
              { name: district.name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: DistrictDetail,
});

function DistrictDetail() {
  const { district } = Route.useLoaderData();
  const neighbours = DISTRICTS.filter((d) => d.slug !== district.slug).slice(0, 8);

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Breadcrumbs
          items={[
            { name: "Hizmet bölgeleri", to: "/bolgeler" },
            { name: district.name, to: "/bolgeler/$ilce", params: { ilce: district.slug } },
          ]}
        />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {district.name} tadilat ve yenileme hizmetleri
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{district.note}</p>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {district.name} bölgesindeki daire, müstakil ev, ofis ve iş yerlerinde çalışıyoruz. Keşif için bölgeye
          gelip ölçü alıyor, kapsamı ve fiyatı yazılı olarak veriyoruz. Ofisimiz {SITE.district}'dadır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">{district.name}'da öne çıkan hizmetler</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CORE_SERVICES.map((s) => (
            <Link
              key={s.slug}
              to="/bolgeler/$ilce/$hizmet"
              params={{ ilce: district.slug, hizmet: s.slug }}
              className="rounded-lg border bg-card p-4 transition-colors hover:border-primary"
            >
              <h3 className="font-medium">
                {district.name} {s.name.toLocaleLowerCase("tr-TR")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Tüm hizmetler</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Link
              key={s.slug}
              to="/hizmetler/$slug"
              params={{ slug: s.slug }}
              className="rounded-md border bg-card px-3 py-1.5 text-sm hover:border-primary"
            >
              {s.name}
            </Link>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Yakın bölgeler</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {neighbours.map((d) => (
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

      <CtaSection label={`${district.name} için keşif planlayalım`} />
    </SiteShell>
  );
}
