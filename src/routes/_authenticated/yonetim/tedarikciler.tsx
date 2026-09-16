import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/_authenticated/yonetim/tedarikciler")({
  component: () => (
    <CrudTable
      table="suppliers"
      title="Tedarikçiler"
      description="Malzeme ve hizmet tedarikçileri."
      searchKeys={["company_name", "contact_person", "phone"]}
      fields={[
        { key: "company_name", label: "Firma adı" },
        { key: "contact_person", label: "Yetkili" },
        { key: "phone", label: "Telefon" },
        { key: "email", label: "E-posta" },
        { key: "categories", label: "Ürün/hizmet kategorileri", type: "tags" },
        { key: "is_active", label: "Aktif", type: "boolean", defaultValue: true },
        { key: "price_info", label: "Fiyat bilgileri", type: "textarea", inList: false },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
