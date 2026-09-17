import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CORE_SERVICES, DISTRICTS, GUIDES, SERVICES, SITE } from "@/lib/seo";
import { runSeoAudit, type SeoAuditResult } from "@/lib/seo-audit.functions";

export const Route = createFileRoute("/_authenticated/yonetim/seo")({
  component: SeoPanel,
});

function groupOf(path: string) {
  if (path === "/") return "Ana";
  if (path.startsWith("/hizmetler")) return "Hizmet";
  if (path.split("/").length === 4 && path.startsWith("/bolgeler")) return "Bölge + hizmet";
  if (path.startsWith("/bolgeler")) return "Bölge";
  if (path.startsWith("/rehber")) return "Rehber";
  return "İletişim";
}

const KEY_PATHS = ["/", "/hizmetler", "/bolgeler", "/rehber", "/iletisim"];

function allPaths() {
  const paths = [...KEY_PATHS];
  for (const s of SERVICES) paths.push(`/hizmetler/${s.slug}`);
  for (const d of DISTRICTS) {
    paths.push(`/bolgeler/${d.slug}`);
    for (const s of CORE_SERVICES) paths.push(`/bolgeler/${d.slug}/${s.slug}`);
  }
  for (const g of GUIDES) paths.push(`/rehber/${g.slug}`);
  return paths;
}

function samplePaths() {
  const first = <T,>(list: T[]) => (list[0] ? [list[0]] : []);
  return [
    ...KEY_PATHS,
    ...first(SERVICES).map((s) => `/hizmetler/${s.slug}`),
    ...SERVICES.slice(1, 4).map((s) => `/hizmetler/${s.slug}`),
    ...first(DISTRICTS).map((d) => `/bolgeler/${d.slug}`),
    ...DISTRICTS.slice(1, 4).map((d) => `/bolgeler/${d.slug}`),
    ...first(DISTRICTS).flatMap((d) => first(CORE_SERVICES).map((s) => `/bolgeler/${d.slug}/${s.slug}`)),
    ...first(GUIDES).map((g) => `/rehber/${g.slug}`),
  ];
}

function SeoPanel() {
  const [filter, setFilter] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [result, setResult] = useState<SeoAuditResult | null>(null);
  const audit = useServerFn(runSeoAudit);

  const run = useMutation({
    mutationFn: async (paths: string[]) => await audit({ data: { paths } }),
    onSuccess: (data) => setResult(data),
  });

  const rows = (result?.rows ?? []).filter((r) => {
    if (onlyIssues && r.issues.length === 0) return false;
    if (!filter) return true;
    const q = filter.toLocaleLowerCase("tr-TR");
    return (
      r.path.toLocaleLowerCase("tr-TR").includes(q) || (r.title ?? "").toLocaleLowerCase("tr-TR").includes(q)
    );
  });

  const total = result?.rows.length ?? 0;
  const clean = result?.rows.filter((r) => r.issues.length === 0).length ?? 0;
  const indexable = result?.rows.filter((r) => r.indexable).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SEO denetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Denetim sayfaları gerçekten indirir; başlık, açıklama, H1, canonical, structured data ve Google'a
          indekslenebilirlik durumunu doğrular. Yönetim paneli ve müşteri sayfaları taramaya kapalıdır.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => run.mutate(samplePaths())} disabled={run.isPending}>
          {run.isPending ? "Denetim çalışıyor…" : "Hızlı denetim (örnek sayfalar)"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => run.mutate(allPaths())}
          disabled={run.isPending}
        >
          Tüm sayfaları denetle ({allPaths().length})
        </Button>
      </div>

      {run.isError ? (
        <p className="text-sm text-destructive">
          Denetim tamamlanamadı: {(run.error as Error)?.message ?? "bilinmeyen hata"}
        </p>
      ) : null}

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Denetlenen sayfa" value={String(total)} />
            <Stat label="Eksiksiz sayfa" value={`${clean}/${total}`} />
            <Stat label="İndekslenebilir" value={`${indexable}/${total}`} />
            <Stat label="Sitemap adresi" value={String(result.sitemapCount)} />
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h2 className="font-medium">Teknik durum</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Denetim zamanı: {new Date(result.ranAt).toLocaleString("tr-TR")}</li>
              <li>Denetlenen adres: {result.origin}</li>
              <li>Yayın alan adı: {SITE.url}</li>
              <li>Sitemap: {result.sitemapCount > 0 ? `${result.sitemapCount} adres yayında` : "okunamadı"}</li>
              <li>
                Robots.txt: {result.robotsOk ? "sitemap bildirimi ve panel engeli var" : "kontrol edilmeli"}
                {result.robotsDisallow.length > 0 ? ` · kapalı: ${result.robotsDisallow.join(", ")}` : ""}
              </li>
            </ul>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <h2 className="font-medium">Sayfa sağlık listesi</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={onlyIssues}
                    onChange={(e) => setOnlyIssues(e.target.checked)}
                  />
                  Yalnızca eksikli
                </label>
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Sayfa ara"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm sm:w-56"
                />
              </div>
            </div>

            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.path} className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.path}</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {groupOf(r.path)}
                    </span>
                    <span className="text-xs text-muted-foreground">HTTP {r.status}</span>
                    {r.issues.length === 0 ? (
                      <span className="text-xs font-medium text-primary">Uygun</span>
                    ) : (
                      <span className="text-xs font-medium text-destructive">{r.issues.join(" · ")}</span>
                    )}
                  </div>
                  <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    <Field label={`Title (${r.title?.length ?? 0})`} value={r.title} />
                    <Field label={`Meta açıklama (${r.description?.length ?? 0})`} value={r.description} />
                    <Field label={`H1 (${r.h1Count} adet)`} value={r.h1} />
                    <Field label="Canonical" value={r.canonical} extra={r.canonicalSelf ? "kendini gösteriyor" : "kontrol edin"} />
                    <Field label="Paylaşım başlığı" value={r.ogTitle} />
                    <Field label="Structured data" value={r.schemas.join(", ") || null} />
                    <Field
                      label="Google indeksleme"
                      value={r.indexable ? "İndekslenebilir" : "İndekslenemez"}
                      extra={`${r.robotsAllowed ? "robots.txt açık" : "robots.txt kapalı"} · ${
                        r.robotsMeta ? `meta robots: ${r.robotsMeta}` : "meta robots yok"
                      } · ${r.inSitemap ? "sitemap'te var" : "sitemap'te yok"}`}
                    />
                  </dl>
                  {r.keywords.length > 0 ? (
                    <div>
                      <div className="text-xs uppercase text-muted-foreground">
                        Hedef anahtar kelimeler ({r.keywordHits}/{r.keywords.length} sayfada geçiyor)
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.keywords.map((k) => {
                          const where = [
                            k.inTitle ? "başlık" : null,
                            k.inDescription ? "açıklama" : null,
                            k.inH1 ? "H1" : null,
                            k.inText ? "metin" : null,
                          ].filter(Boolean);
                          const ok = where.length > 0;
                          return (
                            <span
                              key={k.term}
                              className={`rounded-md border px-2 py-1 text-xs ${
                                ok ? "border-primary/40 text-foreground" : "border-destructive/40 text-destructive"
                              }`}
                            >
                              {k.term}
                              <span className="ml-1 text-muted-foreground">
                                {ok ? where.join(", ") : "geçmiyor"}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {rows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Bu filtreye uyan sayfa yok.</p>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Denetimi başlatmak için yukarıdaki butonlardan birini kullanın.
        </p>
      )}
    </div>
  );
}

function Field({ label, value, extra }: { label: string; value: string | null; extra?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words">
        {value ?? <span className="text-destructive">yok</span>}
        {extra ? <span className="block text-xs text-muted-foreground">{extra}</span> : null}
      </dd>
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
