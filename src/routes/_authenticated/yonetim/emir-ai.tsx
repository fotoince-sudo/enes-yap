import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/emir-ai")({
  component: EmirAiPage,
});

function EmirAiPage() {
  const { data: sessions = [] } = useQuery({
    queryKey: ["emir-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emir_chat_sessions")
        .select("id, summary, wants_survey, status, request_id, message_count, created_at, flags, stop_reason, last_flag_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["emir-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renovation_requests")
        .select(
          "id, full_name, phone, district, neighborhood, renovation_type, property_type, area_m2, status, created_at",
        )
        .eq("source", "web-emir")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayChats = sessions.filter((s) => s.created_at.slice(0, 10) === today).length;
  const newRequests = requests.filter((r) => r.status === "yeni").length;
  const incomplete = requests.filter((r) => !r.district || !r.renovation_type || !r.area_m2);
  const surveyRequests = sessions.filter((s) => s.wants_survey).length;
  const waiting = requests.filter((r) => r.status === "yeni" || r.status === "inceleniyor").length;

  const flagged = sessions
    .map((s) => ({ session: s, flags: parseFlags(s.flags) }))
    .filter((x) => x.flags.length > 0 || x.session.stop_reason);

  const stats = [
    { label: "Bugünkü sohbet", value: todayChats },
    { label: "Yeni müşteri talebi", value: newRequests },
    { label: "Eksik bilgili talep", value: incomplete.length },
    { label: "Keşif talebi", value: surveyRequests },
    { label: "Dönüş bekleyen", value: waiting },
    { label: "Anlama sorunu", value: flagged.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Emir AI · Site Asistanı</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site ziyaretçileriyle yapılan sohbetler ve Emir'in oluşturduğu talepler (kaynak: WEB / EMİR).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emir'in oluşturduğu son talepler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz Emir üzerinden talep oluşmadı.</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link to="/yonetim/talepler/$id" params={{ id: r.id }} className="font-medium hover:text-primary">
                    #{r.id.slice(0, 8).toUpperCase()} · {r.full_name}
                  </Link>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS]}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {[r.renovation_type, r.property_type, r.district, r.neighborhood, r.area_m2 ? `${r.area_m2} m²` : null]
                    .filter(Boolean)
                    .join(" · ") || "Bilgi girilmedi"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.phone} · {trDate(r.created_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son sohbetler ve özetleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz sohbet kaydı yok.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{trDate(s.created_at)}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {s.wants_survey ? "Keşif talebi" : s.request_id ? "Talep oluşturuldu" : "Sohbet"}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{s.summary ?? "Özet oluşmadı (talep kaydedilmedi)."}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.message_count} mesaj</p>
                {s.request_id ? (
                  <Link
                    to="/yonetim/talepler/$id"
                    params={{ id: s.request_id }}
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    Talebi aç
                  </Link>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {incomplete.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eksik bilgi bulunan talepler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {incomplete.map((r) => (
              <Link
                key={r.id}
                to="/yonetim/talepler/$id"
                params={{ id: r.id }}
                className="block rounded-lg border p-3 text-sm hover:bg-accent"
              >
                <span className="font-medium">{r.full_name}</span>
                <span className="ml-2 text-muted-foreground">
                  Eksik: {[!r.district && "ilçe", !r.renovation_type && "iş türü", !r.area_m2 && "m²"].filter(Boolean).join(", ")}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
