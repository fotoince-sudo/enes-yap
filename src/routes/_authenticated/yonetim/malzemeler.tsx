import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import { UNITS } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/malzemeler")({
  component: Materials,
});

function Materials() {
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, company_name").order("company_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <CrudTable
      table="materials"
      title="Malzemeler"
      description="Maliyet hesaplarında kullanılacak malzeme kalemleri."
      searchKeys={["name", "category"]}
      fields={[
        { key: "name", label: "Ürün adı" },
        { key: "category", label: "Kategori" },
        { key: "unit", label: "Birim", type: "select", options: UNITS.map((u) => ({ value: u, label: u })) },
        { key: "estimated_cost", label: "Tahmini maliyet", type: "number" },
        {
          key: "supplier_id",
          label: "Tedarikçi",
          type: "select",
          options: suppliers.map((s) => ({ value: s.id, label: s.company_name })),
          render: (row) => suppliers.find((s) => s.id === row["supplier_id"])?.company_name ?? "—",
        },
        { key: "notes", label: "Not", type: "textarea", inList: false },
      ]}
    />
  );
}
