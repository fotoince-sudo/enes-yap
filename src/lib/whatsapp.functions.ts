import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";

export type SendWhatsappResult = {
  ok: boolean;
  error?: string | undefined;
  waMessageId?: string | undefined;
};

/**
 * Panelden WhatsApp yanıtı gönderir (24 saatlik müşteri penceresi içinde serbest metin).
 * Gönderim sonucu her durumda whatsapp_messages tablosuna kaydedilir.
 */
export const sendWhatsappReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        phone: z.string().regex(/^\d{10,15}$/, "Geçersiz telefon"),
        body: z.string().min(1).max(4096),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<SendWhatsappResult> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const WHATSAPP_API_KEY = process.env["WHATSAPP_API_KEY"];
    if (!LOVABLE_API_KEY || !WHATSAPP_API_KEY) {
      return { ok: false, error: "WhatsApp bağlantısı henüz kurulmadı. Bağlantı tamamlandığında gönderebilirsiniz." };
    }

    const to = data.phone.replace(/\D/g, "");
    let response: Response;
    try {
      response = await fetch(`${GATEWAY_URL}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": WHATSAPP_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: data.body },
        }),
      });
    } catch (err) {
      return { ok: false, error: `Gönderim isteği başarısız: ${err instanceof Error ? err.message : String(err)}` };
    }

    const responseBody = await response.text();
    if (!response.ok) {
      console.error(`WhatsApp send failed [${response.status}]: ${responseBody}`);
      // Başarısız deneme olarak kaydet
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("whatsapp_messages").insert({
        direction: "out",
        contact_phone: to,
        body: data.body,
        status: "failed",
        status_error: `HTTP ${response.status}: ${responseBody.slice(0, 500)}`,
        raw: { http_status: response.status, body: responseBody.slice(0, 2000) },
      });
      return { ok: false, error: `Gönderilemedi (${response.status}). Lütfen tekrar deneyin.` };
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(responseBody);
    } catch {
      parsed = {};
    }
    // Slack tarzı 2xx-içi hata sinyali
    if (parsed && parsed.ok === false) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("whatsapp_messages").insert({
        direction: "out",
        contact_phone: to,
        body: data.body,
        status: "failed",
        status_error: String(parsed.error ?? "Bilinmeyen hata"),
        raw: parsed,
      });
      return { ok: false, error: `Gönderilemedi: ${String(parsed.error ?? "bilinmeyen hata")}` };
    }

    const waMessageId: string | undefined = parsed?.messages?.[0]?.id;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertErr } = await supabaseAdmin.from("whatsapp_messages").upsert(
      {
        direction: "out",
        wa_message_id: waMessageId ?? null,
        contact_phone: to,
        body: data.body,
        status: "accepted",
        provider_timestamp: new Date().toISOString(),
        raw: parsed,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    );
    if (insertErr) {
      console.error("Outbound WhatsApp record failed:", insertErr.message);
      return { ok: true, error: "Mesaj gönderildi ancak kaydı oluşturulamadı.", waMessageId };
    }

    // Gönderimden önce gelmiş durum geri çağrılarını uygula
    if (waMessageId) {
      const { reconcilePendingStatuses } = await import("@/lib/whatsapp.server");
      await reconcilePendingStatuses(supabaseAdmin, waMessageId);
    }

    return { ok: true, waMessageId };
  });
