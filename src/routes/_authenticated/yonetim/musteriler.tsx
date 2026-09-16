import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/yonetim/musteriler")({
  component: () => (
    <CrudTable
      table="customers"
      title="Müşteriler"
      description="Müşteri kayıtları gayrimenkullerden ayrı tutulur; bir müşterinin birden fazla gayrimenkulü olabilir."
      searchKeys={["full_name", "phone", "email", "city", "district"]}
      fields={[
        { key: "full_name", label: "Ad soyad", required: true },
        { key: "phone", label: "Telefon" },
        { key: "email", label: "E-posta" },
        { key: "city", label: "İl" },
        { key: "district", label: "İlçe" },
        { key: "neighborhood", label: "Mahalle", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
