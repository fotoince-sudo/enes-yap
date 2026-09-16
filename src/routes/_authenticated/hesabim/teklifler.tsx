import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QUOTE_STATUS, tl, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/hesabim/teklifler")({
  component: CustomerQuotes,
});

function CustomerQuotes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-quotes"],
    queryFn: async () => {
      const { data: quotes, error: qErr } = await supabase
        .from("quotes")
        .select(
          "id, quote_no, title, status, materials_total, labor_total, extra_total, discount, vat_rate, grand_total, valid_until, notes, created_at",
        )
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      const { data: items, error: iErr } = await supabase
        .from("quote_items")
        .select("id, quote_id, title, quantity, unit, unit_price, line_total, sort_order")
        .order("sort_order");
      if (iErr) throw iErr;
      return { quotes: quotes ?? [], items: items ?? [] };
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error) return <p className="text-sm text-destructive">Teklifleriniz yüklenemedi: {error.message}</p>;
  if (!data || data.quotes.length === 0)
    return <p className="text-sm text-muted-foreground">Henüz size hazırlanmış bir teklif bulunmuyor.</p>;

  return (
    <div className="space-y-4">
      {data.quotes.map((q) => {
        const items = data.items.filter((i) => i.quote_id === q.id);
        const vat =
          ((Number(q.materials_total) + Number(q.labor_total) + Number(q.extra_total) - Number(q.discount)) *
            Number(q.vat_rate)) /
          100;
        return (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Teklif #{q.quote_no} {q.title ? `· ${q.title}` : ""}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS] ?? q.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Tarih: {trDate(q.created_at)}
                {q.valid_until ? ` · Geçerlilik: ${trDate(q.valid_until)}` : ""}
              </p>

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        <th className="py-1">Kalem</th>
                        <th className="py-1">Miktar</th>
                        <th className="py-1">Birim fiyat</th>
                        <th className="py-1 text-right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.id} className="border-t">
                          <td className="py-1">{i.title}</td>
                          <td className="py-1">
                            {i.quantity} {i.unit}
                          </td>
                          <td className="py-1">{tl(i.unit_price)}</td>
                          <td className="py-1 text-right">{tl(i.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="space-y-1 border-t pt-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Malzeme</span>
                  <span>{tl(q.materials_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>İşçilik</span>
                  <span>{tl(q.labor_total)}</span>
                </div>
                {Number(q.extra_total) > 0 ? (
                  <div className="flex justify-between">
                    <span>Ek gider</span>
                    <span>{tl(q.extra_total)}</span>
                  </div>
                ) : null}
                {Number(q.discount) > 0 ? (
                  <div className="flex justify-between">
                    <span>İskonto</span>
                    <span>−{tl(q.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>KDV (%{Number(q.vat_rate)})</span>
                  <span>{tl(vat)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 text-base font-semibold text-foreground">
                  <span>Genel toplam</span>
                  <span>{tl(q.grand_total)}</span>
                </div>
              </div>

              {q.notes ? <p className="text-muted-foreground">Not: {q.notes}</p> : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
