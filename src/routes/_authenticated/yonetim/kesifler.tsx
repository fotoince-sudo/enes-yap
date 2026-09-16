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

  return (
    <CrudTable
      table="surveys"
      title="Keşifler"
      description="Her tadilat talebi için keşif planlanır; sonuç ve tahmini maliyet buradan işlenir."
      orderBy={{ column: "scheduled_date", ascending: true }}
      searchKeys={["address", "responsible_name", "result"]}
      fields={[
        { key: "scheduled_date", label: "Tarih", type: "date", render: (r) => trDate(r["scheduled_date"] as string) },
        { key: "scheduled_time", label: "Saat", type: "time" },
        { key: "address", label: "Adres" },
        { key: "responsible_name", label: "Sorumlu kişi" },
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
        { key: "quote_state", label: "Teklif durumu notu", inList: false },
        { key: "result", label: "Keşif sonucu", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  );
}
