import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getWhatsappIntegrationStatus, type WhatsappIntegrationStatus } from "@/lib/whatsapp-status.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/yonetim/whatsapp-durum")({
  component: WhatsappStatusPanel,
  head: () => ({
    meta: [{ title: "WhatsApp Bağlantı Durumu | Enes Yapı Yönetim" }],
  }),
});

// Kullanıcı tarafından bildirilen hedef WABA ID (bağlantı sonrası doğrulanır)
const TARGET_WABA_ID = "161950678560356";

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium break-all">{value}</span>
    </div>
  );
}

function WhatsappStatusPanel() {
  const fetchStatus = useServerFn(getWhatsappIntegrationStatus);
  const statusQuery = useQuery({
    queryKey: ["whatsapp-integration-status"],
    queryFn: async (): Promise<WhatsappIntegrationStatus> => await fetchStatus(),
    refetchInterval: 30000,
  });

  const s = statusQuery.data;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Bağlantı Durumu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Meta (WhatsApp Business) entegrasyonunun anlık durumu: bağlı sayfa/numara, WABA ID ve mesaj akışı. Sayfa her 30
          saniyede yenilenir.
        </p>
      </div>

      {statusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : statusQuery.isError ? (
        <p className="text-sm text-destructive">
          Durum alınamadı: {(statusQuery.error as Error)?.message ?? "bilinmeyen hata"}
        </p>
      ) : s ? (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  s.connected ? "bg-primary/15 text-primary" : "bg-amber-500/15 text-amber-600"
                }`}
              >
                {s.connected ? "Bağlantı kurulu" : "Bağlantı bekleniyor"}
              </span>
              <span className="text-sm text-muted-foreground">{s.reason}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-medium">Bağlı hesap ve numara</h2>
              <div className="mt-2">
                {s.connected ? (
                  s.phone ? (
                    <>
                      <Row label="Doğrulanmış ad" value={s.phone.verified_name ?? "—"} />
                      <Row label="Görünen numara" value={s.phone.display_phone_number ?? "—"} />
                      <Row label="Numara kalitesi" value={s.phone.quality_rating ?? "—"} />
                      <Row
                        label="WhatsApp Business uygulamasında"
                        value={s.phone.is_on_biz_app === null ? "—" : s.phone.is_on_biz_app ? "Evet" : "Hayır"}
                      />
                      <Row label="Platform" value={s.phone.platform_type ?? "—"} />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Numara bilgisi okunamadı{s.phoneError ? `: ${s.phoneError}` : "."}
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Bağlantı kurulduğunda burada WhatsApp Business hesabınızın adı, +90 530 764 17 17 numarası ve numara
                    kalitesi görünür.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-medium">Meta kimlikleri</h2>
              <div className="mt-2">
                <Row label="WABA ID (hedef)" value={s.wabaId ?? TARGET_WABA_ID} />
                <Row label="Doğrulama" value={s.wabaId ? "Bağlantıdan doğrulandı" : "Bağlantı sonrası doğrulanacak"} />
                <Row label="Facebook Sayfası" value="Enes Yapı (bağlantı sonrası gösterilir)" />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-medium">Mesaj akışı</h2>
              <div className="mt-2">
                <Row label="Gelen mesaj" value={String(s.stats.inbound)} />
                <Row label="Gönderilen mesaj" value={String(s.stats.outbound)} />
                <Row label="Okundu işareti alan" value={String(s.stats.read)} />
                <Row label="Başarısız gönderim" value={String(s.stats.failed)} />
                <Row label="Son gelen mesaj" value={formatWhen(s.stats.lastInboundAt)} />
              </div>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to="/yonetim/mesajlar">WhatsApp Mesajları sayfasına git</Link>
              </Button>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-medium">Son webhook teslimatları</h2>
              {s.lastEvents.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Henüz teslimat yok. Bağlantı kurulup Meta doğrulaması tamamlandığında Meta'dan gelen olaylar burada
                  listelenir.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {s.lastEvents.map((e, i) => (
                    <li key={i} className="border-b pb-2 text-sm last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{e.event}</span>
                        <span className="text-xs text-muted-foreground">{formatWhen(e.received_at)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {e.processed_at
                          ? `İşlendi · ${formatWhen(e.processed_at)}`
                          : e.processing_error
                            ? `Beklemede: ${e.processing_error}`
                            : "İşleniyor"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
