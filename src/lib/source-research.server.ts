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

export type SourceResearchResult = {
  ok: boolean;
  status: "tamamlandi" | "kilitli" | "durakladi" | "kaynak-yok";
  message: string;
  checked: number;
  allowed: number;
  blocked: number;
  unreachable: number;
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

  const result: SourceResearchResult = {
    ok: true,
    status: rows.length === 0 ? "kaynak-yok" : "tamamlandi",
    message:
      rows.length === 0
        ? "Denetlenecek aktif kaynak yok."
        : `${rows.length} kaynak denetlendi; ${allowed} kaynak otomatik taramaya uygun.`,
    checked: rows.length,
    allowed,
    blocked,
    unreachable,
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
