import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PROJECT_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/projeler")({
  component: ProjectList,
});

function ProjectList() {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_no, title, status, contract_total, cost_total, start_date, estimated_end_date, customers(full_name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({ title: "Yeni proje" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proje oluşturuldu.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projeler / İşler</h1>
          <p className="text-sm text-muted-foreground">
            Onaylanan teklifler proje kaydına dönüşür; ekipler, maliyet ve fotoğraflar proje içinde takip edilir.
          </p>
        </div>
        <Button onClick={() => create.mutate()}>Yeni proje</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sözleşme</TableHead>
              <TableHead>Maliyet</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Yükleniyor…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Proje yok.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>#{p.project_no}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{p.title}</TableCell>
                  <TableCell>{(p.customers as { full_name: string } | null)?.full_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{PROJECT_STATUS[p.status as keyof typeof PROJECT_STATUS]}</Badge>
                  </TableCell>
                  <TableCell>{tl(p.contract_total)}</TableCell>
                  <TableCell>{tl(p.cost_total)}</TableCell>
                  <TableCell className="whitespace-nowrap">{trDate(p.start_date)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/yonetim/projeler/$id" params={{ id: p.id }}>
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
