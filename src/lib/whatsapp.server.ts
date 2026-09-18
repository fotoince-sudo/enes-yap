// Yalnızca sunucuda kullanılan WhatsApp yardımcıları (.server → istemci paketine girmez).
import type { SupabaseClient } from "@supabase/supabase-js";

type Admin = SupabaseClient<any>;

const STATUS_RANK: Record<string, number> = {
  received: 0,
  pending: 1,
  accepted: 2,
  sent: 3,
  delivered: 4,
  read: 5,
};

type WaStatus = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
};

/** Meta durum geri çağrılarını mevcut giden mesaj satırına uygular (sıra korumalı, tekrar güvenli). */
export async function applyStatus(admin: Admin, statuses: WaStatus[]): Promise<string[]> {
  const unknownIds: string[] = [];

  for (const s of statuses) {
    if (!s?.id || !s.status) continue;
    const { data: rows } = await admin
      .from("whatsapp_messages")
      .select("id, status, status_times, status_error")
      .eq("wa_message_id", s.id)
      .limit(1);
    const row = rows?.[0];
    if (!row) {
      unknownIds.push(s.id);
      continue;
    }

    const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : null;
    if (Number.isNaN(ts ? new Date(ts).getTime() : NaN)) {
      // geçersiz zaman damgası — yoksay
    }
    const times: Record<string, string> = { ...(row.status_times ?? {}) };
    if (ts && !Number.isNaN(new Date(ts).getTime())) times[s.status] = ts;

    const cur = row.status as string;
    const newRank = STATUS_RANK[s.status] ?? 0;
    const curRank = STATUS_RANK[cur] ?? 0;
    const errText = s.errors?.[0]?.message ?? s.errors?.[0]?.title ?? null;

    if (cur === "failed") {
      // Başarısız kayıt kalıcıdır; yalnızca zaman damgalarını ve hatayı zenginleştir.
      await admin
        .from("whatsapp_messages")
        .update({ status_times: times, status_error: errText ?? row.status_error ?? null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    } else if (s.status === "failed") {
      await admin
        .from("whatsapp_messages")
        .update({ status: "failed", status_error: errText, status_times: times, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    } else if (newRank > curRank) {
      await admin
        .from("whatsapp_messages")
        .update({ status: s.status, status_times: times, status_error: errText ?? null, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      // Eski/aynı durum: yalnızca zaman damgası birleştir (replay, kurulu zamanı ezmez).
      await admin
        .from("whatsapp_messages")
        .update({ status_times: times, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  return unknownIds;
}

/** Gelen WhatsApp mesajlarını kaydeder (mesaj kimliğine göre tekilleştirir). */
export async function storeInboundMessages(admin: Admin, value: any): Promise<void> {
  const messages: any[] = value?.messages ?? [];
  const contactName: string | undefined = value?.contacts?.[0]?.profile?.name ?? undefined;

  for (const m of messages) {
    if (!m?.id || !m?.from) continue;
    const body =
      m.text?.body ??
      m.button?.text ??
      m.interactive?.button_reply?.title ??
      m.interactive?.list_reply?.title ??
      m.caption ??
      (m.type === "image" ? "[Fotoğraf]" : m.type === "audio" ? "[Ses]" : m.type === "video" ? "[Video]" : m.type === "document" ? "[Belge]" : m.type === "location" ? "[Konum]" : `[${m.type ?? "bilinmeyen"}]`);
    const providerTs = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : null;

    await admin.from("whatsapp_messages").upsert(
      {
        direction: "in",
        wa_message_id: m.id,
        contact_phone: String(m.from).replace(/\D/g, ""),
        contact_name: contactName ?? null,
        body,
        status: "received",
        provider_timestamp: providerTs && !Number.isNaN(new Date(providerTs).getTime()) ? providerTs : null,
        raw: m,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    );
  }
}

/** Gönderimden sonra, giden mesaj kaydedilmeden önce gelen durum geri çağrılarını inbox'tan uygular. */
export async function reconcilePendingStatuses(admin: Admin, waMessageId: string): Promise<void> {
  if (!waMessageId) return;
  const { data: events } = await admin
    .from("whatsapp_webhook_events")
    .select("payload")
    .eq("event", "whatsapp.status")
    .order("received_at", { ascending: false })
    .limit(200);

  if (!events?.length) return;
  for (const ev of events) {
    const text = JSON.stringify(ev.payload ?? {});
    if (!text.includes(waMessageId)) continue;
    const value = ev.payload?.entry?.[0]?.changes?.[0]?.value;
    const statuses: WaStatus[] = value?.statuses ?? [];
    const matching = statuses.filter((s) => s?.id === waMessageId);
    if (matching.length) await applyStatus(admin, matching);
  }
}
