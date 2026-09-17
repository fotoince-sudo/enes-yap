import { createFileRoute } from "@tanstack/react-router";

import { CORE_SERVICES, DISTRICTS, GUIDES, SERVICES, SITE } from "@/lib/seo";

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const paths: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/hizmetler", priority: "0.9", changefreq: "monthly" },
    { path: "/bolgeler", priority: "0.9", changefreq: "monthly" },
    { path: "/rehber", priority: "0.7", changefreq: "monthly" },
    { path: "/iletisim", priority: "0.8", changefreq: "yearly" },
    ...SERVICES.map((s) => ({ path: `/hizmetler/${s.slug}`, priority: "0.8", changefreq: "monthly" })),
    ...DISTRICTS.map((d) => ({ path: `/bolgeler/${d.slug}`, priority: "0.7", changefreq: "monthly" })),
    ...DISTRICTS.flatMap((d) =>
      CORE_SERVICES.map((s) => ({
        path: `/bolgeler/${d.slug}/${s.slug}`,
        priority: "0.6",
        changefreq: "monthly",
      })),
    ),
    ...GUIDES.map((g) => ({ path: `/rehber/${g.slug}`, priority: "0.6", changefreq: "monthly" })),
  ];

  const urls = paths
    .map(
      (u) =>
        `  <url>\n    <loc>${SITE.url}${u.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
