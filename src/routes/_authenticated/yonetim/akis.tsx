import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_STATUS, QUOTE_STATUS, REQUEST_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/akis")({
  component: Pipeline,
  errorComponent: ({ error }) => <p className="text-sm text-destructive">Akış yüklenemedi: {error.message}</p>,
});

type Card_ = {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  date: string | null;
  to: "/yonetim/talepler/$id" | "/yonetim/teklifler/$id" | "/yonetim/projeler/$id";
};

const NEW_STATUSES = ["yeni", "inceleniyor", "gorusuldu"] as const;
const SURVEY_STATUSES = ["kesif_planlandi", "kesif_yapildi"] as const;

function Pipeline() {
  const { data: requests = [], isLoading: l1 } = useQuery({
    queryKey: ["pipeline-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renovation_requests")
        .select("id, full_name, city, district, renovation_type, status, created_at, area_m2")
        .in("status", [...NEW_STATUSES, ...SURVEY_STATUSES])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: quotes = [], isLoading: l2 } = useQuery({
    queryKey: ["pipeline-quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, quote_no, title, status, grand_total, created_at, customers(full_name)")
        .not("status", "in", "(kabul,red)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: projects = [], isLoading: l3 } = useQuery({
    queryKey: ["pipeline-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_no, title, status, contract_total, start_date, actual_end_date, customers(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading = l1 || l2 || l3;

  const requestCard = (r: (typeof requests)[number]): Card_ => ({
    id: r.id,
    title: r.full_name,
    subtitle: [r.district, r.city, r.renovation_type, r.area_m2 ? `${r.area_m2} m²` : null]
      .filter(Boolean)
      .join(" · "),
    statusLabel: REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS] ?? r.status,
    date: r.created_at,
    to: "/yonetim/talepler/$id",
  });

  const quoteCards: Card_[] = quotes.map((q) => ({
    id: q.id,
    title: `Teklif #${q.quote_no}${q.title ? ` — ${q.title}` : ""}`,
    subtitle: [(q.customers as { full_name: string } | null)?.full_name, tl(q.grand_total)].filter(Boolean).join(" · "),
    statusLabel: QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS] ?? q.status,
    date: q.created_at,
    to: "/yonetim/teklifler/$id",
  }));

  const projectCard = (p: (typeof projects)[number]): Card_ => ({
    id: p.id,
    title: `Proje #${p.project_no}${p.title ? ` — ${p.title}` : ""}`,
    subtitle: [(p.customers as { full_name: string } | null)?.full_name, tl(p.contract_total)]
      .filter(Boolean)
      .join(" · "),
    statusLabel: PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] ?? p.status,
    date: p.actual_end_date ?? p.start_date,
    to: "/yonetim/projeler/$id",
  });

  const columns: { key: string; label: string; hint: string; cards: Card_[] }[] = [
    {
      key: "yeni",
      label: "1. Yeni talep",
      hint: "Yeni, inceleniyor, iletişim kuruldu",
      cards: requests.filter((r) => (NEW_STATUSES as readonly string[]).includes(r.status)).map(requestCard),
    },
    {
      key: "kesif",
      label: "2. Keşif",
      hint: "Keşif planlandı / yapıldı",
      cards: requests.filter((r) => (SURVEY_STATUSES as readonly string[]).includes(r.status)).map(requestCard),
    },
    {
      key: "teklif",
      label: "3. Teklif",
      hint: "Hazırlanan ve gönderilen teklifler",
      cards: quoteCards,
    },
    {
      key: "proje",
      label: "4. Proje",
      hint: "Devam eden uygulamalar",
      cards: projects.filter((p) => p.status !== "tamamlandi" && p.status !== "iptal").map(projectCard),
    },
    {
      key: "tamamlandi",
      label: "5. Tamamlandı",
      hint: "Bitirilen projeler",
      cards: projects.filter((p) => p.status === "tamamlandi").map(projectCard),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">İş Akışı</h1>
        <p className="text-sm text-muted-foreground">
          Yeni talep → Keşif → Teklif → Proje → Tamamlandı. Her kart ilgili kaydın detayına gider; durumu detay
          sayfasından değiştirdiğinizde kart bir sonraki adıma geçer.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((col) => (
            <Card key={col.key} className="min-w-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  <span>{col.label}</span>
                  <Badge variant="secondary">{col.cards.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{col.hint}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {col.cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Kayıt yok.</p>
                ) : (
                  col.cards.map((c) => (
                    <Link
                      key={c.id}
                      to={c.to}
                      params={{ id: c.id }}
                      className="block rounded-md border bg-background p-3 transition-colors hover:bg-accent"
                    >
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      {c.subtitle ? <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p> : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.statusLabel} · {trDate(c.date)}
                      </p>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
