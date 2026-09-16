import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import { PROPERTY_TYPES, PROPERTY_USAGE } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/gayrimenkuller")({
  component: Properties,
});

function Properties() {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <CrudTable
      table="properties"
      title="Gayrimenkuller"
      description="Her gayrimenkul bir müşteriye bağlanır; aynı gayrimenkul için birden fazla tadilat talebi oluşturulabilir."
      searchKeys={["city", "district", "neighborhood", "address", "property_type"]}
      fields={[
        {
          key: "customer_id",
          label: "Müşteri",
          type: "select",
          options: customers.map((c) => ({ value: c.id, label: c.full_name })),
          render: (row) => customers.find((c) => c.id === row["customer_id"])?.full_name ?? "—",
        },
        {
          key: "property_type",
          label: "Tip",
          type: "select",
          options: PROPERTY_TYPES.map((t) => ({ value: t, label: t })),
        },
        { key: "city", label: "İl" },
        { key: "district", label: "İlçe" },
        { key: "area_m2", label: "m²", type: "number" },
        {
          key: "usage_status",
          label: "Kullanım durumu",
          type: "select",
          options: PROPERTY_USAGE.map((u) => ({ value: u, label: u })),
        },
        { key: "neighborhood", label: "Mahalle", inList: false },
        { key: "address", label: "Adres", type: "textarea", inList: false },
        { key: "room_count", label: "Oda bilgisi", inList: false },
        { key: "building_age", label: "Bina yaşı", type: "number", inList: false },
        { key: "condition", label: "Genel durum", inList: false },
        { key: "external_ref", label: "Dış referans (ör. emlak kaydı)", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  );
}
