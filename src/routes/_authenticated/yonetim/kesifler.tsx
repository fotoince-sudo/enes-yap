import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import { trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/kesifler")({
  component: Surveys,
});

function Surveys() {
  const { data: requests = [] } = useQuery({
    queryKey: ["requests-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renovation_requests")
        .select("id, full_name, renovation_type")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, city, district, address")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <CrudTable
      table="surveys"
      title="Keşifler"
      description="Tadilat talebinden keşif oluşturulur; ölçüler, yapılacak işler ve maliyet notları teklif aşamasına hazırlık sağlar."
      orderBy={{ column: "scheduled_date", ascending: true }}
      searchKeys={["address", "responsible_name", "result", "work_items"]}
      fields={[
        { key: "scheduled_date", label: "Keşif tarihi", type: "date", render: (r) => trDate(r["scheduled_date"] as string) },
        { key: "scheduled_time", label: "Saat", type: "time" },
        { key: "address", label: "Adres" },
        {
          key: "responsible_id",
          label: "Sorumlu personel",
          type: "select",
          options: staff.map((s) => ({ value: s.id, label: s.full_name ?? s.id })),
          render: (r) => staff.find((s) => s.id === r["responsible_id"])?.full_name ?? "—",
        },
        { key: "estimated_cost", label: "Tahmini maliyet", type: "number" },
        { key: "is_done", label: "Keşif yapıldı", type: "boolean" },
        {
          key: "request_id",
          label: "Tadilat talebi",
          type: "select",
          inList: false,
          options: requests.map((r) => ({ value: r.id, label: `${r.full_name} — ${r.renovation_type ?? ""}` })),
        },
        {
          key: "customer_id",
          label: "Müşteri",
          type: "select",
          inList: false,
          options: customers.map((c) => ({ value: c.id, label: c.full_name })),
        },
        {
          key: "property_id",
          label: "Gayrimenkul",
          type: "select",
          inList: false,
          options: properties.map((p) => ({
            value: p.id,
            label: [p.city, p.district, p.address].filter(Boolean).join(" · ") || p.id.slice(0, 8),
          })),
        },
        { key: "responsible_name", label: "Sorumlu (dış kişi)", inList: false },
        { key: "work_items", label: "Yapılacak işler", type: "textarea", inList: false },
        { key: "material_notes", label: "Malzeme notları", type: "textarea", inList: false },
        { key: "labor_notes", label: "İşçilik notları", type: "textarea", inList: false },
        { key: "quote_state", label: "Teklif durumu notu", inList: false },
        { key: "result", label: "Keşif sonucu", type: "textarea", inList: false },
        { key: "notes", label: "Genel notlar", type: "textarea", inList: false },
      ]}
    />
  );
}
