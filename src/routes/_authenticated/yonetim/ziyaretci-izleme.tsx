import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/yonetim/ziyaretci-izleme")({
  component: ZiyaretciIzlemePage,
});

type ChatMsg = { role?: string; content?: string; at?: string | null };

function parseMessages(value: unknown): ChatMsg[] {
  return Array.isArray(value) ? (value as ChatMsg[]) : [];
}

function trDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
}

function duration(startIso: string, endIso?: string | null) {
  if (!endIso) return { label: "—", minutes: 0 };
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return { label: "< 1 dk", minutes: 0 };
  const sec = Math.round((end - start) / 1000);
  const minutes = Math.floor(sec / 60);
  return {
    label: minutes > 0 ? `${minutes} dk ${sec % 60} sn` : `${sec} sn`,
    minutes: sec / 60,
  };
}

const STATUS_LABELS: Record<string, string> = {
  sohbet: "Sohbet",
  "talep-olusturuldu": "Talep oluşturuldu",
  "kesif-talebi": "Keşif talebi",
};

function ZiyaretciIzlemePage() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["visitor-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emir_chat_sessions")
        .select(
          "id, created_at, updated_at, status, messages, message_count, wants_survey, summary, request_id, survey_id, quote_id, stop_reason",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = sessions.map((s) => {
    const msgs = parseMessages(s.messages);
    const times = msgs.map((m) => m.at).filter((v): v is string => Boolean(v));
    const lastAt = times.length > 0 ? times[times.length - 1]! : s.updated_at;
    const d = duration(s.created_at, lastAt);
    return {
      ...s,
      visitorMessages: msgs.filter((m) => m.role === "user").length,
      lastAt,
      durationLabel: d.label,
      durationMinutes: d.minutes,
      transferred: Boolean(s.request_id),
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter((r) => r.created_at.slice(0, 10) === today).length;
  const transferred = rows.filter((r) => r.transferred).length;
  const withQuote = rows.filter((r) => r.quote_id).length;
  const avgMinutes =
    rows.length > 0 ? rows.reduce((sum, r) => sum + r.durationMinutes, 0) / rows.length : 0;
  const conversion = rows.length > 0 ? Math.round((transferred / rows.length) * 100) : 0;

  const stats = [
    { label: "Toplam ziyaretçi sohbeti", value: String(rows.length) },
    { label: "Bugün giren ziyaretçi", value: String(todayCount) },
    { label: "Talebe dönüşen", value: `${transferred} (%${conversion})` },
    { label: "Ortalama sohbet süresi", value: avgMinutes >= 1 ? `${avgMinutes.toFixed(1)} dk` : "< 1 dk" },
    { label: "Teklif akışına geçen", value: String(withQuote) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ziyaretçi İzleme</h1>
        <p className="text-sm text-muted-foreground">
          Siteye giriş tarihi, Emir ile sohbet süresi ve talebe aktarım durumu.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ziyaretçi hareketleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz ziyaretçi sohbeti yok.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="space-y-2 rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={r.transferred ? "default" : "secondary"}>
                    {r.transferred ? "Talebe aktarıldı" : (STATUS_LABELS[r.status] ?? r.status)}
                  </Badge>
                  {r.wants_survey ? <Badge variant="outline">Keşif istedi</Badge> : null}
                  {r.quote_id ? <Badge variant="outline">Taslak teklif hazır</Badge> : null}
                  {r.stop_reason ? <Badge variant="outline">Akış durduruldu</Badge> : null}
                </div>

                <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Siteye giriş: {trDateTime(r.created_at)}</span>
                  <span>Son mesaj: {trDateTime(r.lastAt)}</span>
                  <span>Sohbet süresi: {r.durationLabel}</span>
                  <span>
                    Mesaj: {r.message_count} (ziyaretçi {r.visitorMessages})
                  </span>
                </div>

                {r.summary ? <p className="whitespace-pre-wrap">{r.summary}</p> : null}

                {r.request_id ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/yonetim/talepler/$id" params={{ id: r.request_id }}>
                      Talebi ve sohbet akışını aç
                    </Link>
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Bu sohbet henüz talebe dönüşmedi.</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
