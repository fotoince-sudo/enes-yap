import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ACTIVITY_TYPES } from "@/lib/domain";
import { fetchActivities, logActivity, type ActivityEntity } from "@/lib/activity";

/** Müşteri, gayrimenkul, talep, keşif, teklif ve proje kayıtları için ortak işlem geçmişi. */
export function ActivityPanel({ entity, entityId }: { entity: ActivityEntity; entityId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [type, setType] = useState<string>("note");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["activity", entity, entityId],
    queryFn: () => fetchActivities(entity, entityId),
  });

  const add = useMutation({
    mutationFn: () => logActivity({ entity, entityId, type, note: note.trim() || null }),
    onSuccess: () => {
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["activity", entity, entityId] });
      toast.success("İşlem kaydedildi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">İşlem geçmişi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {Object.entries(ACTIVITY_TYPES)
              .filter(([k]) => k !== "status_change")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Not / açıklama" />
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>
            İşlemi kaydet
          </Button>
        </div>

        <div className="space-y-2 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground">Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">Henüz işlem kaydı yok.</p>
          ) : (
            rows.map((a) => (
              <div key={a.id} className="rounded-md border p-2">
                <p className="font-medium">
                  {ACTIVITY_TYPES[a.activity_type as keyof typeof ACTIVITY_TYPES] ?? a.activity_type}
                  {a.old_status || a.new_status ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {a.old_status ?? "—"} → {a.new_status ?? "—"}
                    </span>
                  ) : null}
                </p>
                {a.note ? <p className="text-muted-foreground">{a.note}</p> : null}
                <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("tr-TR")}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
