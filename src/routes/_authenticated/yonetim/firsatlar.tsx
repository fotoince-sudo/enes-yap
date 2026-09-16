import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";
import { OPPORTUNITY_TYPE } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/firsatlar")({
  component: () => (
    <CrudTable
      table="opportunities"
      title="Fırsatlar"
      description="Tadilat talebinin arkasındaki satış, kiralama veya yatırım fırsatları. İleride emlak tarafıyla eşleştirilebilir."
      searchKeys={["status", "notes"]}
      fields={[
        {
          key: "opportunity_type",
          label: "Fırsat türü",
          type: "select",
          options: Object.entries(OPPORTUNITY_TYPE).map(([value, label]) => ({ value, label })),
        },
        { key: "status", label: "Durum" },
        { key: "estimated_value", label: "Tahmini değer", type: "number" },
        { key: "notes", label: "Notlar", type: "textarea" },
      ]}
    />
  ),
});
