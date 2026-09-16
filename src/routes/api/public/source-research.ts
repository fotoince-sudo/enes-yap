import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Source Research Motoru — otomatik tetikleme ucu.
 * Yalnızca geçerli zamanlayıcı anahtarı ile çağrılabilir (pg_cron / harici zamanlayıcı).
 */
export const Route = createFileRoute("/api/public/source-research")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await authenticateCronRequest(request);
        if (unauthorized) return unauthorized;

        try {
          const { runSourceResearchCore } = await import("@/lib/source-research.server");
          const result = await runSourceResearchCore("otomatik");
          return Response.json(result, { status: result.ok ? 200 : 202 });
        } catch (error) {
          console.error("[source-research] run failed", error);
          return Response.json(
            { ok: false, message: error instanceof Error ? error.message : "Bilinmeyen hata" },
            { status: 500 },
          );
        }
      },
    },
  },
});
