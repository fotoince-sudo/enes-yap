import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertManager(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    from: (t: string) => {
      select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: Array<{ role: string }> | null; error: { message: string } | null }> };
    };
  };
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (error) throw new Error(error.message);
  const ok = (data ?? []).some((r) => ["admin", "yonetici"].includes(String(r.role)));
  if (!ok) throw new Error("Bu işlemi yalnızca yöneticiler yapabilir.");
}

/** Aday İşleme Zincirini elle çalıştır (dış servise istek yapmaz). */
export const runLeadPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertManager(context);
    const { runLeadPipelineCore } = await import("./lead-pipeline.server");
    return await runLeadPipelineCore("manuel");
  });

/** Motor durumunu duraklat / yeniden başlat. */
export const setEngineStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ key: z.string().min(2).max(60), status: z.enum(["aktif", "durakladi"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context);
    const { error } = await context.supabase
      .from("engine_state")
      .update({
        status: data.status,
        paused_reason: data.status === "durakladi" ? "Yönetici duraklattı" : null,
      })
      .eq("key", data.key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Motor sağlık kontrolü: her motorun gerçekten okuma/yazma yapabildiğini ve
 * gerekli ortam anahtarlarının tanımlı olduğunu doğrular. Dış servise istek
 * göndermez, kayıt oluşturmaz veya silmez.
 */
export const checkEngines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertManager(context);

    const read = async (table: "prospect_sources" | "lead_prospects" | "engine_runs" | "emir_chat_sessions" | "renovation_requests" | "quotes" | "customers") => {
      const { error, count } = await context.supabase
        .from(table)
        .select("id", { count: "exact", head: true });
      return { ok: !error, count: count ?? 0, error: error?.message ?? null };
    };

    const [sources, prospects, runs, sessions, requests, quotes, customers] = await Promise.all([
      read("prospect_sources"),
      read("lead_prospects"),
      read("engine_runs"),
      read("emir_chat_sessions"),
      read("renovation_requests"),
      read("quotes"),
      read("customers"),
    ]);

    return {
      checkedAt: new Date().toISOString(),
      tables: { sources, prospects, runs, sessions, requests, quotes, customers },
      secrets: {
        aiKey: Boolean(process.env["LOVABLE_API_KEY"]),
        cronSecret: Boolean(process.env["LOVABLE_CRON_SECRET"]),
        serviceKey: Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]),
        whatsapp: Boolean(process.env["WHATSAPP_ACCESS_TOKEN"]),
      },
    };
  });
