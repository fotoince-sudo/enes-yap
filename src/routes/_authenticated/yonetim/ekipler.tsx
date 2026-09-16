import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";
import { PARTNER_TYPE } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/ekipler")({
  component: () => (
    <CrudTable
      table="partners"
      title="Ustalar / Ekipler"
      description="Kendi ekiplerimiz ve dışarıdan çalıştığımız ustalar. Hizmet alanları, ekip eşleştirmede kullanılır."
      searchKeys={["name", "phone", "specialty", "district"]}
      fields={[
        {
          key: "partner_type",
          label: "Tür",
          type: "select",
          options: Object.entries(PARTNER_TYPE).map(([value, label]) => ({ value, label })),
        },
        { key: "name", label: "Ad soyad / firma" },
        { key: "phone", label: "Telefon" },
        { key: "specialty", label: "Uzmanlık" },
        { key: "service_areas", label: "Hizmet alanları", type: "tags" },
        { key: "is_active", label: "Aktif", type: "boolean" },
        { key: "email", label: "E-posta", inList: false },
        { key: "district", label: "İlçe", inList: false },
        { key: "work_regions", label: "Çalışma bölgeleri", type: "tags", inList: false },
        { key: "rating", label: "Puan (1-5)", type: "number", inList: false },
        { key: "references_text", label: "Referanslar", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
