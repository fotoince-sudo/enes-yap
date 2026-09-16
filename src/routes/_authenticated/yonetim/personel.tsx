import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/personel")({
  component: Staff,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
};
type RoleRow = { id: string; user_id: string; role: string };
type Invite = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  accepted_at: string | null;
  created_at: string;
};

function Staff() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [origin, setOrigin] = useState("");
  const [form, setForm] = useState({ email: "", full_name: "", role: "personel" });
  useEffect(() => setOrigin(window.location.origin), []);
  const inviteLink = `${origin}/auth?kayit=1`;

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at, last_login_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const { data: invites = [] } = useQuery({
    queryKey: ["staff-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invites")
        .select("id, email, full_name, role, accepted_at, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });

  const addInvite = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Geçerli bir e-posta adresi yazın.");
      const { error } = await supabase.from("staff_invites").insert({
        email,
        full_name: form.full_name.trim() || null,
        role: form.role as never,
      });
      if (error) throw new Error(error.code === "23505" ? "Bu e-posta zaten listede." : error.message);
    },
    onSuccess: () => {
      toast.success("E-posta listeye eklendi. Kişi kayıt olduğunda yetkisi otomatik verilir.");
      setForm({ email: "", full_name: "", role: "personel" });
      queryClient.invalidateQueries({ queryKey: ["staff-invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kayıt listeden çıkarıldı.");
      queryClient.invalidateQueries({ queryKey: ["staff-invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
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
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Aşağıdaki kayıt bağlantısını personelinize WhatsApp veya e-posta ile gönderin.</li>
            <li>Kişi ad soyad, kendi e-postası ve şifresiyle kayıt olur.</li>
            <li>Gelen onay e-postasındaki bağlantıya tıklar ve panele giriş yapar.</li>
            <li>Bu listede “Aktif” olarak görünür; siz de rolünü seçip yetki verirsiniz.</li>
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={inviteLink}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    toast.success("Kayıt bağlantısı kopyalandı.");
                  } catch {
                    toast.error("Bağlantı kopyalanamadı, elle seçip kopyalayın.");
                  }
                }}
              >
                Bağlantıyı kopyala
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const text = `Enes Yapı yönetim paneline personel kaydı: ${inviteLink} — ad soyad, e-posta ve şifrenizle kayıt olup e-posta onayını tamamlayın.`;
                  try {
                    await navigator.clipboard.writeText(text);
                    toast.success("Davet mesajı kopyalandı.");
                  } catch {
                    toast.error("Mesaj kopyalanamadı.");
                  }
                }}
              >
                Davet mesajını kopyala
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ekip e-postaları (davet listesi)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ekibinizin e-posta adreslerini ve vermek istediğiniz rolü şimdiden yazın. Kişi bu e-posta ile kayıt
            olduğunda rolü otomatik verilir ve aşağıdaki personel listesinde görünür.
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="inv-email">E-posta</Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="ad@ornek.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inv-name">Ad soyad (opsiyonel)</Label>
              <Input
                id="inv-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inv-role">Rol</Label>
              <select
                id="inv-role"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <Button className="w-full sm:w-auto" onClick={() => addInvite.mutate()} disabled={addInvite.isPending}>
                E-postayı listeye ekle
              </Button>
            </div>
          </div>

          {invites.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Ad soyad</TableHead>
                    <TableHead>Verilecek rol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="max-w-[220px] truncate">{inv.email}</TableCell>
                      <TableCell>{inv.full_name ?? "—"}</TableCell>
                      <TableCell>{ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] ?? inv.role}</TableCell>
                      <TableCell>
                        {inv.accepted_at ? (
                          <Badge variant="secondary">Kayıt oldu · {trDate(inv.accepted_at)}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Kayıt bekleniyor</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => removeInvite.mutate(inv.id)}>
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Kayıt</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Yetkiler</TableHead>
              <TableHead className="text-right">Yetki ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>Yükleniyor…</TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  Kayıtlı kullanıcı yok.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => {
                const mine = roles.filter((r) => r.user_id === p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[220px] truncate">{p.full_name ?? "—"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{p.email ?? "—"}</TableCell>
                    <TableCell>{p.phone ?? "—"}</TableCell>
                    <TableCell>{trDate(p.created_at)}</TableCell>
                    <TableCell>
                      {p.last_login_at ? (
                        <Badge variant="secondary">Aktif</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">E-posta onayı bekliyor</span>
                      )}
                    </TableCell>
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
