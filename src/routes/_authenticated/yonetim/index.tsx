import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/")({
  component: Dashboard,
});

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const count = async (table: string, apply?: (q: any) => any) => {
        let q = (supabase.from(table as never) as any).select("id", { count: "exact", head: true });
        if (apply) q = apply(q);
        const { count: c, error } = await q;
        if (error) throw error;
        return c ?? 0;
      };

      const [
        newRequests,
        activeSurveys,
        pendingQuotes,
        sentQuotes,
        newOpportunities,
        activeProjects,
        completedProjects,
        quotesSum,
        projectsSum,
        upcomingSurveys,
        latestRequests,
      ] = await Promise.all([
        count("renovation_requests", (q) => q.eq("status", "yeni")),
        count("surveys", (q) => q.eq("is_done", false)),
        count("renovation_requests", (q) => q.in("status", ["kesif_yapildi", "teklif_hazirlaniyor"])),
        count("quotes", (q) => q.in("status", ["gonderildi", "musteri_inceliyor", "revizyon"])),
        count("opportunities", (q) => q.in("status", ["yeni", "incelenecek", "iletisim_kurulacak"])),
        count("projects", (q) =>
          q.in("status", ["planlandi", "hazirlik", "malzeme_bekleniyor", "basladi", "devam", "kontrol", "beklemede"]),
        ),
        count("projects", (q) => q.eq("status", "tamamlandi")),
        supabase.from("quotes").select("grand_total"),
        supabase.from("projects").select("contract_total"),
        supabase
          .from("surveys")
          .select("id, scheduled_date, scheduled_time, address, responsible_name")
          .eq("is_done", false)
          .order("scheduled_date", { ascending: true })
          .limit(5),
        supabase
          .from("renovation_requests")
          .select("id, full_name, city, district, renovation_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      return {
        newRequests,
        activeSurveys,
        pendingQuotes,
        sentQuotes,
        newOpportunities,
        activeProjects,
        completedProjects,
        quotesTotal: (quotesSum.data ?? []).reduce((s, q) => s + Number(q.grand_total ?? 0), 0),
        projectsTotal: (projectsSum.data ?? []).reduce((s, p) => s + Number(p.contract_total ?? 0), 0),
        upcomingSurveys: upcomingSurveys.data ?? [],
        latestRequests: latestRequests.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Enes Yapı iş akışının güncel durumu.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Yeni talepler" value={data.newRequests} />
        <Stat label="Bekleyen keşifler" value={data.activeSurveys} />
        <Stat label="Teklif bekleyen işler" value={data.pendingQuotes} />
        <Stat label="Teklif verilen işler" value={data.sentQuotes} />
        <Stat label="Yeni tadilat fırsatları" value={data.newOpportunities} />
        <Stat label="Devam eden projeler" value={data.activeProjects} />
        <Stat label="Tamamlanan projeler" value={data.completedProjects} />
        <Stat label="Toplam teklif tutarı" value={tl(data.quotesTotal)} />
        <Stat label="Toplam proje tutarı" value={tl(data.projectsTotal)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son talepler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.latestRequests.length === 0 ? (
              <p className="text-muted-foreground">Henüz talep yok.</p>
            ) : (
              data.latestRequests.map((r) => (
                <Link
                  key={r.id}
                  to="/yonetim/talepler/$id"
                  params={{ id: r.id }}
                  className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent"
                >
                  <span className="truncate">
                    {r.full_name} — {r.renovation_type ?? "—"}
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.district ?? ""} {r.city ?? ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS]}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Yaklaşan keşifler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.upcomingSurveys.length === 0 ? (
              <p className="text-muted-foreground">Planlanmış keşif yok.</p>
            ) : (
              data.upcomingSurveys.map((s) => (
                <div key={s.id} className="rounded-md px-2 py-2 hover:bg-accent">
                  <p>
                    {trDate(s.scheduled_date)} {s.scheduled_time ?? ""} — {s.address ?? "Adres girilmedi"}
                  </p>
                  <p className="text-xs text-muted-foreground">Sorumlu: {s.responsible_name ?? "—"}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
