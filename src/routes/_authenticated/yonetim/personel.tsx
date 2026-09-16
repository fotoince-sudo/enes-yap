import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/personel")({
  component: Staff,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
};
type RoleRow = { id: string; user_id: string; role: string };

function Staff() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string>>({});

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at, last_login_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as never });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yetki verildi.");
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Yetki kaldırıldı.");
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Personel</h1>
        <p className="text-sm text-muted-foreground">
          Panele giriş yapan kişilere yetki verin. Yönetici tüm kayıtları görür; personel yalnızca kendisine atanan
          talep, keşif, proje ve fırsatları görür.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni personel nasıl eklenir?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kişi önce <span className="font-medium">Personel girişi</span> ekranından kendi e-postasıyla kayıt olur.
          Ardından aşağıdaki listede görünür ve buradan yetkilendirilir.
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad soyad</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Kayıt</TableHead>
              <TableHead>Yetkiler</TableHead>
              <TableHead className="text-right">Yetki ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>Yükleniyor…</TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  Kayıtlı kullanıcı yok.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => {
                const mine = roles.filter((r) => r.user_id === p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[220px] truncate">{p.full_name ?? "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{trDate(p.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mine.length === 0 ? (
                          <span className="text-muted-foreground text-sm">Yetki yok</span>
                        ) : (
                          mine.map((r) => (
                            <Badge
                              key={r.id}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => {
                                if (confirm("Bu yetkiyi kaldırmak istiyor musunuz?")) removeRole.mutate(r.id);
                              }}
                            >
                              {ROLE_LABELS[r.role as keyof typeof ROLE_LABELS] ?? r.role} ✕
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={selected[p.id] ?? ""}
                          onChange={(e) => setSelected({ ...selected, [p.id]: e.target.value })}
                        >
                          <option value="">Rol seçin</option>
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!selected[p.id]}
                          onClick={() => addRole.mutate({ userId: p.id, role: selected[p.id]! })}
                        >
                          Ekle
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
