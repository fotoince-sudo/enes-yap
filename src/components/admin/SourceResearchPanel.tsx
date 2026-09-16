import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  runSourceResearch,
  setSourcePermission,
  setSourceResearchStatus,
} from "@/lib/source-research.functions";
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
  const permissionFn = useServerFn(setSourcePermission);
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
          "id, name, url, category, permission_status, active, reachable, http_status, robots_allowed, robots_note, auto_scan_allowed, last_checked_at, last_result, feed_url, feed_type, approved_at, last_collect_count",
        )
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["engine-runs", "source_research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_runs")
        .select("id, trigger, status, message, checked, allowed, blocked, unreachable, new_prospects, created_at")
        .eq("engine_key", "source_research")
        .order("created_at", { ascending: false })
        .limit(15);
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
      void queryClient.invalidateQueries({ queryKey: ["engine-runs", "source_research"] });
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

  const permission = useMutation({
    mutationFn: async (input: {
      id: string;
      permission_status: "izinli" | "inceleniyor" | "izinsiz";
      feed_url?: string;
      feed_type?: "rss" | "json";
    }) => await permissionFn({ data: input }),
    onSuccess: () => {
      toast.success("Kaynak onayı güncellendi.");
      void queryClient.invalidateQueries({ queryKey: ["prospect-sources"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const scannable = sources.filter((s) => s.auto_scan_allowed);
  const notScannable = sources.filter((s) => !s.auto_scan_allowed);
  const approvedCount = sources.filter((s) => s.permission_status === "izinli").length;
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
          <Stat label="Onaylı kaynak" value={String(approvedCount)} />
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
                <th className="p-2">İzin / onay</th>
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
                    <td className="p-2">
                      <SourceApproval
                        source={s}
                        saving={permission.isPending}
                        onSave={(input) => permission.mutate({ id: s.id, ...input })}
                      />
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

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Çalışma günlüğü (son 15 tur)</h3>
          <p className="text-xs text-muted-foreground">
            Motor her gün otomatik olarak çalışır; her turda denetlenen kaynaklar, erişilemeyenler ve yeni aday
            sayısı buraya kaydedilir.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2">Tarih</th>
                  <th className="p-2">Tetikleyen</th>
                  <th className="p-2">Denetlenen</th>
                  <th className="p-2">Uygun</th>
                  <th className="p-2">Erişilemeyen</th>
                  <th className="p-2">Yeni aday</th>
                  <th className="p-2">Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-muted-foreground">
                      Henüz kayıtlı çalışma yok.
                    </td>
                  </tr>
                ) : (
                  runs.map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="p-2 whitespace-nowrap">{trDate(r.created_at)}</td>
                      <td className="p-2 whitespace-nowrap">
                        {r.trigger === "otomatik" ? "Otomatik" : "Elle"}
                      </td>
                      <td className="p-2">{r.checked}</td>
                      <td className="p-2">{r.allowed}</td>
                      <td className="p-2">{r.unreachable}</td>
                      <td className="p-2">{r.new_prospects}</td>
                      <td className="p-2 text-xs text-muted-foreground">{r.message ?? r.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

type SourceRow = {
  id: string;
  permission_status: string;
  robots_allowed: boolean | null;
  reachable: boolean | null;
  approved_at: string | null;
  feed_url: string | null;
  feed_type: string | null;
  last_collect_count: number | null;
};

/** Kaynağın izin durumunu ve resmî besleme adresini yöneticinin onaylaması. */
function SourceApproval({
  source,
  saving,
  onSave,
}: {
  source: SourceRow;
  saving: boolean;
  onSave: (input: {
    permission_status: "izinli" | "inceleniyor" | "izinsiz";
    feed_url?: string;
    feed_type?: "rss" | "json";
  }) => void;
}) {
  const [status, setStatus] = useState<"izinli" | "inceleniyor" | "izinsiz">(
    (source.permission_status as "izinli" | "inceleniyor" | "izinsiz") ?? "inceleniyor",
  );
  const [feedUrl, setFeedUrl] = useState(source.feed_url ?? "");
  const [feedType, setFeedType] = useState<"rss" | "json">(
    (source.feed_type as "rss" | "json") ?? "rss",
  );

  const blocked = source.robots_allowed === false || source.reachable !== true;
  const dirty =
    status !== source.permission_status ||
    feedUrl !== (source.feed_url ?? "") ||
    feedType !== ((source.feed_type as "rss" | "json") ?? "rss");

  return (
    <div className="min-w-[220px] space-y-2">
      <select
        aria-label="İzin durumu"
        className="h-10 w-full rounded-md border bg-background px-2 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof status)}
      >
        <option value="inceleniyor">{PERMISSION_LABEL.inceleniyor}</option>
        <option value="izinli" disabled={blocked}>
          {PERMISSION_LABEL.izinli}
        </option>
        <option value="izinsiz">{PERMISSION_LABEL.izinsiz}</option>
      </select>

      <Input
        aria-label="Resmî besleme adresi (RSS / JSON)"
        placeholder="Resmî besleme adresi (RSS / JSON)"
        value={feedUrl}
        onChange={(e) => setFeedUrl(e.target.value)}
      />

      {feedUrl ? (
        <select
          aria-label="Besleme türü"
          className="h-10 w-full rounded-md border bg-background px-2 text-sm"
          value={feedType}
          onChange={(e) => setFeedType(e.target.value as "rss" | "json")}
        >
          <option value="rss">RSS / Atom</option>
          <option value="json">JSON</option>
        </select>
      ) : null}

      <Button
        size="sm"
        variant="outline"
        className="w-full"
        disabled={saving || !dirty}
        onClick={() =>
          onSave({
            permission_status: status,
            ...(feedUrl ? { feed_url: feedUrl, feed_type: feedType } : { feed_url: "" }),
          })
        }
      >
        Onayı kaydet
      </Button>

      {blocked ? (
        <p className="text-xs text-muted-foreground">
          Bu kaynak otomatik erişime kapalı veya erişilemiyor — izinli işaretlenemez.
        </p>
      ) : null}
      {source.approved_at ? (
        <p className="text-xs text-muted-foreground">
          Onaylandı: {trDate(source.approved_at)}
          {source.last_collect_count ? ` — son turda ${source.last_collect_count} aday` : ""}
        </p>
      ) : null}
    </div>
  );
}
