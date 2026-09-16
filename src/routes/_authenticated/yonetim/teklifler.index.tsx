import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUOTE_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/teklifler/")({
  component: QuoteList,
});

function QuoteList() {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, quote_no, title, status, grand_total, valid_until, created_at, customers(full_name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("quotes").insert({ title: "Yeni teklif" }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      toast.success("Boş teklif oluşturuldu.");
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teklifler</h1>
          <p className="text-sm text-muted-foreground">Teklif kalemleri, iskonto ve KDV teklif detayında hesaplanır.</p>
        </div>
        <Button onClick={() => create.mutate()}>Yeni teklif</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Genel toplam</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Yükleniyor…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Teklif yok.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>#{q.quote_no}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{q.title ?? "—"}</TableCell>
                  <TableCell>{(q.customers as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS]}</Badge>
                  </TableCell>
                  <TableCell>{tl(q.grand_total)}</TableCell>
                  <TableCell className="whitespace-nowrap">{trDate(q.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/yonetim/teklifler/$id" params={{ id: q.id }}>
                        Aç
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
