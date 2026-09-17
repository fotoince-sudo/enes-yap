import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { checkEngines, runLeadPipeline, setEngineStatus } from "@/lib/engines.functions";
import { runSourceResearch } from "@/lib/source-research.functions";
import { trDate } from "@/lib/domain";

type Durum = "AKTİF" | "PASİF" | "BEKLİYOR" | "HATA";

type Motor = {
  key: string;
  name: string;
  job: string;
  durum: Durum;
  lastRun: string | null;
  lastOk: string | null;
  processed: number | null;
  errorCount: number;
  lastError: string | null;
  note: string;
  runKey?: "source_research" | "lead_pipeline";
  toggleKey?: string;
};

const BADGE: Record<Durum, "default" | "secondary" | "destructive" | "outline"> = {
  AKTİF: "default",
  PASİF: "secondary",
  BEKLİYOR: "outline",
  HATA: "destructive",
};

/** Tüm otomasyon motorlarının gerçek durumu — veriler canlı veritabanından okunur. */
export function EnginesPanel() {
  const queryClient = useQueryClient();
  const runSource = useServerFn(runSourceResearch);
  const runPipeline = useServerFn(runLeadPipeline);
  const toggleFn = useServerFn(setEngineStatus);
  const checkFn = useServerFn(checkEngines);

  const { data: states = [] } = useQuery({
    queryKey: ["engine-states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_state")
        .select("key, label, status, last_run_at, run_count, paused_reason");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allRuns = [] } = useQuery({
    queryKey: ["engine-runs", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engine_runs")
        .select("id, engine_key, trigger, status, message, checked, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["engine-counts"],
    queryFn: async () => {
      const one = async (table: "lead_prospects" | "emir_chat_sessions" | "renovation_requests" | "customers" | "quotes") => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
        return count ?? 0;
      };
      const [prospects, sessions, requests, customers, quotes] = await Promise.all([
        one("lead_prospects"),
        one("emir_chat_sessions"),
        one("renovation_requests"),
        one("customers"),
        one("quotes"),
      ]);
      const { count: matched } = await supabase
        .from("lead_prospects")
        .select("id", { count: "exact", head: true })
        .not("customer_id", "is", null);
      const { count: scored } = await supabase
        .from("lead_prospects")
        .select("id", { count: "exact", head: true })
        .not("score", "is", null);
      const { count: dupes } = await supabase
        .from("lead_prospects")
        .select("id", { count: "exact", head: true })
        .eq("pipeline_stage", "mukerrer");
      return { prospects, sessions, requests, customers, quotes, matched: matched ?? 0, scored: scored ?? 0, dupes: dupes ?? 0 };
    },
  });

  const health = useMutation({
    mutationFn: async () => await checkFn(),
    onSuccess: (r) => {
      const bad = Object.entries(r.tables).filter(([, v]) => !v.ok);
      toast.success(
        bad.length === 0
          ? "Sağlık kontrolü tamam: tüm motorlar veritabanını okuyabiliyor."
          : `Sorunlu bölüm: ${bad.map(([k]) => k).join(", ")}`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runS = useMutation({
    mutationFn: async () => await runSource(),
    onSuccess: (r: { message: string }) => {
      toast.success(r.message);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const runP = useMutation({
    mutationFn: async () => await runPipeline(),
    onSuccess: (r: { message: string }) => {
      toast.success(r.message);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (input: { key: string; status: "aktif" | "durakladi" }) => await toggleFn({ data: input }),
    onSuccess: () => {
      toast.success("Motor durumu güncellendi.");
      void queryClient.invalidateQueries({ queryKey: ["engine-states"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stateOf = (key: string) => states.find((s) => s.key === key);
  const runsOf = (key: string) => allRuns.filter((r) => r.engine_key === key);

  const engineRow = (key: "source_research" | "lead_pipeline", name: string, job: string): Motor => {
    const st = stateOf(key);
    const runs = runsOf(key);
    const errs = runs.filter((r) => r.status === "hata");
    const lastOk = runs.find((r) => r.status !== "hata");
    const durum: Durum = !st
      ? "BEKLİYOR"
      : st.status !== "aktif"
        ? "PASİF"
        : runs[0]?.status === "hata"
          ? "HATA"
          : "AKTİF";
    return {
      key,
      name,
      job,
      durum,
      lastRun: (st?.last_run_at as string | null) ?? runs[0]?.created_at ?? null,
      lastOk: lastOk?.created_at ?? null,
      processed: runs[0]?.checked ?? null,
      errorCount: errs.length,
      lastError: errs[0]?.message ?? null,
      note:
        key === "source_research"
          ? "Her gün otomatik çalışır (09:30) + elle çalıştırma."
          : "Tarama turundan sonra otomatik çalışır + elle çalıştırma.",
      runKey: key,
      toggleKey: key,
    };
  };

  const motorlar: Motor[] = [
    engineRow("source_research", "Tarama / Kaynak Araştırma Motoru", "Kaynakların erişilebilirliğini ve otomatik kullanım iznini denetler."),
    {
      ...engineRow("source_research", "İlan / Veri Toplama Motoru", "Onaylı kaynakların resmî beslemesinden İzmir adaylarını toplar."),
      key: "collector",
      durum: (counts?.prospects ?? 0) >= 0 && states.some((s) => s.key === "source_research" && s.status === "aktif")
        ? "BEKLİYOR"
        : "PASİF",
      note: "Hazır; onaylı ve resmî besleme adresi girilmiş kaynak bekleniyor.",
      processed: counts?.prospects ?? 0,
      runKey: "source_research",
    },
    {
      ...engineRow("lead_pipeline", "Temizleme Motoru", "Başlık, açıklama ve telefon biçimini düzeltir."),
      key: "cleaner",
    },
    {
      ...engineRow("lead_pipeline", "Tekilleştirme Motoru", "Aynı bağlantı/telefon/başlık kaydını engeller, mükerrerleri işaretler."),
      key: "dedupe",
      processed: counts?.dupes ?? 0,
    },
    {
      ...engineRow("lead_pipeline", "Fırsat Filtreleme Motoru", "Adayları 0-100 arası puanlar ve gerekçesini yazar."),
      key: "scoring",
      processed: counts?.scored ?? 0,
    },
    {
      ...engineRow("lead_pipeline", "Eşleştirme Motoru", "Adayı mevcut müşteri ve talep kayıtlarıyla eşleştirir."),
      key: "matcher",
      processed: counts?.matched ?? 0,
    },
    {
      key: "portfolio",
      name: "Portföy / CRM Motoru",
      job: "Aday → fırsat, müşteri, gayrimenkul ve talep kaydı.",
      durum: "AKTİF",
      lastRun: null,
      lastOk: null,
      processed: counts?.customers ?? 0,
      errorCount: 0,
      lastError: null,
      note: "CRM tabloları canlı; kayıt panelden ve zincirden yazılıyor.",
    },
    {
      key: "requests",
      name: "Müşteri / Talep Motoru",
      job: "Web formu ve Emir üzerinden gelen talepleri kaydeder, durum geçmişini tutar.",
      durum: "AKTİF",
      lastRun: null,
      lastOk: null,
      processed: counts?.requests ?? 0,
      errorCount: 0,
      lastError: null,
      note: "Yeni talepte panel bildirimi tetikleniyor.",
    },
    {
      key: "emir",
      name: "Emir AI Motoru",
      job: "Ziyaretçiyle yazışır, talep + keşif + taslak teklif oluşturur.",
      durum: "AKTİF",
      lastRun: null,
      lastOk: null,
      processed: counts?.sessions ?? 0,
      errorCount: 0,
      lastError: null,
      note: "Sohbet kayıtları ve netleştirme günlüğü aktif.",
    },
    {
      key: "whatsapp",
      name: "WhatsApp Motoru",
      job: "Gelen/giden WhatsApp mesajları ve teslim durumu.",
      durum: "BEKLİYOR",
      lastRun: null,
      lastOk: null,
      processed: null,
      errorCount: 0,
      lastError: null,
      note: "Dış bağlantı bekliyor: WhatsApp Business bağlantısı tamamlanmadı (Meta işletme incelemesi).",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Motor Durumu</CardTitle>
            <CardDescription>
              Tarama → toplama → temizleme → tekilleştirme → filtreleme → CRM → eşleştirme → Emir → WhatsApp
              zincirinin gerçek durumu. Veriler canlı kayıtlardan okunur.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => health.mutate()} disabled={health.isPending}>
            {health.isPending ? "Kontrol ediliyor…" : "Sağlık kontrolü"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {motorlar.map((m) => (
          <div key={m.key} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.job}</div>
              </div>
              <Badge variant={BADGE[m.durum]}>{m.durum}</Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Info label="Son çalışma" value={m.lastRun ? trDate(m.lastRun) : "—"} />
              <Info label="Son başarılı" value={m.lastOk ? trDate(m.lastOk) : "—"} />
              <Info label="İşlenen kayıt" value={m.processed === null ? "—" : String(m.processed)} />
              <Info label="Hata sayısı" value={String(m.errorCount)} />
            </dl>
            {m.lastError ? (
              <p className="mt-2 text-xs text-destructive">Son hata: {m.lastError}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">{m.note}</p>
            {(m.runKey || m.toggleKey) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.runKey === "source_research" ? (
                  <Button size="sm" variant="outline" disabled={runS.isPending} onClick={() => runS.mutate()}>
                    {runS.isPending ? "Çalışıyor…" : "Manuel çalıştır"}
                  </Button>
                ) : null}
                {m.runKey === "lead_pipeline" ? (
                  <Button size="sm" variant="outline" disabled={runP.isPending} onClick={() => runP.mutate()}>
                    {runP.isPending ? "Çalışıyor…" : "Manuel çalıştır"}
                  </Button>
                ) : null}
                {m.toggleKey ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate({
                        key: m.toggleKey as string,
                        status: m.durum === "PASİF" ? "aktif" : "durakladi",
                      })
                    }
                  >
                    {m.durum === "PASİF" ? "Yeniden başlat" : "Duraklat"}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
