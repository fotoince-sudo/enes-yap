import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_STATUS, QUOTE_STATUS, REQUEST_STATUS, tl } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/raporlar")({
  component: Reports,
});

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number; amount?: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {rows.every((r) => r.count === 0) ? (
          <p className="text-muted-foreground">Veri yok.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex justify-between border-b py-1 last:border-0">
              <span>{r.label}</span>
              <span className="text-muted-foreground">
                {r.count} {r.amount !== undefined ? `· ${tl(r.amount)}` : ""}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Reports() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [requests, quotes, projects] = await Promise.all([
        supabase.from("renovation_requests").select("status, renovation_type, city"),
        supabase.from("quotes").select("status, grand_total"),
        supabase.from("projects").select("status, contract_total, cost_total"),
      ]);
      return {
        requests: requests.data ?? [],
        quotes: quotes.data ?? [],
        projects: projects.data ?? [],
      };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;

  const requestRows = Object.entries(REQUEST_STATUS).map(([value, label]) => ({
    label,
    count: data.requests.filter((r) => r.status === value).length,
  }));

  const quoteRows = Object.entries(QUOTE_STATUS).map(([value, label]) => ({
    label,
    count: data.quotes.filter((q) => q.status === value).length,
    amount: data.quotes
      .filter((q) => q.status === value)
      .reduce((s, q) => s + Number(q.grand_total ?? 0), 0),
  }));

  const projectRows = Object.entries(PROJECT_STATUS).map(([value, label]) => ({
    label,
    count: data.projects.filter((p) => p.status === value).length,
    amount: data.projects
      .filter((p) => p.status === value)
      .reduce((s, p) => s + Number(p.contract_total ?? 0), 0),
  }));

  const cityCounts = new Map<string, number>();
  for (const r of data.requests) {
    const key = `${r.city ?? "Belirtilmedi"}`;
    cityCounts.set(key, (cityCounts.get(key) ?? 0) + 1);
  }

  const revenue = data.projects.reduce((s, p) => s + Number(p.contract_total ?? 0), 0);
  const cost = data.projects.reduce((s, p) => s + Number(p.cost_total ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-sm text-muted-foreground">Talep, teklif ve proje dağılımları ile basit maliyet analizi.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proje geliri (sözleşme)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{tl(revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proje maliyeti</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{tl(cost)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fark</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{tl(revenue - cost)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Talepler — durum dağılımı" rows={requestRows} />
        <Breakdown title="Teklifler — durum ve tutar" rows={quoteRows} />
        <Breakdown title="Projeler — durum ve tutar" rows={projectRows} />
        <Breakdown
          title="Talepler — il dağılımı"
          rows={[...cityCounts.entries()].map(([label, count]) => ({ label, count }))}
        />
      </div>
    </div>
  );
}
