import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/enes-yapi-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/hesabim")({
  component: CustomerLayout,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">Sayfa yüklenemedi: {error.message}</div>
  ),
});

const NAV = [
  { to: "/hesabim", label: "Özet" },
  { to: "/hesabim/talepler", label: "Taleplerim" },
  { to: "/hesabim/teklifler", label: "Tekliflerim" },
  { to: "/hesabim/projeler", label: "Projelerim" },
] as const;

function CustomerLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: me } = useQuery({
    queryKey: ["me-customer"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return { email: null as string | null, isStaff: false };
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      return { email: userData.user?.email ?? null, isStaff: (data ?? []).length > 0 };
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2.5">
            <img src={logoAsset.url} alt="Enes Yapı logosu" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-semibold tracking-tight">Enes Yapı</p>
              <p className="text-xs text-muted-foreground">Müşteri Hesabım</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {me?.isStaff ? (
              <Button size="sm" variant="ghost" asChild>
                <Link to="/yonetim">Yönetim paneli</Link>
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" asChild>
              <Link to="/">Siteye dön</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={signOut}>
              Çıkış yap
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => {
            const active = item.to === "/hesabim" ? pathname === "/hesabim" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl p-4">
        {me?.email ? (
          <p className="mb-4 text-xs text-muted-foreground">
            {me.email} hesabıyla giriş yaptınız. Bu e-posta ile oluşturulan talep, teklif ve projeleriniz burada
            görünür.
          </p>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
