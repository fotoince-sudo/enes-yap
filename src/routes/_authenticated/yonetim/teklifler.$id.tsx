import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QUOTE_STATUS, UNITS, tl } from "@/lib/domain";
import { downloadQuotePdf } from "@/lib/quote-pdf";
import { logActivity } from "@/lib/activity";
import { ActivityPanel } from "@/components/admin/ActivityPanel";

export const Route = createFileRoute("/_authenticated/yonetim/teklifler/$id")({
  component: QuoteDetail,
  errorComponent: ({ error }) => <p className="text-sm text-destructive">Teklif açılamadı: {error.message}</p>,
});

const emptyItem = { title: "", description: "", quantity: "1", unit: "adet", material_cost: "0", labor_cost: "0" };

function QuoteDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [item, setItem] = useState({ ...emptyItem });

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*, customers(full_name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["quote-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const itemsTotal = items.reduce((s, i) => s + Number(i.line_total ?? 0), 0);
  const materials = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.material_cost ?? 0), 0);
  const labor = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.labor_cost ?? 0), 0);
  const newUnitPrice = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
  const newLineTotal = (Number(item.quantity) || 0) * newUnitPrice;
  const extra = Number(quote?.extra_total ?? 0);
  const discount = Number(quote?.discount ?? 0);
  const vatRate = Number(quote?.vat_rate ?? 20);
  const subtotal = Math.max(itemsTotal + extra - discount, 0);
  const vat = (subtotal * vatRate) / 100;
  const grandTotal = subtotal + vat;

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("quotes").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const addItem = useMutation({
    mutationFn: async () => {
      if (!item.title.trim()) throw new Error("İş kalemi adı gerekli.");
      const { error } = await supabase.from("quote_items").insert({
        quote_id: id,
        title: item.title.trim().slice(0, 200),
        description: item.description.trim() || null,
        quantity: Number(item.quantity) || 0,
        unit: item.unit,
        material_cost: Number(item.material_cost) || 0,
        labor_cost: Number(item.labor_cost) || 0,
        sort_order: items.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setItem({ ...emptyItem });
      queryClient.invalidateQueries({ queryKey: ["quote-items", id] });
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Kalem eklendi, teklif toplamları güncellendi.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("quote_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-items", id] });
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const toProject = useMutation({
    mutationFn: async () => {
      if (!quote) return;
      const { data, error } = await supabase
        .from("projects")
        .insert({
          quote_id: id,
          request_id: quote.request_id,
          customer_id: quote.customer_id,
          property_id: quote.property_id,
          title: quote.title ?? "Proje",
          contract_total: grandTotal,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("quotes").update({ status: "kabul" }).eq("id", id);
      if (quote.request_id) {
        await supabase.from("renovation_requests").update({ status: "onaylandi" }).eq("id", quote.request_id);
      }
      return data.id;
    },
    onSuccess: (projectId) => {
      toast.success("Teklif projeye dönüştürüldü.");
      if (projectId) navigate({ to: "/yonetim/projeler/$id", params: { id: projectId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPdf = useMutation({
    mutationFn: async () => {
      if (!quote) return;
      if (items.length === 0) throw new Error("Teklifte kalem yok. Önce iş kalemi ekleyin.");
      downloadQuotePdf({
        quoteNo: quote.quote_no,
        title: quote.title,
        customerName: (quote.customers as { full_name: string } | null)?.full_name ?? null,
        status: quote.status,
        createdAt: quote.created_at,
        validUntil: quote.valid_until,
        notes: quote.notes,
        items: items.map((i) => ({
          title: i.title ?? "",
          description: i.description,
          quantity: Number(i.quantity ?? 0),
          unit: i.unit ?? "",
          unit_price: Number(i.unit_price ?? 0),
          material_cost: Number(i.material_cost ?? 0),
          labor_cost: Number(i.labor_cost ?? 0),
          line_total: Number(i.line_total ?? 0),
        })),
        itemsTotal,
        materials,
        labor,
        extra,
        discount,
        vatRate,
        vat,
        grandTotal,
      });

      const advance = quote.status === "taslak" || quote.status === "hazirlaniyor";
      const patch: Record<string, unknown> = {
        materials_total: materials,
        labor_total: labor,
        grand_total: grandTotal,
      };
      if (advance) patch['status'] = "gonderildi";
      const { error } = await supabase.from("quotes").update(patch as never).eq("id", id);
      if (error) throw error;

      await logActivity({
        entity: "quote",
        entityId: id,
        type: "quote_pdf",
        note: `PDF teklif oluşturuldu. Genel toplam: ${tl(grandTotal)}`,
        oldStatus: advance ? quote.status : null,
        newStatus: advance ? "gonderildi" : null,
      });
      return advance;
    },
    onSuccess: (advance) => {
      toast.success(
        advance
          ? "PDF teklif oluşturuldu, teklif “Gönderildi” durumuna alındı."
          : "PDF teklif oluşturuldu, tutarlar kaydedildi.",
      );
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["activity", "quote", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (!quote) return <p className="text-sm text-muted-foreground">Teklif bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teklif #{quote.quote_no}</h1>
          <p className="text-sm text-muted-foreground">
            {(quote.customers as { full_name: string } | null)?.full_name ?? "Müşteri seçilmedi"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/yonetim/teklifler">Listeye dön</Link>
          </Button>
          <Button variant="outline" onClick={() => createPdf.mutate()} disabled={createPdf.isPending}>
            PDF teklif oluştur
          </Button>
          <Button onClick={() => toProject.mutate()}>Projeye dönüştür</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Teklif bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                defaultValue={quote.title ?? ""}
                onBlur={(e) => update.mutate({ title: e.target.value.slice(0, 200) })}
              />
            </div>
            <div>
              <Label htmlFor="customer">Müşteri</Label>
              <select
                id="customer"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={quote.customer_id ?? ""}
                onChange={(e) => update.mutate({ customer_id: e.target.value || null })}
              >
                <option value="">Seçiniz</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={quote.status}
                onChange={(e) => update.mutate({ status: e.target.value })}
              >
                {Object.entries(QUOTE_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="extra">Ek gider</Label>
              <Input
                id="extra"
                type="number"
                defaultValue={extra}
                onBlur={(e) => update.mutate({ extra_total: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="discount">İskonto</Label>
              <Input
                id="discount"
                type="number"
                defaultValue={discount}
                onBlur={(e) => update.mutate({ discount: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="vat">KDV oranı (%)</Label>
              <Input
                id="vat"
                type="number"
                defaultValue={vatRate}
                onBlur={(e) => update.mutate({ vat_rate: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="valid">Geçerlilik tarihi</Label>
              <Input
                id="valid"
                type="date"
                defaultValue={quote.valid_until ?? ""}
                onBlur={(e) => update.mutate({ valid_until: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                defaultValue={quote.notes ?? ""}
                onBlur={(e) => update.mutate({ notes: e.target.value || null })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Özet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kalemler toplamı</span>
              <span>{tl(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Malzeme</span>
              <span>{tl(materials)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">İşçilik</span>
              <span>{tl(labor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ek gider</span>
              <span>{tl(extra)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">İskonto</span>
              <span>-{tl(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KDV (%{vatRate})</span>
              <span>{tl(vat)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Genel toplam</span>
              <span>{tl(grandTotal)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Malzeme ve işçilik fiyatları kayıtla birlikte saklanır; kalem eklediğinizde veya iskonto, ek gider, KDV
              oranını değiştirdiğinizde toplamlar otomatik hesaplanır.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İş kalemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İş kalemi</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead>Birim fiyat</TableHead>
                  <TableHead>Malzeme (birim)</TableHead>
                  <TableHead>İşçilik (birim)</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      Kalem eklenmedi.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <span className="font-medium">{i.title}</span>
                        {i.description ? (
                          <span className="block text-xs text-muted-foreground">{i.description}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell>{i.unit}</TableCell>
                      <TableCell>{tl(i.unit_price)}</TableCell>
                      <TableCell>{tl(i.material_cost)}</TableCell>
                      <TableCell>{tl(i.labor_cost)}</TableCell>
                      <TableCell>{tl(i.line_total)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => removeItem.mutate(i.id)}>
                          Sil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="i-title">İş kalemi</Label>
              <Input id="i-title" value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="i-desc">Açıklama</Label>
              <Input id="i-desc" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="i-qty">Miktar</Label>
              <Input id="i-qty" type="number" value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="i-unit">Birim</Label>
              <select
                id="i-unit"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={item.unit}
                onChange={(e) => setItem({ ...item, unit: e.target.value })}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="i-mat">Malzeme birim fiyatı</Label>
              <Input id="i-mat" type="number" value={item.material_cost} onChange={(e) => setItem({ ...item, material_cost: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="i-hours">İşçilik saati (isteğe bağlı)</Label>
              <Input id="i-hours" type="number" value={item.labor_hours} onChange={(e) => setItem({ ...item, labor_hours: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="i-rate">Saat ücreti (isteğe bağlı)</Label>
              <Input id="i-rate" type="number" value={item.labor_hourly_rate} onChange={(e) => setItem({ ...item, labor_hourly_rate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="i-lab">İşçilik birim fiyatı</Label>
              <Input
                id="i-lab"
                type="number"
                value={autoLabor ? String(computedLabor) : item.labor_cost}
                disabled={autoLabor}
                onChange={(e) => setItem({ ...item, labor_cost: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {autoLabor ? "Saat × saat ücreti ile otomatik hesaplanıyor." : "Saat ve saat ücreti girmezseniz bu tutar elle kullanılır."}
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-sm sm:col-span-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birim fiyat (malzeme + işçilik)</span>
                <span>{tl(newUnitPrice)}</span>
              </div>
              <div className="mt-1 flex justify-between font-medium">
                <span>Kalem toplamı</span>
                <span>{tl(newLineTotal)}</span>
              </div>
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button className="w-full" onClick={() => addItem.mutate()} disabled={addItem.isPending}>
                Kalem ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ActivityPanel entity="quote" entityId={id} />
    </div>
  );
}
