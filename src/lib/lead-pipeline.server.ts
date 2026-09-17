/**
 * Aday İşleme Zinciri — mevcut Source Research Motorunun devamı.
 *
 * Zincir: (tarama/toplama tamamlandıktan sonra)
 *   temizleme → tekilleştirme → fırsat filtreleme (puanlama) → CRM eşleştirme
 *
 * Kurallar korunur: yalnızca İzmir, dış servise hiçbir istek yapılmaz (bu katman
 * yalnızca kendi veritabanımızdaki adayları işler), veri silinmez, mevcut motor
 * ve tablolar değiştirilmez. Bir aşama bir kayıtta hata verirse yalnızca o kayıt
 * işaretlenir; zincir durmaz ve kayıt sonraki güvenli turda yeniden işlenir.
 */

const BATCH = 50;

export type LeadPipelineResult = {
  ok: boolean;
  status: "tamamlandi" | "durakladi" | "kayit-yok";
  message: string;
  processed: number;
  cleaned: number;
  duplicates: number;
  scored: number;
  matched: number;
  errors: number;
};

const digits = (s: string) => s.replace(/\D/g, "");

/** Telefonu 90XXXXXXXXXX biçimine indirger (karşılaştırma için). */
export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  let d = digits(raw);
  if (d.length === 10) d = `90${d}`;
  if (d.length === 11 && d.startsWith("0")) d = `90${d.slice(1)}`;
  return d.length >= 12 ? d.slice(-12) : d.length >= 10 ? d : null;
}

const cleanText = (v: string | null) => {
  if (v == null) return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t.length === 0 ? null : t;
};

const HIGH_NEED = ["komple", "anahtar teslim", "tadilat", "yenileme", "renovasyon"];
const MID_NEED = ["mutfak", "banyo", "zemin", "parke", "seramik", "alçı", "dekorasyon"];
const LOW_NEED = ["boya", "badana", "tamir", "küçük"];

/** Fırsat puanı (0-100) ve gerekçesi. Sabit, açıklanabilir kurallar. */
export function scoreProspect(row: {
  title: string | null;
  description: string | null;
  need_type: string | null;
  estimated_work_type: string | null;
  estimated_value: number | null;
  district: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  listing_date: string | null;
  source_permission: string | null;
}): { score: number; reason: string } {
  const reasons: string[] = [];
  let score = 20;

  const text = [row.title, row.description, row.need_type, row.estimated_work_type]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  if (HIGH_NEED.some((k) => text.includes(k))) {
    score += 30;
    reasons.push("kapsamlı tadilat/yenileme ihtiyacı");
  } else if (MID_NEED.some((k) => text.includes(k))) {
    score += 20;
    reasons.push("mekân bazlı yenileme ihtiyacı");
  } else if (LOW_NEED.some((k) => text.includes(k))) {
    score += 10;
    reasons.push("küçük ölçekli iş");
  }

  if (row.contact_phone) {
    score += 20;
    reasons.push("telefon bilgisi mevcut");
  } else if (row.contact_email) {
    score += 10;
    reasons.push("e-posta bilgisi mevcut");
  } else {
    reasons.push("iletişim bilgisi yok");
  }

  if (row.district) {
    score += 5;
    reasons.push("İzmir ilçesi belirli");
  }

  if (typeof row.estimated_value === "number" && row.estimated_value > 0) {
    if (row.estimated_value >= 500000) {
      score += 15;
      reasons.push("yüksek tahmini iş değeri");
    } else if (row.estimated_value >= 100000) {
      score += 10;
      reasons.push("orta tahmini iş değeri");
    } else {
      score += 5;
    }
  }

  if (row.listing_date) {
    const days = (Date.now() - new Date(row.listing_date).getTime()) / 86_400_000;
    if (Number.isFinite(days)) {
      if (days <= 7) {
        score += 10;
        reasons.push("güncel kayıt");
      } else if (days > 90) {
        score -= 10;
        reasons.push("kayıt eskimiş");
      }
    }
  }

  if (row.source_permission === "izinsiz") {
    score = Math.min(score, 10);
    reasons.push("kaynak izinli değil — takibe alınmaz");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, reason: reasons.join(", ") };
}

type Row = {
  id: string;
  title: string | null;
  description: string | null;
  need_type: string | null;
  estimated_work_type: string | null;
  estimated_value: number | null;
  district: string | null;
  neighborhood: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  listing_date: string | null;
  source_permission: string | null;
  status: string;
  customer_id: string | null;
  matched_request_id: string | null;
  notes: string | null;
};

async function runInner(): Promise<LeadPipelineResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: state, error: stateError } = await supabaseAdmin
    .from("engine_state")
    .select("key, status, run_count")
    .eq("key", "lead_pipeline")
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);

  if (!state || state.status !== "aktif") {
    return {
      ok: false,
      status: "durakladi",
      message: "Aday işleme zinciri duraklatılmış; çalıştırılmadı.",
      processed: 0,
      cleaned: 0,
      duplicates: 0,
      scored: 0,
      matched: 0,
      errors: 0,
    };
  }

  const { data: rows, error } = await supabaseAdmin
    .from("lead_prospects")
    .select(
      "id, title, description, need_type, estimated_work_type, estimated_value, district, neighborhood, contact_name, contact_phone, contact_email, listing_date, source_permission, status, customer_id, matched_request_id, notes",
    )
    .order("scored_at", { ascending: true, nullsFirst: true })
    .limit(BATCH);
  if (error) throw new Error(error.message);

  const list = (rows ?? []) as Row[];
  let cleaned = 0;
  let duplicates = 0;
  let scored = 0;
  let matched = 0;
  let errors = 0;

  const seenPhone = new Map<string, string>();

  for (const row of list) {
    try {
      const patch: Record<string, unknown> = {};

      // 1) Temizleme — fazla boşluk, boş metin, telefon biçimi
      const title = cleanText(row.title);
      const desc = cleanText(row.description);
      const name = cleanText(row.contact_name);
      const phone = normalizePhone(row.contact_phone);
      if (title !== row.title) patch["title"] = title ?? row.title;
      if (desc !== row.description) patch["description"] = desc;
      if (name !== row.contact_name) patch["contact_name"] = name;
      if (phone && phone !== digits(row.contact_phone ?? "")) patch["contact_phone"] = phone;
      if (Object.keys(patch).length > 0) cleaned += 1;

      // 2) Tekilleştirme — aynı telefonun ikinci kaydı "Uygun Değil" olarak işaretlenir (silinmez)
      let isDuplicate = false;
      if (phone) {
        const first = seenPhone.get(phone);
        if (first && first !== row.id) {
          isDuplicate = true;
        } else {
          seenPhone.set(phone, row.id);
          const { data: others } = await supabaseAdmin
            .from("lead_prospects")
            .select("id, created_at")
            .eq("contact_phone", phone)
            .neq("id", row.id)
            .limit(5);
          if ((others ?? []).length > 0) {
            const { data: mine } = await supabaseAdmin
              .from("lead_prospects")
              .select("created_at")
              .eq("id", row.id)
              .maybeSingle();
            const older = (others ?? []).some(
              (o) => String(o.created_at) < String(mine?.created_at ?? ""),
            );
            if (older) isDuplicate = true;
          }
        }
      }
      if (isDuplicate) {
        duplicates += 1;
        if (row.status !== "uygun_degil") patch["status"] = "uygun_degil";
        patch["notes"] = `${row.notes ? `${row.notes}\n` : ""}Zincir: aynı telefonlu daha eski kayıt bulunduğu için mükerrer işaretlendi.`;
      }

      // 3) Fırsat filtreleme — puan ve gerekçe
      const verdict = scoreProspect(row);
      patch["score"] = verdict.score;
      patch["score_reason"] = verdict.reason;
      patch["scored_at"] = new Date().toISOString();
      scored += 1;

      // 4) CRM eşleştirme — telefon/e-posta ile mevcut müşteri ve talep
      if (!isDuplicate && (phone || row.contact_email)) {
        if (!row.customer_id && phone) {
          const { data: customers } = await supabaseAdmin
            .from("customers")
            .select("id, phone, whatsapp")
            .limit(500);
          const hit = (customers ?? []).find(
            (c) =>
              normalizePhone(c.phone as string | null) === phone ||
              normalizePhone(c.whatsapp as string | null) === phone,
          );
          if (hit) {
            patch["customer_id"] = hit.id;
            matched += 1;
          }
        }
        if (!row.matched_request_id && phone) {
          const { data: requests } = await supabaseAdmin
            .from("renovation_requests")
            .select("id, phone")
            .limit(500);
          const hit = (requests ?? []).find((r) => normalizePhone(r.phone as string | null) === phone);
          if (hit) {
            patch["matched_request_id"] = hit.id;
            if (!row.customer_id) matched += 0;
          }
        }
      }

      patch["pipeline_stage"] = isDuplicate ? "mukerrer" : "islendi";
      patch["pipeline_error"] = null;

      const { error: updateError } = await supabaseAdmin
        .from("lead_prospects")
        .update(patch as never)
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      await supabaseAdmin
        .from("lead_prospects")
        .update({ pipeline_stage: "hata", pipeline_error: message.slice(0, 500) })
        .eq("id", row.id);
    }
  }

  const result: LeadPipelineResult = {
    ok: true,
    status: list.length === 0 ? "kayit-yok" : "tamamlandi",
    message:
      list.length === 0
        ? "İşlenecek aday kaydı yok."
        : `${list.length} aday işlendi; ${cleaned} kayıt temizlendi, ${duplicates} mükerrer, ${scored} kayıt puanlandı, ${matched} kayıt mevcut müşteriyle eşleşti${errors > 0 ? `, ${errors} kayıtta hata` : ""}.`,
    processed: list.length,
    cleaned,
    duplicates,
    scored,
    matched,
    errors,
  };

  await supabaseAdmin
    .from("engine_state")
    .update({
      last_run_at: new Date().toISOString(),
      last_result: result as unknown as never,
      run_count: (state.run_count ?? 0) + 1,
    })
    .eq("key", "lead_pipeline");

  return result;
}

/** Zinciri bir tur çalıştırır ve sonucu mevcut çalışma günlüğüne (engine_runs) yazar. */
export async function runLeadPipelineCore(
  trigger: "manuel" | "otomatik" = "manuel",
): Promise<LeadPipelineResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const result = await runInner();
    await supabaseAdmin.from("engine_runs").insert({
      engine_key: "lead_pipeline",
      trigger,
      status: result.status,
      message: result.message,
      checked: result.processed,
      allowed: result.scored,
      blocked: result.duplicates,
      unreachable: result.errors,
      new_prospects: result.matched,
      collected: result.cleaned,
      details: [] as unknown as never,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    await supabaseAdmin.from("engine_runs").insert({
      engine_key: "lead_pipeline",
      trigger,
      status: "hata",
      message,
      details: [] as unknown as never,
    });
    throw error;
  }
}
