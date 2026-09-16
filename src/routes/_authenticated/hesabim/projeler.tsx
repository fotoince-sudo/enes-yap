import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTO_PHASE, PROJECT_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/hesabim/projeler")({
  component: CustomerProjects,
});

function CustomerProjects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-projects"],
    queryFn: async () => {
      const { data: projects, error: pErr } = await supabase
        .from("projects")
        .select(
          "id, project_no, title, status, scope, contract_total, paid_total, payment_status, start_date, estimated_end_date, actual_end_date, notes, created_at",
        )
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const { data: photos, error: phErr } = await supabase
        .from("project_photos")
        .select("id, project_id, phase, url, caption")
        .order("created_at");
      if (phErr) throw phErr;
      return { projects: projects ?? [], photos: photos ?? [] };
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error) return <p className="text-sm text-destructive">Projeleriniz yüklenemedi: {error.message}</p>;
  if (!data || data.projects.length === 0)
    return <p className="text-sm text-muted-foreground">Henüz başlamış bir projeniz bulunmuyor.</p>;

  return (
    <div className="space-y-4">
      {data.projects.map((p) => {
        const photos = data.photos.filter((ph) => ph.project_id === p.id);
        return (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Proje #{p.project_no} · {p.title}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS] ?? p.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {p.scope ? <p className="text-foreground">{p.scope}</p> : null}
              <p>
                Başlangıç: {trDate(p.start_date)} · Tahmini bitiş: {trDate(p.estimated_end_date)}
                {p.actual_end_date ? ` · Bitiş: ${trDate(p.actual_end_date)}` : ""}
              </p>
              <p>
                Sözleşme tutarı: {tl(p.contract_total)} · Ödenen: {tl(p.paid_total)}
              </p>
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photos.map((ph) => (
                    <figure key={ph.id} className="space-y-1">
                      <img
                        src={ph.url}
                        alt={ph.caption || `${p.title} — ${PHOTO_PHASE[ph.phase as keyof typeof PHOTO_PHASE] ?? ""}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      <figcaption className="text-xs">
                        {PHOTO_PHASE[ph.phase as keyof typeof PHOTO_PHASE] ?? ""}
                        {ph.caption ? ` · ${ph.caption}` : ""}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : null}
              {p.notes ? <p>Not: {p.notes}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
