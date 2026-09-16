import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";
import { PARTNER_TYPE } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/cozum-ortaklari")({
  component: () => (
    <CrudTable
      table="partners"
      title="Çözüm Ortakları"
      description="Firmalar ve çözüm ortakları da aynı kayıt havuzunda tutulur; tür alanından ayrışır."
      searchKeys={["name", "phone", "specialty", "district"]}
      fields={[
        {
          key: "partner_type",
          label: "Tür",
          type: "select",
          options: Object.entries(PARTNER_TYPE).map(([value, label]) => ({ value, label })),
        },
        { key: "name", label: "Firma / ortak adı" },
        { key: "phone", label: "Telefon" },
        { key: "email", label: "E-posta" },
        { key: "service_areas", label: "Hizmet alanları", type: "tags" },
        { key: "is_active", label: "Aktif", type: "boolean" },
        { key: "specialty", label: "Uzmanlık", inList: false },
        { key: "work_regions", label: "Çalışma bölgeleri", type: "tags", inList: false },
        { key: "references_text", label: "Referanslar", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
