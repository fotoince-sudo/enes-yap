import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/tamamlanan-projeler")({
  component: CompletedProjects,
});

type Row = {
  id: string;
  project_no: number;
  title: string;
  actual_end_date: string | null;
  contract_total: number | null;
  is_public_reference: boolean;
};

function CompletedProjects() {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["completed-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_no, title, actual_end_date, contract_total, is_public_reference")
        .eq("status", "tamamlandi")
        .order("actual_end_date", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const togglePublish = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from("projects")
        .update({ is_public_reference: !row.is_public_reference })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yayın durumu güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["completed-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tamamlanan Projeler</h1>
        <p className="text-sm text-muted-foreground">
          Tamamlandı olarak işaretlenen işler. Yayında olanlar web sitesindeki "Tamamlanan projeler" bölümünde görünür.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Sözleşme</TableHead>
              <TableHead>Yayın</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Yükleniyor…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Tamamlanan proje yok.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>#{row.project_no}</TableCell>
                  <TableCell className="max-w-[260px] truncate">{row.title}</TableCell>
                  <TableCell>{trDate(row.actual_end_date)}</TableCell>
                  <TableCell>{tl(row.contract_total)}</TableCell>
                  <TableCell>
                    <Badge variant={row.is_public_reference ? "default" : "secondary"}>
                      {row.is_public_reference ? "Yayında" : "Gizli"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(row)}>
                      {row.is_public_reference ? "Gizle" : "Yayınla"}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/yonetim/projeler/$id" params={{ id: row.id }}>
                        Detay
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
