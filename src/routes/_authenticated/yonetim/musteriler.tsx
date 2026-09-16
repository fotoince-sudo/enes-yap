import { createFileRoute } from "@tanstack/react-router";

import { CrudTable } from "@/components/admin/CrudTable";
import { CUSTOMER_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/musteriler")({
  component: () => (
    <CrudTable
      table="customers"
      title="Müşteriler"
      description="Müşteri kayıtları gayrimenkullerden ayrı tutulur; bir müşterinin birden fazla gayrimenkulü ve talebi olabilir."
      searchKeys={["full_name", "phone", "whatsapp", "email", "city", "district"]}
      fields={[
        { key: "full_name", label: "Ad soyad", required: true },
        { key: "phone", label: "Telefon" },
        { key: "whatsapp", label: "WhatsApp" },
        { key: "city", label: "İl" },
        { key: "district", label: "İlçe" },
        {
          key: "status",
          label: "Durum",
          type: "select",
          options: Object.entries(CUSTOMER_STATUS).map(([value, label]) => ({ value, label })),
        },
        { key: "email", label: "E-posta", inList: false },
        { key: "neighborhood", label: "Mahalle", inList: false },
        { key: "address", label: "Adres", type: "textarea", inList: false },
        {
          key: "last_contact_at",
          label: "Son iletişim tarihi",
          type: "datetime",
          inList: false,
          render: (r) => trDate(r["last_contact_at"] as string),
        },
        { key: "notes", label: "Notlar", type: "textarea", inList: false },
      ]}
    />
  ),
});
