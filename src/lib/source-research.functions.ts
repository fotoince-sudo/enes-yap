import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Panelden elle çalıştırma — yalnızca yönetici/personel oturumu ile. */
export const runSourceResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const allowed = (roles ?? []).some((r) => ["admin", "yonetici"].includes(String(r.role)));
    if (!allowed) throw new Error("Bu işlemi yalnızca yöneticiler yapabilir.");

    const { runSourceResearchCore } = await import("./source-research.server");
    return await runSourceResearchCore();
  });

/** Motoru duraklat / yeniden başlat. */
export const setSourceResearchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ status: z.enum(["aktif", "durakladi"]) }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("engine_state")
      .update({ status: data.status, paused_reason: data.status === "durakladi" ? "Yönetici duraklattı" : null })
      .eq("key", "source_research");
    if (error) throw new Error(error.message);
    return { status: data.status };
  });
