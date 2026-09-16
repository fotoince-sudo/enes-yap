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

/**
 * Panelden kaynak onayı: izin durumu ve resmî besleme (RSS/JSON) adresi.
 * "İzinli" işaretleme yalnızca kaynağın robots.txt'i otomatik erişimi kapatmıyorsa
 * ve erişilebilir olduğunda mümkündür — mevcut motor kuralları korunur.
 */
export const setSourcePermission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        permission_status: z.enum(["izinli", "inceleniyor", "izinsiz"]),
        feed_url: z.string().trim().url().max(500).optional().or(z.literal("")),
        feed_type: z.enum(["rss", "json"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: roles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesError) throw new Error(rolesError.message);
    const isManager = (roles ?? []).some((r) => ["admin", "yonetici"].includes(String(r.role)));
    if (!isManager) throw new Error("Kaynak onayını yalnızca yöneticiler değiştirebilir.");

    const { data: source, error: sourceError } = await context.supabase
      .from("prospect_sources")
      .select("id, reachable, robots_allowed")
      .eq("id", data.id)
      .maybeSingle();
    if (sourceError) throw new Error(sourceError.message);
    if (!source) throw new Error("Kaynak bulunamadı.");

    if (data.permission_status === "izinli") {
      if (source.robots_allowed === false) {
        throw new Error("Bu kaynak otomatik erişimi kendi kurallarıyla kapatmış; izinli işaretlenemez.");
      }
      if (source.reachable !== true) {
        throw new Error("Kaynağa erişilemiyor; önce motoru çalıştırıp erişimi doğrulayın.");
      }
    }

    const feedUrl = data.feed_url ? data.feed_url : null;
    const { error } = await context.supabase
      .from("prospect_sources")
      .update({
        permission_status: data.permission_status,
        feed_url: feedUrl,
        feed_type: feedUrl ? (data.feed_type ?? "rss") : null,
        auto_scan_allowed: data.permission_status === "izinli" && source.robots_allowed !== false,
        approved_by: data.permission_status === "izinli" ? context.userId : null,
        approved_at: data.permission_status === "izinli" ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
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
