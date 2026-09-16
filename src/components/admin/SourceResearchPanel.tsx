import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { runSourceResearch, setSourceResearchStatus } from "@/lib/source-research.functions";
import { trDate } from "@/lib/domain";

const PERMISSION_LABEL: Record<string, string> = {
  izinli: "İzinli",
  inceleniyor: "İnceleniyor",
  izinsiz: "İzinsiz",
};

export function SourceResearchPanel() {
  const queryClient = useQueryClient();
  const runFn = useServerFn(runSourceResearch);
  const statusFn = useServerFn(setSourceResearchStatus);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const { data: engine } = useQuery({
    queryKey: ["engine-state", "source_research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_state")
        .select("key, label, status, last_run_at, last_result, run_count, lease_until")
        .eq("key", "source_research")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["prospect-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_sources")
        .select(
          "id, name, url, category, permission_status, active, reachable, http_status, robots_allowed, robots_note, auto_scan_allowed, last_checked_at, last_result",
        )
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const run = useMutation({
    mutationFn: async () => await runFn(),
    onSuccess: (result) => {
      setLastRun(result.message);
      toast.success(result.message);
      void queryClient.invalidateQueries({ queryKey: ["prospect-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["engine-state", "source_research"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: async (status: "aktif" | "durakladi") => await statusFn({ data: { status } }),
    onSuccess: () => {
      toast.success("Motor durumu güncellendi.");
      void queryClient.invalidateQueries({ queryKey: ["engine-state", "source_research"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const scannable = sources.filter((s) => s.auto_scan_allowed);
  const notScannable = sources.filter((s) => !s.auto_scan_allowed);
  const active = engine?.status === "aktif";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Source Research Motoru</CardTitle>
            <CardDescription>
              Kaynakların gerçekten erişilebilir olup olmadığını ve otomatik kullanıma izin verip vermediğini denetler.
              İlan içeriği indirmez, kişisel veri toplamaz.
            </CardDescription>
          </div>
          <Badge variant={active ? "default" : "secondary"}>{active ? "AKTİF" : "DURAKLATILDI"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Kayıtlı kaynak" value={String(sources.length)} />
          <Stat label="Taranabilir" value={String(scannable.length)} />
          <Stat label="Taranamaz" value={String(notScannable.length)} />
          <Stat label="Çalışma sayısı" value={String(engine?.run_count ?? 0)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run.mutate()} disabled={run.isPending || !active} className="w-full sm:w-auto">
            {run.isPending ? "Denetleniyor…" : "Motoru şimdi çalıştır"}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => toggle.mutate(active ? "durakladi" : "aktif")}
            disabled={toggle.isPending}
          >
            {active ? "Motoru duraklat" : "Motoru yeniden başlat"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Son çalışma: {engine?.last_run_at ? trDate(engine.last_run_at) : "henüz çalışmadı"}
          {lastRun ? ` — ${lastRun}` : ""}
        </p>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Kaynak</th>
                <th className="p-2">İzin</th>
                <th className="p-2">Erişim</th>
                <th className="p-2">Otomatik tarama</th>
                <th className="p-2">Son kontrol</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-muted-foreground">
                    Kaynak yok.
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.id} className="border-t align-top">
                    <td className="p-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.url}</div>
                      {s.last_result ? (
                        <div className="mt-1 text-xs text-muted-foreground">{s.last_result}</div>
                      ) : null}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {PERMISSION_LABEL[s.permission_status] ?? s.permission_status}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {s.reachable === null || s.reachable === undefined
                        ? "—"
                        : s.reachable
                          ? `Açık (${s.http_status ?? "?"})`
                          : `Kapalı (${s.http_status ?? "?"})`}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <Badge variant={s.auto_scan_allowed ? "default" : "secondary"}>
                        {s.auto_scan_allowed ? "UYGUN" : "UYGUN DEĞİL"}
                      </Badge>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {s.last_checked_at ? trDate(s.last_checked_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
