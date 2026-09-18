import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookRequest, WebhookError } from "@lovable.dev/webhooks-js";

import { applyStatus, storeInboundMessages } from "@/lib/whatsapp.server";

/**
 * WhatsApp webhook alıcısı — yol bir sözleşmedir: /api/public/whatsapp/webhook
 * Her teslimat imzayla doğrulanır, whatsapp_webhook_events inbox'ına yazılır,
 * sonra idempotent şekilde işlenir. Yalnızca kalıcı kayıt + başarılı işleme
 * sonrası 200 döner; hata 5xx döner ve gateway aynı delivery_id ile tekrar dener.
 */
export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const deliveryId = request.headers.get("x-lovable-delivery");
        const event = request.headers.get("x-lovable-event");
        if (!deliveryId || !event) {
          return new Response("Missing delivery headers", { status: 400 });
        }

        const waSecret = process.env["WHATSAPP_API_KEY"];
        if (!waSecret) {
          console.error("WhatsApp webhook: WHATSAPP_API_KEY is not configured");
          return new Response("Not configured", { status: 500 });
        }

        let verified;
        try {
          verified = await verifyWebhookRequest({
            req: request,
            secret: waSecret,
            maxBodyBytes: 4 * 1024 * 1024,
          });
        } catch (err) {
          const code = err instanceof WebhookError ? err.code : "unknown";
          console.error(`WhatsApp webhook verification failed [${code}]`);
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1) Kalıcı kayıt (inbox). Aynı delivery_id: işlenmişse sessizce onayla.
        const { data: inboxRows, error: inboxErr } = await supabaseAdmin
          .from("whatsapp_webhook_events")
          .upsert(
            { delivery_id: deliveryId, event, payload: (verified.payload ?? {}) as object },
            { onConflict: "delivery_id" },
          )
          .select("id, processed_at");
        if (inboxErr) {
          console.error("WhatsApp inbox write failed:", inboxErr.message);
          return new Response("Inbox write failed", { status: 500 });
        }
        const inboxRow = inboxRows?.[0];
        if (!inboxRow) {
          return new Response("Inbox write failed", { status: 500 });
        }
        if (inboxRow.processed_at) {
          return new Response("ok");
        }

        // 2) İşle (idempotent).
        try {
          const payload = (verified.payload ?? {}) as any;
          const value = payload?.entry?.[0]?.changes?.[0]?.value;

          if (event === "whatsapp.message") {
            await storeInboundMessages(supabaseAdmin, value);
          } else if (event === "whatsapp.status") {
            const statuses: any[] = value?.statuses ?? [];
            const unknownIds = await applyStatus(supabaseAdmin, statuses);
            if (unknownIds.length) {
              // Giden mesaj kaydı henüz yok: gönderim anında inbox'tan eşleştirilir.
              await supabaseAdmin
                .from("whatsapp_webhook_events")
                .update({ processing_error: `Gonderim oncesi durum: ${unknownIds.join(",")}` })
                .eq("id", inboxRow.id);
            }
          }
          // whatsapp.message_error ve diğer olaylar inbox'ta saklandı; ek işlem yok.

          await supabaseAdmin
            .from("whatsapp_webhook_events")
            .update({ processed_at: new Date().toISOString(), processing_error: null })
            .eq("id", inboxRow.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("WhatsApp webhook processing failed:", msg);
          await supabaseAdmin
            .from("whatsapp_webhook_events")
            .update({ processing_error: msg })
            .eq("id", inboxRow.id);
          return new Response("Processing failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
