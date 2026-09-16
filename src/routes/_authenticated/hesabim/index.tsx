import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_STATUS, QUOTE_STATUS, REQUEST_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/hesabim/")({
  component: CustomerHome,
});

function CustomerHome() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-summary"],
    queryFn: async () => {
      const [requests, quotes, projects] = await Promise.all([
        supabase
          .from("renovation_requests")
          .select("id, renovation_type, status, created_at, district, city")
          .order("created_at", { ascending: false }),
        supabase.from("quotes").select("id, quote_no, title, status, grand_total, created_at").order("created_at", {
          ascending: false,
        }),
        supabase.from("projects").select("id, project_no, title, status, created_at").order("created_at", {
          ascending: false,
        }),
      ]);
      if (requests.error) throw requests.error;
      if (quotes.error) throw quotes.error;
      if (projects.error) throw projects.error;
      return { requests: requests.data ?? [], quotes: quotes.data ?? [], projects: projects.data ?? [] };
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error) return <p className="text-sm text-destructive">Kayıtlarınız yüklenemedi: {error.message}</p>;

  const empty = !data || (data.requests.length === 0 && data.quotes.length === 0 && data.projects.length === 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Taleplerim</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data?.requests.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Tekliflerim</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data?.quotes.length ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Projelerim</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{data?.projects.length ?? 0}</CardContent>
        </Card>
      </div>

      {empty ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Henüz kaydınız görünmüyor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Talep, teklif ve projeleriniz, giriş yaptığınız e-posta ile eşleşen kayıtlar oluşturulduğunda burada
              listelenir.
            </p>
            <p>
              Sitedeki{" "}
              <Link to="/" className="underline">
                tadilat talebi formunu
              </Link>{" "}
              aynı e-posta ile doldurabilirsiniz.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {data && data.requests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son talepler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.requests.slice(0, 3).map((r) => (
              <div key={r.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  {r.renovation_type || "Tadilat talebi"} · {[r.district, r.city].filter(Boolean).join(" ")}
                </span>
                <span className="text-muted-foreground">
                  {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS] ?? r.status} · {trDate(r.created_at)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data && data.quotes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son teklifler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.quotes.slice(0, 3).map((q) => (
              <div key={q.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  Teklif #{q.quote_no} {q.title ? `· ${q.title}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS] ?? q.status} · {tl(q.grand_total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {data && data.projects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projelerim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                <span>
                  Proje #{p.project_no} · {p.title}
                </span>
                <span className="text-muted-foreground">
                  {PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] ?? p.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
