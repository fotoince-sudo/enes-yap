import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";

export type WhatsappIntegrationStatus = {
  connected: boolean;
  reason: string;
  phone: {
    display_phone_number: string | null;
    verified_name: string | null;
    quality_rating: string | null;
    is_on_biz_app: boolean | null;
    platform_type: string | null;
  } | null;
  phoneError: string | null;
  wabaId: string | null;
  stats: {
    inbound: number;
    outbound: number;
    read: number;
    failed: number;
    lastInboundAt: string | null;
  };
  lastEvents: Array<{
    event: string;
    received_at: string;
    processed_at: string | null;
    processing_error: string | null;
  }>;
};

/** Meta (WhatsApp Business) entegrasyon durumunu panel için toplar. */
export const getWhatsappIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WhatsappIntegrationStatus> => {
    const { data: isStaff } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
    if (!isStaff) throw new Error("Forbidden");

    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const WHATSAPP_API_KEY = process.env["WHATSAPP_API_KEY"];
    const connected = Boolean(LOVABLE_API_KEY && WHATSAPP_API_KEY);
    const wabaId = process.env["WHATSAPP_WABA_ID"] ?? null;

    // Mesaj istatistikleri (personel RLS ile okunur)
    const countBy = async (filters: Record<string, string>) => {
      let query = context.supabase
        .from("whatsapp_messages")
        .select("*", { count: "exact", head: true });
      for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
      const { count } = await query;
      return count ?? 0;
    };
    const [inbound, outbound, read, failed] = await Promise.all([
      countBy({ direction: "in" }),
      countBy({ direction: "out" }),
      countBy({ direction: "out", status: "read" }),
      countBy({ status: "failed" }),
    ]);
    const { data: lastInbound } = await context.supabase
      .from("whatsapp_messages")
      .select("created_at")
      .eq("direction", "in")
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: lastEvents } = await context.supabase
      .from("whatsapp_webhook_events")
      .select("event, received_at, processed_at, processing_error")
      .order("received_at", { ascending: false })
      .limit(5);

    let phone: WhatsappIntegrationStatus["phone"] = null;
    let phoneError: string | null = null;
    if (connected) {
      try {
        const response = await fetch(
          `${GATEWAY_URL}/phone_number?fields=display_phone_number,verified_name,quality_rating,is_on_biz_app,platform_type`,
          {
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": WHATSAPP_API_KEY!,
            },
          },
        );
        const bodyText = await response.text();
        if (!response.ok) {
          phoneError = `HTTP ${response.status}: ${bodyText.slice(0, 300)}`;
        } else {
          const parsed = JSON.parse(bodyText);
          phone = {
            display_phone_number: parsed?.display_phone_number ?? null,
            verified_name: parsed?.verified_name ?? null,
            quality_rating: parsed?.quality_rating ?? null,
            is_on_biz_app: typeof parsed?.is_on_biz_app === "boolean" ? parsed.is_on_biz_app : null,
            platform_type: parsed?.platform_type ?? null,
          };
        }
      } catch (err) {
        phoneError = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      connected,
      reason: connected
        ? "WhatsApp Business bağlantısı kurulu."
        : "WhatsApp Business bağlantısı henüz kurulmadı. Lovable'daki bağlantı kartından Meta hesabınızı seçip +90 530 764 17 17 numarasını bağlayın.",
      phone,
      phoneError,
      wabaId,
      stats: {
        inbound,
        outbound,
        read,
        failed,
        lastInboundAt: lastInbound?.[0]?.created_at ?? null,
      },
      lastEvents: (lastEvents ?? []).map((e) => ({
        event: e.event,
        received_at: e.received_at,
        processed_at: e.processed_at,
        processing_error: e.processing_error,
      })),
    };
  });
