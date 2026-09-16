import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { CrudTable } from "@/components/admin/CrudTable";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROSPECT_NEED_TYPES,
  PROSPECT_PERMISSION,
  PROSPECT_SOURCE,
  PROSPECT_STATUS,
  prospectSourceLabel,
  trDate,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/potansiyel-musteriler")({
  component: Prospects,
});

function Prospects() {
  const { data: staff = [] } = useQuery({
    queryKey: ["staff-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <CrudTable
        table="lead_prospects"
        title="Potansiyel Müşteriler / İnternet Taraması"
        description="Tadilat, yenileme, boya, mutfak, banyo, dekorasyon ve anahtar teslim ihtiyacı belirten adaylar. Aynı aday ikinci kez kaydedilemez: aynı ilan bağlantısı, aynı telefon + ihtiyaç türü veya aynı başlık + ilçe + tarih tek kez eklenebilir."
        searchKeys={[
          "title",
          "city",
          "district",
          "neighborhood",
          "need_type",
          "contact_name",
          "contact_phone",
          "notes",
          "description",
        ]}
        fields={[
          { key: "title", label: "İlan / talep başlığı", required: true },
          {
            key: "status",
            label: "Durum",
            type: "select",
            options: Object.entries(PROSPECT_STATUS).map(([value, label]) => ({ value, label })),
          },
          { key: "district", label: "İlçe" },
          {
            key: "need_type",
            label: "İhtiyaç türü",
            type: "select",
            options: PROSPECT_NEED_TYPES.map((t) => ({ value: t, label: t })),
          },
          {
            key: "source",
            label: "Kaynak",
            type: "select",
            required: true,
            defaultValue: "manuel",
            options: Object.entries(PROSPECT_SOURCE).map(([value, label]) => ({ value, label })),
            render: (r) => prospectSourceLabel(String(r["source"] ?? "")),
          },
          { key: "listing_date", label: "İlan / talep tarihi", type: "date" },
          {
            key: "source_permission",
            label: "Kaynak izin durumu",
            type: "select",
            inList: false,
            defaultValue: "manuel_giris",
            options: Object.entries(PROSPECT_PERMISSION).map(([value, label]) => ({ value, label })),
          },
          { key: "listing_url", label: "İlan / başvuru bağlantısı", inList: false },
          { key: "city", label: "İl", inList: false, defaultValue: "İzmir" },
          { key: "neighborhood", label: "Mahalle", inList: false },
          { key: "estimated_work_type", label: "Tahmini iş türü", inList: false },
          { key: "estimated_value", label: "Tahmini iş değeri", type: "number", inList: false },
          { key: "contact_name", label: "İletişim kişisi (kaynakta açıkça varsa)", inList: false },
          { key: "contact_phone", label: "Telefon (kaynakta açıkça varsa)", inList: false },
          { key: "contact_email", label: "E-posta (kaynakta açıkça varsa)", inList: false },
          {
            key: "contact_source_note",
            label: "İletişim bilgisi nereden alındı?",
            inList: false,
            placeholder: "Örn: ilan sayfasında açıkça yayınlanmış",
          },
          {
            key: "assigned_to",
            label: "Sorumlu (Emir / personel)",
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
            label: "Son iletişim tarihi",
            type: "datetime",
            inList: false,
            render: (r) => trDate(r["last_contact_at"] as string),
          },
          { key: "description", label: "Kısa açıklama", type: "textarea", inList: false },
          { key: "notes", label: "Notlar (Emir)", type: "textarea", inList: false },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarama kuralları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Bu bölüm şu an elle (veya izinli kaynaklardan kopyalayarak) aday girişi için hazırdır. Otomatik tarama henüz
            kurulmadı; onayınız olmadan hiçbir dış siteye tarama başlatılmaz.
          </p>
          <p>
            Yalnızca erişimine ve otomatik kullanımına açıkça izin verilen kaynaklar kullanılır: resmî API, açık veri,
            izinli ilan/talep kaynakları, kendi web formunuz, tavsiye ve saha kayıtları. Kaynak izin durumu "İzinsiz"
            olan adaylar takibe alınmaz.
          </p>
          <p>
            CAPTCHA veya erişim engeli aşma, oturum kısıtlarını atlatma ve gizli iletişim bilgisi toplama yapılmaz.
            İletişim bilgisi yalnızca kaynakta açıkça yayınlanmışsa kaydedilir; her kaydın kaynağı ve tarihi saklanır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
