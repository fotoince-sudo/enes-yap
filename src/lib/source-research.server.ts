/**
 * Source Research Motoru — çalışma çekirdeği.
 *
 * Görevi: potansiyel müşteri (aday) kaynaklarının gerçekten erişilebilir olup
 * olmadığını ve otomatik kullanıma izin verip vermediğini (robots.txt) denetlemek.
 * Hiçbir ilan içeriği indirilmez, hiçbir kişisel veri toplanmaz — bu motor
 * yalnızca "hangi kaynak taranabilir?" sorusunu cevaplar.
 *
 * Kurallar (daha önce verilen talimatlar korunur):
 * - Yalnızca İzmir bölgesi
 * - İzinsiz kaynak otomatik taramaya alınmaz
 * - CAPTCHA / erişim engeli aşma yok, oturum açma yok, gizli veri toplama yok
 * - Her çalıştırmada sınırlı sayıda kaynak denetlenir (bounded batch)
 * - Aynı anda tek çalışma (kilit), duraklatılmışsa hiç çalışmaz
 */

const BATCH_SIZE = 6;
const LEASE_MINUTES = 3;
const FETCH_TIMEOUT_MS = 8000;
const UA = "EnesYapiSourceResearch/1.0 (+https://enes-yap.lovable.app)";

const COLLECT_SOURCE_LIMIT = 3;
const COLLECT_ITEM_LIMIT = 20;

export type SourceResearchResult = {
  ok: boolean;
  status: "tamamlandi" | "kilitli" | "durakladi" | "kaynak-yok";
  message: string;
  checked: number;
  allowed: number;
  blocked: number;
  unreachable: number;
  /** Onaylı (izinli) kaynaklardan bu turda eklenen aday sayısı. */
  collected: number;
  details: Array<{ name: string; url: string; result: string; autoScanAllowed: boolean }>;
};

async function fetchText(url: string): Promise<{ status: number; body: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/plain,text/html;q=0.9,*/*;q=0.8" },
    });
    const body = res.ok ? (await res.text()).slice(0, 20000) : "";
    return { status: res.status, body };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** robots.txt içinde "*" ajanı için kök dizin taramasına izin var mı? */
export function robotsAllowsRoot(robotsBody: string): { allowed: boolean; note: string } {
  const lines = robotsBody.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim());
  let inStar = false;
  const disallow: string[] = [];
  const allow: string[] = [];

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      inStar = value === "*";
      continue;
    }
    if (!inStar) continue;
    if (key === "disallow" && value) disallow.push(value);
    if (key === "allow" && value) allow.push(value);
  }

  if (disallow.includes("/") && !allow.includes("/")) {
    return { allowed: false, note: "robots.txt tüm otomatik erişimi kapatmış (Disallow: /)" };
  }
  if (disallow.length === 0) {
    return { allowed: true, note: "robots.txt otomatik erişime kapalı bir kural içermiyor" };
  }
  return {
    allowed: true,
    note: `robots.txt kısmen kapalı (${disallow.length} kapalı yol) — yalnızca izinli yollar taranır`,
  };
}

type SourceRow = {
  id: string;
  name: string;
  url: string;
  permission_status: string;
  active: boolean;
};

/**
 * Motoru bir tur çalıştırır. Kilit alır, sınırlı sayıda kaynak denetler,
 * sonucu kaydeder ve kilidi bırakır.
 */
async function runSourceResearchInner(): Promise<SourceResearchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: state, error: stateError } = await supabaseAdmin
    .from("engine_state")
    .select("key, status, lease_until, run_count")
    .eq("key", "source_research")
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);
  if (!state) throw new Error("Motor durumu bulunamadı.");

  if (state.status !== "aktif") {
    return {
      ok: false,
      status: "durakladi",
      message: "Motor duraklatılmış durumda; çalıştırılmadı.",
      checked: 0,
      allowed: 0,
      blocked: 0,
      unreachable: 0,
      collected: 0,
      details: [],
    };
  }

  // Tek çalışma kilidi: kilit süresi dolmamışsa çık.
  const leaseUntil = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();
  const { data: leased, error: leaseError } = await supabaseAdmin
    .from("engine_state")
    .update({ lease_until: leaseUntil })
    .eq("key", "source_research")
    .eq("status", "aktif")
    .or(`lease_until.is.null,lease_until.lt.${nowIso}`)
    .select("key");
  if (leaseError) throw new Error(leaseError.message);
  if (!leased || leased.length === 0) {
    return {
      ok: false,
      status: "kilitli",
      message: "Motor şu anda çalışıyor; ikinci çalışma başlatılmadı.",
      checked: 0,
      allowed: 0,
      blocked: 0,
      unreachable: 0,
      collected: 0,
      details: [],
    };
  }

  const { data: sources, error: sourcesError } = await supabaseAdmin
    .from("prospect_sources")
    .select("id, name, url, permission_status, active")
    .eq("active", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);
  if (sourcesError) throw new Error(sourcesError.message);

  const rows = (sources ?? []) as SourceRow[];
  const details: SourceResearchResult["details"] = [];
  let allowed = 0;
  let blocked = 0;
  let unreachable = 0;

  for (const row of rows) {
    let reachable = false;
    let httpStatus: number | null = null;
    let robotsAllowed: boolean | null = null;
    let robotsNote: string | null = null;
    let resultText = "";

    if (row.permission_status === "izinsiz") {
      resultText = "İzinsiz kaynak — denetlenmedi, otomatik taramaya alınmaz.";
      blocked += 1;
    } else {
      let origin = "";
      try {
        origin = new URL(row.url).origin;
      } catch {
        origin = "";
      }

      if (!origin) {
        resultText = "Adres okunamadı.";
        unreachable += 1;
      } else {
        const home = await fetchText(origin);
        if (!home) {
          resultText = "Erişilemedi (bağlantı/zaman aşımı).";
          unreachable += 1;
        } else {
          httpStatus = home.status;
          reachable = home.status < 400;
          const robots = await fetchText(`${origin}/robots.txt`);
          if (robots && robots.status < 400 && robots.body) {
            const verdict = robotsAllowsRoot(robots.body);
            robotsAllowed = verdict.allowed;
            robotsNote = verdict.note;
          } else {
            robotsAllowed = null;
            robotsNote = "robots.txt okunamadı — otomatik tarama açılmaz.";
          }

          if (!reachable) {
            resultText = `Erişim reddedildi (HTTP ${home.status}).`;
            unreachable += 1;
          } else if (robotsAllowed === true) {
            resultText = `Erişilebilir (HTTP ${home.status}). ${robotsNote}`;
          } else {
            resultText = `Erişilebilir (HTTP ${home.status}) ancak otomatik tarama kapalı. ${robotsNote ?? ""}`.trim();
          }
        }
      }
    }

    const autoScanAllowed =
      row.permission_status === "izinli" && reachable && robotsAllowed === true;
    if (autoScanAllowed) allowed += 1;
    else if (row.permission_status !== "izinsiz" && reachable) blocked += 1;

    const { error: updateError } = await supabaseAdmin
      .from("prospect_sources")
      .update({
        reachable,
        http_status: httpStatus,
        robots_allowed: robotsAllowed,
        robots_note: robotsNote,
        auto_scan_allowed: autoScanAllowed,
        last_checked_at: new Date().toISOString(),
        last_result: resultText,
      })
      .eq("id", row.id);
    if (updateError) throw new Error(updateError.message);

    details.push({ name: row.name, url: row.url, result: resultText, autoScanAllowed });
  }

  // Onaylı (izinli + robots uygun + resmî besleme tanımlı) kaynaklardan aday toplama.
  const collect = await collectFromApprovedSources();
  details.push(...collect.details);

  const result: SourceResearchResult = {
    ok: true,
    status: rows.length === 0 ? "kaynak-yok" : "tamamlandi",
    message:
      rows.length === 0
        ? "Denetlenecek aktif kaynak yok."
        : `${rows.length} kaynak denetlendi; ${allowed} kaynak otomatik taramaya uygun; ${collect.collected} yeni aday eklendi.`,
    checked: rows.length,
    allowed,
    blocked,
    unreachable,
    collected: collect.collected,
    details,
  };

  await supabaseAdmin
    .from("engine_state")
    .update({
      lease_until: null,
      last_run_at: new Date().toISOString(),
      last_result: result as unknown as never,
      run_count: (state.run_count ?? 0) + 1,
    })
    .eq("key", "source_research");

  return result;
}

/* ------------------------------------------------------------------ *
 * Onaylı kaynaklardan aday toplama
 *
 * Kurallar korunur: yalnızca yöneticinin panelden "İzinli" olarak onayladığı,
 * robots.txt'i otomatik erişime kapatmayan ve resmî bir besleme (RSS/JSON)
 * adresi tanımlanmış kaynaklar okunur. Sayfa kazıma (scraping) yapılmaz,
 * yalnızca kaynağın kendi yayınladığı besleme okunur. Yalnızca İzmir.
 * ------------------------------------------------------------------ */

type FeedItem = { title: string; url: string | null; description: string | null; date: string | null };

const stripTags = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function pick(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m?.[1] ? decode(m[1]).trim() : null;
}

export function parseFeed(body: string, type: string): FeedItem[] {
  if (type === "json") {
    try {
      const parsed: unknown = JSON.parse(body);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { items?: unknown[] })?.items)
          ? (parsed as { items: unknown[] }).items
          : [];
      return arr
        .map((raw) => {
          const o = (raw ?? {}) as Record<string, unknown>;
          const title = String(o["title"] ?? o["baslik"] ?? "").trim();
          if (!title) return null;
          const url = o["url"] ?? o["link"] ?? o["ilan_url"];
          const desc = o["description"] ?? o["aciklama"] ?? null;
          const date = o["date"] ?? o["pubDate"] ?? o["tarih"] ?? null;
          return {
            title: title.slice(0, 200),
            url: url ? String(url).slice(0, 500) : null,
            description: desc ? stripTags(String(desc)).slice(0, 1500) : null,
            date: date ? String(date) : null,
          } satisfies FeedItem;
        })
        .filter((x): x is FeedItem => x !== null);
    } catch {
      return [];
    }
  }

  const blocks = body.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  return blocks
    .map((block) => {
      const title = pick(block, "title");
      if (!title) return null;
      let url = pick(block, "link");
      if (!url) url = block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? null;
      const description = pick(block, "description") ?? pick(block, "summary");
      const date = pick(block, "pubDate") ?? pick(block, "updated") ?? pick(block, "published");
      return {
        title: stripTags(title).slice(0, 200),
        url: url ? url.trim().slice(0, 500) : null,
        description: description ? stripTags(description).slice(0, 1500) : null,
        date,
      } satisfies FeedItem;
    })
    .filter((x): x is FeedItem => x !== null);
}

const IZMIR_DISTRICT_LIST = [
  "Aliağa","Balçova","Bayındır","Bayraklı","Bergama","Beydağ","Bornova","Buca","Çeşme","Çiğli",
  "Dikili","Foça","Gaziemir","Güzelbahçe","Karabağlar","Karaburun","Karşıyaka","Kemalpaşa","Kınık",
  "Kiraz","Konak","Menderes","Menemen","Narlıdere","Ödemiş","Seferihisar","Selçuk","Tire","Torbalı","Urla",
];

const fold = (s: string) => s.toLocaleLowerCase("tr-TR");

/** Metinde geçen İzmir ilçesi (yoksa null). */
export function detectIzmirDistrict(text: string): string | null {
  const t = fold(text);
  for (const d of IZMIR_DISTRICT_LIST) if (t.includes(fold(d))) return d;
  return null;
}

const CATEGORY_SOURCE: Record<string, string> = {
  "ilan-siteleri": "izinli-ilan-kaynagi",
  "acik-veri": "acik-veri",
  kurumsal: "resmi-api",
  arama: "google",
  "sosyal-medya": "instagram",
  "hizmet-talep": "izinli-ilan-kaynagi",
  "kendi-kaynagimiz": "kendi-web-formu",
};

async function collectFromApprovedSources(): Promise<{
  collected: number;
  details: SourceResearchResult["details"];
}> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const details: SourceResearchResult["details"] = [];

  const { data: approved, error } = await supabaseAdmin
    .from("prospect_sources")
    .select("id, name, url, category, feed_url, feed_type, auto_scan_allowed, permission_status")
    .eq("active", true)
    .eq("permission_status", "izinli")
    .eq("auto_scan_allowed", true)
    .not("feed_url", "is", null)
    .order("last_collect_at", { ascending: true, nullsFirst: true })
    .limit(COLLECT_SOURCE_LIMIT);
  if (error) throw new Error(error.message);

  let collected = 0;

  for (const src of approved ?? []) {
    const feedUrl = String(src.feed_url);
    const feed = await fetchText(feedUrl);
    if (!feed || feed.status >= 400 || !feed.body) {
      details.push({
        name: src.name,
        url: feedUrl,
        result: "Onaylı kaynak — besleme okunamadı, aday eklenmedi.",
        autoScanAllowed: true,
      });
      await supabaseAdmin
        .from("prospect_sources")
        .update({ last_collect_at: new Date().toISOString(), last_collect_count: 0 })
        .eq("id", src.id);
      continue;
    }

    const items = parseFeed(feed.body, String(src.feed_type ?? "rss")).slice(0, COLLECT_ITEM_LIMIT);
    let added = 0;
    let skippedOutside = 0;

    for (const item of items) {
      const district = detectIzmirDistrict(`${item.title} ${item.description ?? ""}`);
      if (!district) {
        skippedOutside += 1;
        continue;
      }
      const listingDate = item.date ? new Date(item.date) : null;
      const { error: insertError } = await supabaseAdmin.from("lead_prospects").insert({
        source: CATEGORY_SOURCE[String(src.category)] ?? "izinli-ilan-kaynagi",
        source_permission: "izinli",
        listing_url: item.url,
        title: item.title,
        city: "İzmir",
        district,
        description: item.description,
        listing_date:
          listingDate && !Number.isNaN(listingDate.getTime())
            ? listingDate.toISOString().slice(0, 10)
            : null,
        notes: `Otomatik toplama — kaynak: ${src.name}`,
        status: "yeni",
      });
      // Mükerrer kayıt (unique indeks) sessizce atlanır; motorun tekilleştirme kuralı korunur.
      if (!insertError) added += 1;
    }

    collected += added;
    await supabaseAdmin
      .from("prospect_sources")
      .update({ last_collect_at: new Date().toISOString(), last_collect_count: added })
      .eq("id", src.id);

    details.push({
      name: src.name,
      url: feedUrl,
      result: `Onaylı kaynak tarandı: ${items.length} kayıt okundu, ${added} yeni aday eklendi${
        skippedOutside > 0 ? `, ${skippedOutside} kayıt İzmir dışı olduğu için atlandı` : ""
      }.`,
      autoScanAllowed: true,
    });
  }

  return { collected, details };
}

/**
 * Motoru bir tur çalıştırır ve sonucu kalıcı çalışma günlüğüne (engine_runs) yazar.
 * Kayıt: hangi kaynaklar başarıyla denetlendi, hangileri erişilemedi, kaç yeni aday bulundu.
 * Motor kuralları değişmez — bu yalnızca kayıt katmanıdır.
 */
export async function runSourceResearchCore(
  trigger: "manuel" | "otomatik" = "manuel",
): Promise<SourceResearchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: before } = await supabaseAdmin
    .from("engine_state")
    .select("last_run_at")
    .eq("key", "source_research")
    .maybeSingle();
  const since = (before?.last_run_at as string | null) ?? null;

  let result: SourceResearchResult;
  try {
    result = await runSourceResearchInner();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    await supabaseAdmin.from("engine_runs").insert({
      engine_key: "source_research",
      trigger,
      status: "hata",
      message,
      details: [] as unknown as never,
    });
    throw error;
  }

  // Son çalışmadan bu yana eklenen yeni aday sayısı
  let newProspects = 0;
  const countQuery = supabaseAdmin
    .from("lead_prospects")
    .select("id", { count: "exact", head: true });
  const { count } = since
    ? await countQuery.gte("created_at", since)
    : await countQuery;
  newProspects = count ?? 0;

  await supabaseAdmin.from("engine_runs").insert({
    engine_key: "source_research",
    trigger,
    status: result.status,
    message: result.message,
    checked: result.checked,
    allowed: result.allowed,
    blocked: result.blocked,
    unreachable: result.unreachable,
    new_prospects: newProspects,
    collected: result.collected,
    details: result.details as unknown as never,
  });

  // Zincirin devamı: temizleme → tekilleştirme → filtreleme → CRM eşleştirme.
  // Bu aşama başarısız olsa bile tarama sonucu korunur; hata kendi günlüğüne yazılır.
  try {
    const { runLeadPipelineCore } = await import("./lead-pipeline.server");
    await runLeadPipelineCore(trigger);
  } catch (error) {
    console.error("[lead-pipeline] chain step failed", error);
  }

  return result;
}
