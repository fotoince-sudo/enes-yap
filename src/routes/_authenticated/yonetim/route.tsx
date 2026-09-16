import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/yonetim")({
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Panel yüklenemedi: {error.message}</div>
  ),
});

const NAV = [
  { to: "/yonetim", label: "Dashboard" },
  { to: "/yonetim/akis", label: "İş Akışı" },
  { to: "/yonetim/talepler", label: "Tadilat Talepleri" },
  { to: "/yonetim/musteriler", label: "Müşteriler" },
  { to: "/yonetim/gayrimenkuller", label: "Gayrimenkuller" },
  { to: "/yonetim/kesifler", label: "Keşifler" },
  { to: "/yonetim/teklifler", label: "Teklifler" },
  { to: "/yonetim/projeler", label: "Projeler" },
  { to: "/yonetim/personel", label: "Personel" },
  { to: "/yonetim/ekipler", label: "Ustalar / Ekipler" },
  { to: "/yonetim/cozum-ortaklari", label: "Çözüm Ortakları" },
  { to: "/yonetim/tamamlanan-projeler", label: "Tamamlanan Projeler" },
  { to: "/yonetim/once-sonra", label: "Önce / Sonra" },
  { to: "/yonetim/tedarikciler", label: "Tedarikçiler" },
  { to: "/yonetim/malzemeler", label: "Malzemeler" },
  { to: "/yonetim/firsatlar", label: "Tadilat Fırsatları" },
  { to: "/yonetim/bildirimler", label: "Bildirimler" },
  { to: "/yonetim/raporlar", label: "Raporlar" },
  { to: "/yonetim/ayarlar", label: "Ayarlar" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: access, isLoading } = useQuery({
    queryKey: ["me-access"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return { email: null as string | null, roles: [] as string[] };
      await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", uid);
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) throw error;
      return { email: userData.user?.email ?? null, roles: (data ?? []).map((r) => r.role as string) };
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  if (!access || access.roles.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Panel yetkiniz bulunmuyor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              {access?.email ?? "Hesabınız"} ile giriş yaptınız, ancak henüz bir görev tanımlanmamış. Yöneticinizin size
              yetki vermesi gerekiyor.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={signOut}>
                Çıkış yap
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">Siteye dön</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 lg:flex">
      <aside className="border-b bg-card lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold tracking-tight">Enes Yapı</p>
            <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü"
          >
            Menü
          </Button>
        </div>
        <nav className={`${menuOpen ? "block" : "hidden"} px-2 pb-4 lg:block`}>
          {NAV.map((item) => {
            const active = item.to === "/yonetim" ? pathname === "/yonetim" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-4 border-t px-3 pt-3">
            <p className="truncate text-xs text-muted-foreground">{access.email}</p>
            <p className="text-xs text-muted-foreground">Roller: {access.roles.join(", ")}</p>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={signOut}>
              Çıkış yap
            </Button>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
