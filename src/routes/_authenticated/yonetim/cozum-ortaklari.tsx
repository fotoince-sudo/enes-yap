import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";
import { PARTNER_TYPE } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/cozum-ortaklari")({
  component: () => (
    <CrudTable
      table="partners"
      title="Çözüm Ortakları"
      description="Ustalar, ekipler ve firmalar aynı kayıt havuzunda tutulur; tür alanından ayrışır. Bir projeye birden fazla çözüm ortağı atanabilir."
      searchKeys={["name", "contact_person", "phone", "whatsapp", "specialty", "district"]}
      fields={[
        {
          key: "partner_type",
          label: "Tür",
          type: "select",
          options: Object.entries(PARTNER_TYPE).map(([value, label]) => ({ value, label })),
        },
        { key: "name", label: "Firma / usta adı" },
        { key: "contact_person", label: "Yetkili kişi" },
        { key: "phone", label: "Telefon" },
        { key: "service_areas", label: "Hizmet alanları", type: "tags" },
        { key: "is_active", label: "Aktif", type: "boolean" },
        { key: "whatsapp", label: "WhatsApp", inList: false },
        { key: "email", label: "E-posta", inList: false },
        { key: "specialty", label: "Uzmanlık", inList: false },
        { key: "district", label: "İlçe", inList: false },
        { key: "work_regions", label: "Hizmet bölgeleri", type: "tags", inList: false },
        { key: "rating", label: "Puan (1-5)", type: "number", inList: false },
        { key: "references_text", label: "Referanslar", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
