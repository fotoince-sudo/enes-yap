import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REQUEST_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/emir-talepleri")({
  component: EmirRequestList,
});

function EmirRequestList() {
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["emir-request-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renovation_requests")
        .select(
          "id, full_name, phone, city, district, neighborhood, property_type, renovation_type, area_m2, budget_range, status, created_at",
        )
        .eq("source", "web-emir")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["emir-request-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emir_chat_sessions")
        .select("id, request_id, summary, wants_survey")
        .not("request_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const byRequest = new Map(sessions.map((s) => [s.request_id as string, s]));

  const filtered = rows
    .filter((r) => (status ? r.status === status : true))
    .filter((r) =>
      [r.full_name, r.phone, r.city, r.district, r.neighborhood, r.renovation_type]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(search.toLowerCase())),
    );

  const newCount = rows.filter((r) => r.status === "yeni").length;
  const surveyCount = rows.filter((r) => byRequest.get(r.id)?.wants_survey).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter((r) => r.created_at.slice(0, 10) === today).length;

  const stats = [
    { label: "Toplam Emir talebi", value: rows.length },
    { label: "Yeni talep", value: newCount },
    { label: "Keşif isteyen", value: surveyCount },
    { label: "Bugün gelen", value: todayCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Emir Talepleri</h1>
          <p className="text-sm text-muted-foreground">
            Site asistanı Emir üzerinden gelen talepler (kaynak: WEB / EMİR).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara…"
            className="w-40 sm:w-56"
          />
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobil kart listesi */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Yükleniyor…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Emir üzerinden talep bulunamadı.</p>
        ) : (
          filtered.map((r) => {
            const s = byRequest.get(r.id);
            return (
              <div key={r.id} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.full_name}</span>
                  <Badge variant={r.status === "yeni" ? "default" : "secondary"}>
                    {REQUEST_STATUS[r.status as keyof typeof REQUEST_STATUS]}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {[r.renovation_type, r.property_type, r.district, r.neighborhood, r.area_m2 ? `${r.area_m2} m²` : null]
                    .filter(Boolean)
                    .join(" · ") || "Bilgi girilmedi"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.phone} · {trDate(r.created_at)}
                  {s?.wants_survey ? " · Keşif istiyor" : ""}
                </p>
                {s?.summary ? <p className="mt-2 text-xs text-muted-foreground">{s.summary}</p> : null}
                <Button size="sm" variant="outline" className="mt-3" asChild>
                  <Link to="/yonetim/talepler/$id" params={{ id: r.id }}>
                    Talebi aç
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Masaüstü tablo */}
      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>İş türü</TableHead>
              <TableHead>m²</TableHead>
              <TableHead>Keşif</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Detay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>Yükleniyor…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  Emir üzerinden talep bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{trDate(r.created_at)}</TableCell>
                  <TableCell>{r.full_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.phone}</TableCell>
                  <TableCell>
                    {r.district ?? ""} {r.neighborhood ?? ""}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">{r.renovation_type ?? "—"}</TableCell>
                  <TableCell>{r.area_m2 ?? "—"}</TableCell>
                  <TableCell>{byRequest.get(r.id)?.wants_survey ? "Evet" : "—"}</TableCell>
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
