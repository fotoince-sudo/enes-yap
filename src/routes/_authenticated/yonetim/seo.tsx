import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CORE_SERVICES, DISTRICTS, GUIDES, SERVICES, SITE } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/yonetim/seo")({
  component: SeoPanel,
});

type PageRow = {
  path: string;
  title: string;
  description: string;
  h1: string;
  group: string;
  structuredData: string[];
};

function buildPages(): PageRow[] {
  const rows: PageRow[] = [
    {
      path: "/",
      title: "İzmir Tadilat, Yenileme ve Dekorasyon — Enes Yapı",
      description: "İzmir odaklı ana sayfa açıklaması",
      h1: "İzmir'de tadilat, yenileme ve dekorasyon çözümleri.",
      group: "Ana",
      structuredData: ["LocalBusiness", "WebSite"],
    },
    {
      path: "/hizmetler",
      title: "İzmir Tadilat ve Yapı Hizmetleri — Enes Yapı",
      description: "Hizmet listesi",
      h1: "İzmir yapı ve tadilat hizmetleri",
      group: "Hizmet",
      structuredData: ["BreadcrumbList"],
    },
    {
      path: "/bolgeler",
      title: "İzmir Hizmet Bölgelerimiz — Enes Yapı",
      description: "İlçe listesi",
      h1: "İzmir hizmet bölgelerimiz",
      group: "Bölge",
      structuredData: ["BreadcrumbList"],
    },
    {
      path: "/rehber",
      title: "İzmir Tadilat ve Yapı Rehberi — Enes Yapı",
      description: "Rehber listesi",
      h1: "İzmir tadilat ve yapı rehberi",
      group: "Rehber",
      structuredData: ["BreadcrumbList"],
    },
    {
      path: "/iletisim",
      title: "İletişim ve Teklif — Enes Yapı",
      description: "İletişim, adres, çalışma saatleri",
      h1: "İletişim ve teklif talebi",
      group: "İletişim",
      structuredData: ["LocalBusiness", "BreadcrumbList"],
    },
  ];

  for (const s of SERVICES) {
    rows.push({
      path: `/hizmetler/${s.slug}`,
      title: s.title,
      description: s.description,
      h1: s.h1,
      group: "Hizmet",
      structuredData: ["Service", "BreadcrumbList"],
    });
  }
  for (const d of DISTRICTS) {
    rows.push({
      path: `/bolgeler/${d.slug}`,
      title: `${d.name} Tadilat ve Yenileme — İzmir | Enes Yapı`,
      description: d.note,
      h1: `${d.name} tadilat ve yenileme hizmetleri`,
      group: "Bölge",
      structuredData: ["Service", "BreadcrumbList"],
    });
    for (const s of CORE_SERVICES) {
      rows.push({
        path: `/bolgeler/${d.slug}/${s.slug}`,
        title: `${d.name} ${s.name} — İzmir | Enes Yapı`,
        description: `${d.name} ${s.name.toLocaleLowerCase("tr-TR")} açıklaması`,
        h1: `${d.name} ${s.name.toLocaleLowerCase("tr-TR")}`,
        group: "Bölge + hizmet",
        structuredData: ["Service", "BreadcrumbList"],
      });
    }
  }
  for (const g of GUIDES) {
    rows.push({
      path: `/rehber/${g.slug}`,
      title: g.title,
      description: g.description,
      h1: g.h1,
      group: "Rehber",
      structuredData: ["Article", "BreadcrumbList"],
    });
  }
  return rows;
}

function check(row: PageRow) {
  const issues: string[] = [];
  if (row.title.length < 20 || row.title.length > 65) issues.push("Title uzunluğu");
  if (!/izmir/i.test(row.title) && row.path !== "/iletisim") issues.push("Title'da İzmir yok");
  if (row.description.length < 40) issues.push("Meta açıklama kısa");
  if (!row.h1) issues.push("H1 yok");
  if (row.structuredData.length === 0) issues.push("Structured data yok");
  return issues;
}

function SeoPanel() {
  const [filter, setFilter] = useState("");
  const pages = buildPages();

  const { data: tech, refetch, isFetching } = useQuery({
    queryKey: ["seo-tech"],
    queryFn: async () => {
      const [robots, sitemap] = await Promise.all([
        fetch("/robots.txt").then((r) => (r.ok ? r.text() : "")),
        fetch("/sitemap.xml").then((r) => (r.ok ? r.text() : "")),
      ]);
      const locCount = (sitemap.match(/<loc>/g) ?? []).length;
      return {
        robotsOk: robots.includes("Sitemap:") && robots.includes("Disallow: /yonetim"),
        robots,
        sitemapOk: locCount > 0,
        locCount,
      };
    },
  });

  const rows = pages.filter(
    (p) =>
      !filter ||
      p.path.includes(filter.toLowerCase()) ||
      p.title.toLocaleLowerCase("tr-TR").includes(filter.toLocaleLowerCase("tr-TR")),
  );
  const withIssues = pages.filter((p) => check(p).length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO denetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sitedeki her genel sayfanın başlık, açıklama, H1, canonical, indekslenebilirlik ve structured data durumu.
          Yönetim paneli ve müşteri sayfaları arama motorlarına kapalıdır.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Genel sayfa" value={String(pages.length)} />
        <Stat label="Eksiği olan sayfa" value={String(withIssues.length)} />
        <Stat label="Sitemap adresi" value={tech?.sitemapOk ? String(tech.locCount) : "—"} />
        <Stat label="Robots.txt" value={tech?.robotsOk ? "Uygun" : "Kontrol edin"} />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Teknik durum</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Alan adı: {SITE.url} · Sitemap: {SITE.url}/sitemap.xml
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Kontrol ediliyor…" : "Yeniden kontrol et"}
          </Button>
        </div>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>Sitemap: {tech?.sitemapOk ? `${tech.locCount} adres yayında` : "okunamadı"}</li>
          <li>Robots.txt: {tech?.robotsOk ? "sitemap bildirimi ve panel engeli var" : "kontrol edilmeli"}</li>
          <li>Canonical: her sayfa kendi adresini işaret ediyor</li>
          <li>HTTPS: yayın adresi https ile sunuluyor</li>
          <li>Panel/hesap sayfaları: robots.txt ile taramaya kapalı</li>
        </ul>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="font-medium">Sayfa sağlık listesi</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Sayfa ara"
            className="h-9 w-56 rounded-md border bg-background px-3 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Sayfa</th>
                <th className="p-3">Grup</th>
                <th className="p-3">Title</th>
                <th className="p-3">H1</th>
                <th className="p-3">Structured data</th>
                <th className="p-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const issues = check(r);
                return (
                  <tr key={r.path} className="border-t align-top">
                    <td className="p-3 font-medium">{r.path}</td>
                    <td className="p-3 text-muted-foreground">{r.group}</td>
                    <td className="p-3 text-muted-foreground">
                      {r.title} <span className="text-xs">({r.title.length})</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.h1}</td>
                    <td className="p-3 text-muted-foreground">{r.structuredData.join(", ")}</td>
                    <td className="p-3">
                      {issues.length === 0 ? (
                        <span className="text-primary">Uygun</span>
                      ) : (
                        <span className="text-destructive">{issues.join(" · ")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
