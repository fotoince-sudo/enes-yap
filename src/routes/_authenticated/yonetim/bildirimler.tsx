import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/yonetim/bildirimler")({
  component: Notifications,
});

type Notification = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
};

function Notifications() {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, kind, entity_type, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bildirimler</h1>
        <p className="text-sm text-muted-foreground">
          Panel içi bildirimler. WhatsApp, SMS ve e-posta gönderimi ileride bu altyapıya bağlanacak.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bildirim yok</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Yeni talep, keşif ve teklif hareketleri burada listelenecek.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {n.title}
                  {!n.is_read ? <Badge>Yeni</Badge> : null}
                </p>
                {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("tr-TR")}</p>
              </div>
              {!n.is_read ? (
                <Button size="sm" variant="outline" onClick={() => markRead.mutate(n.id)}>
                  Okundu
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
