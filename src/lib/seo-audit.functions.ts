import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SeoAuditRow = {
  path: string;
  status: number;
  title: string | null;
  titleCount: number;
  description: string | null;
  descriptionCount: number;
  h1: string | null;
  h1Count: number;
  canonical: string | null;
  canonicalCount: number;
  canonicalSelf: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  robotsMeta: string | null;
  indexable: boolean;
  robotsAllowed: boolean;
  inSitemap: boolean;
  schemas: string[];
  issues: string[];
};

export type SeoAuditResult = {
  ranAt: string;
  origin: string;
  sitemapCount: number;
  robotsOk: boolean;
  robotsDisallow: string[];
  rows: SeoAuditRow[];
};

function decode(v: string) {
  return v
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

function metaContent(html: string, attr: "name" | "property", key: string) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, "gi");
  const tags = html.match(re) ?? [];
  const values = tags
    .map((t) => t.match(/content=["']([\s\S]*?)["']/i)?.[1])
    .filter((v): v is string => Boolean(v))
    .map(decode);
  return { value: values[0] ?? null, count: values.length };
}

function stripTags(v: string) {
  return decode(v.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function jsonLdTypes(html: string) {
  const blocks = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  const types = new Set<string>();
  for (const block of blocks) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(body) as unknown;
      const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          const t = (node as Record<string, unknown>)["@type"];
          if (typeof t === "string") types.add(t);
          if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x));
          Object.values(node as Record<string, unknown>).forEach(walk);
        }
      };
      walk(parsed);
    } catch {
      types.add("okunamadı");
    }
  }
  return [...types];
}

function robotsAllows(robots: string, path: string) {
  const lines = robots.split("\n").map((l) => l.trim());
  const disallow: string[] = [];
  let inStar = false;
  for (const line of lines) {
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      inStar = ua[1].trim() === "*";
      continue;
    }
    const dis = line.match(/^disallow:\s*(.*)$/i);
    if (dis && inStar && dis[1].trim()) disallow.push(dis[1].trim());
  }
  return { allowed: !disallow.some((d) => path === d || path.startsWith(d)), disallow };
}

async function auditPath(origin: string, path: string, robots: string, sitemapLocs: Set<string>): Promise<SeoAuditRow> {
  const url = `${origin}${path}`;
  let status = 0;
  let html = "";
  try {
    const res = await fetch(url, { headers: { "user-agent": "EnesYapiSeoAudit/1.0" } });
    status = res.status;
    html = await res.text();
  } catch {
    status = 0;
  }

  const head = html.split(/<\/head>/i)[0] ?? html;
  const titleTags = head.match(/<title[^>]*>([\s\S]*?)<\/title>/gi) ?? [];
  const title = titleTags[0] ? stripTags(titleTags[0].replace(/<\/?title[^>]*>/gi, "")) : null;
  const desc = metaContent(head, "name", "description");
  const ogTitle = metaContent(head, "property", "og:title");
  const ogDesc = metaContent(head, "property", "og:description");
  const robotsMeta = metaContent(head, "name", "robots");

  const canonicalTags = head.match(/<link[^>]*rel=["']canonical["'][^>]*>/gi) ?? [];
  const canonicals = canonicalTags
    .map((t) => t.match(/href=["']([\s\S]*?)["']/i)?.[1])
    .filter((v): v is string => Boolean(v))
    .map(decode);
  const canonical = canonicals[0] ?? null;

  const h1Tags = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) ?? [];
  const h1 = h1Tags[0] ? stripTags(h1Tags[0]) : null;

  const rob = robotsAllows(robots, path);
  const noindex = /noindex/i.test(robotsMeta.value ?? "");
  const indexable = status === 200 && !noindex && rob.allowed;
  const expectedCanonical = `https://enes-yap.lovable.app${path === "/" ? "/" : path}`;
  const canonicalSelf = Boolean(
    canonical && (canonical === expectedCanonical || canonical.replace(/\/$/, "") === expectedCanonical.replace(/\/$/, "")),
  );

  const issues: string[] = [];
  if (status !== 200) issues.push(`HTTP ${status || "erişilemedi"}`);
  if (!title) issues.push("Title yok");
  else if (titleTags.length > 1) issues.push("Birden fazla title");
  else if (title.length < 20 || title.length > 65) issues.push(`Title uzunluğu (${title.length})`);
  if (!desc.value) issues.push("Meta açıklama yok");
  else if (desc.count > 1) issues.push("Birden fazla meta açıklama");
  else if (desc.value.length < 70 || desc.value.length > 165) issues.push(`Açıklama uzunluğu (${desc.value.length})`);
  if (!h1) issues.push("H1 yok");
  else if (h1Tags.length > 1) issues.push(`${h1Tags.length} adet H1`);
  if (!canonical) issues.push("Canonical yok");
  else if (canonicals.length > 1) issues.push("Birden fazla canonical");
  else if (!canonicalSelf) issues.push("Canonical kendini göstermiyor");
  if (!ogTitle.value || !ogDesc.value) issues.push("Paylaşım etiketi eksik");
  if (!indexable) issues.push(noindex ? "noindex" : rob.allowed ? "İndekslenemez" : "robots.txt engeli");
  if (!sitemapLocs.has(expectedCanonical) && !sitemapLocs.has(expectedCanonical.replace(/\/$/, ""))) {
    issues.push("Sitemap'te yok");
  }
  const schemas = jsonLdTypes(html);
  if (schemas.length === 0) issues.push("Structured data yok");

  return {
    path,
    status,
    title,
    titleCount: titleTags.length,
    description: desc.value,
    descriptionCount: desc.count,
    h1,
    h1Count: h1Tags.length,
    canonical,
    canonicalCount: canonicals.length,
    canonicalSelf,
    ogTitle: ogTitle.value,
    ogDescription: ogDesc.value,
    robotsMeta: robotsMeta.value,
    indexable,
    robotsAllowed: rob.allowed,
    inSitemap: !issues.includes("Sitemap'te yok"),
    schemas,
    issues,
  };
}

/** Sitedeki genel sayfaları gerçekten indirip SEO durumunu doğrular. */
export const runSeoAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ paths: z.array(z.string().min(1).max(200)).min(1).max(120) }).parse(data))
  .handler(async ({ data }): Promise<SeoAuditResult> => {
    const req = getRequest();
    const reqUrl = new URL(req.url);
    const forwarded = reqUrl.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
    const origin = forwarded ? `https://${forwarded}` : reqUrl.origin;

    const [robots, sitemap] = await Promise.all([
      fetch(`${origin}/robots.txt`).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
      fetch(`${origin}/sitemap.xml`).then((r) => (r.ok ? r.text() : "")).catch(() => ""),
    ]);
    const locs = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((m) => decode(m[1]));
    const sitemapLocs = new Set(locs.flatMap((l) => [l, l.replace(/\/$/, "")]));
    const rob = robotsAllows(robots, "/yonetim");

    const rows: SeoAuditRow[] = [];
    const queue = [...data.paths];
    const workers = Array.from({ length: 6 }, async () => {
      for (;;) {
        const path = queue.shift();
        if (!path) return;
        rows.push(await auditPath(origin, path, robots, sitemapLocs));
      }
    });
    await Promise.all(workers);
    rows.sort((a, b) => data.paths.indexOf(a.path) - data.paths.indexOf(b.path));

    return {
      ranAt: new Date().toISOString(),
      origin,
      sitemapCount: locs.length,
      robotsOk: robots.includes("Sitemap:") && !rob.allowed,
      robotsDisallow: rob.disallow,
      rows,
    };
  });
