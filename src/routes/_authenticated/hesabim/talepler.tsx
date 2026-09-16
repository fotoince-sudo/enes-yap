import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/hesabim/talepler")({
  component: CustomerRequests,
});

function CustomerRequests() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renovation_requests")
        .select(
          "id, renovation_type, property_type, status, area_m2, budget_range, desired_start, description, city, district, neighborhood, address, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error) return <p className="text-sm text-destructive">Talepleriniz yüklenemedi: {error.message}</p>;
  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground">Bu e-posta ile oluşturulmuş bir tadilat talebi bulunmuyor.</p>;

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {r.renovation_type || "Tadilat talebi"}
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS] ?? r.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Talep tarihi: {trDate(r.created_at)}</p>
            <p>
              Konum: {[r.neighborhood, r.district, r.city].filter(Boolean).join(" / ") || "—"}
              {r.address ? ` · ${r.address}` : ""}
            </p>
            <p>
              {[
                r.property_type,
                r.area_m2 ? `${r.area_m2} m²` : null,
                r.budget_range,
                r.desired_start,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
            {r.description ? <p className="text-foreground">{r.description}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
