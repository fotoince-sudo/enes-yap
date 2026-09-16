import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/yonetim/ayarlar")({
  component: Settings,
});

function Settings() {
  const { data: team = [] } = useQuery({
    queryKey: ["team-roles"],
    queryFn: async () => {
      const [{ data: roles }, { data: profiles }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("id, full_name, phone"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
      }));
    },
  });

  return (
    <div className="space-y-8">
      <CrudTable
        table="service_categories"
        title="Hizmet Kategorileri"
        description="Yeni hizmet kategorileri buradan eklenir; web sitesindeki hizmet listesi ve talep formu bu listeden beslenir."
        orderBy={{ column: "sort_order", ascending: true }}
        searchKeys={["name", "slug"]}
        fields={[
          { key: "name", label: "Kategori adı" },
          { key: "slug", label: "Kısa kod (slug)" },
          { key: "sort_order", label: "Sıra", type: "number" },
          { key: "is_active", label: "Aktif", type: "boolean" },
          { key: "description", label: "Açıklama", type: "textarea", inList: false },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ekip ve yetkiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Roller: admin, yonetici, operasyon, saha, ekip. Yetki verme işlemi yalnızca admin rolündeki kullanıcılar
            tarafından yapılabilir.
          </p>
          {team.length === 0 ? (
            <p className="text-muted-foreground">Kayıtlı kullanıcı yok.</p>
          ) : (
            team.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>{m.full_name ?? m.id}</span>
                <span className="text-xs text-muted-foreground">{m.roles.join(", ") || "yetki yok"}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
