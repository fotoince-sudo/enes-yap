import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REQUEST_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/talepler")({
  component: RequestList,
});

function RequestList() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["requests", status],
    queryFn: async () => {
      let q = supabase
        .from("renovation_requests")
        .select("id, full_name, phone, city, district, renovation_type, area_m2, budget_range, status, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (status) q = q.eq("status", status as never);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = rows.filter((r) =>
    [r.full_name, r.phone, r.city, r.district, r.renovation_type]
      .map((v) => String(v ?? "").toLowerCase())
      .some((v) => v.includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tadilat Talepleri</h1>
          <p className="text-sm text-muted-foreground">Web sitesinden ve elle girilen tüm talepler.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara…" className="w-40 sm:w-56" />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tüm durumlar</option>
            {Object.entries(REQUEST_STATUS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>Tadilat türü</TableHead>
              <TableHead>m²</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>Yükleniyor…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground">
                  Talep bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{trDate(r.created_at)}</TableCell>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                  <TableCell>
                    {r.district ?? ""} {r.city ?? ""}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{r.renovation_type ?? "—"}</TableCell>
                  <TableCell>{r.area_m2 ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "yeni" ? "default" : "secondary"}>
                      {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/yonetim/talepler/$id" params={{ id: r.id }}>
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
