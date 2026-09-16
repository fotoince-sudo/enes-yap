import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import {
  OPPORTUNITY_SOURCE,
  OPPORTUNITY_STATUS,
  OPPORTUNITY_TYPE,
  PROPERTY_TYPES,
  RENOVATION_LIKELIHOOD,
  SALE_RENT_STATUS,
  trDate,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/firsatlar")({
  component: Opportunities,
});

function Opportunities() {
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
      table="opportunities"
      title="Tadilat Fırsatları"
      description="Potansiyel tadilat işleri. Aynı ilan bağlantısı veya aynı ilan bilgisi ikinci kez kaydedilemez; mükerrer kayıt engellenir."
      searchKeys={["listing_title", "city", "district", "neighborhood", "phone", "notes", "description"]}
      fields={[
        { key: "listing_title", label: "İlan / kayıt başlığı" },
        {
          key: "status",
          label: "Fırsat durumu",
          type: "select",
          options: Object.entries(OPPORTUNITY_STATUS).map(([value, label]) => ({ value, label })),
        },
        { key: "city", label: "İl" },
        { key: "district", label: "İlçe" },
        { key: "phone", label: "Telefon" },
        {
          key: "renovation_likelihood",
          label: "Tadilat ihtimali",
          type: "select",
          options: Object.entries(RENOVATION_LIKELIHOOD).map(([value, label]) => ({ value, label })),
        },
        {
          key: "source",
          label: "Kaynak",
          type: "select",
          inList: false,
          options: OPPORTUNITY_SOURCE.map((s) => ({ value: s, label: s })),
        },
        { key: "listing_url", label: "İlan / kayıt bağlantısı", inList: false },
        { key: "listing_date", label: "İlan tarihi", type: "date", inList: false },
        { key: "neighborhood", label: "Mahalle", inList: false },
        {
          key: "property_type",
          label: "Gayrimenkul tipi",
          type: "select",
          inList: false,
          options: PROPERTY_TYPES.map((t) => ({ value: t, label: t })),
        },
        {
          key: "sale_rent_status",
          label: "Satılık / kiralık",
          type: "select",
          inList: false,
          options: Object.entries(SALE_RENT_STATUS).map(([value, label]) => ({ value, label })),
        },
        {
          key: "opportunity_type",
          label: "Fırsat türü",
          type: "select",
          inList: false,
          options: Object.entries(OPPORTUNITY_TYPE).map(([value, label]) => ({ value, label })),
        },
        { key: "estimated_value", label: "Tahmini değer", type: "number", inList: false },
        {
          key: "assigned_to",
          label: "Sorumlu personel",
          type: "select",
          inList: false,
          options: staff.map((s) => ({ value: s.id, label: s.full_name ?? s.id })),
        },
        {
          key: "first_contact_at",
          label: "İlk iletişim",
          type: "datetime",
          inList: false,
          render: (r) => trDate(r["first_contact_at"] as string),
        },
        {
          key: "last_contact_at",
          label: "Son iletişim",
          type: "datetime",
          inList: false,
          render: (r) => trDate(r["last_contact_at"] as string),
        },
        { key: "description", label: "Açıklama", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  );
}
