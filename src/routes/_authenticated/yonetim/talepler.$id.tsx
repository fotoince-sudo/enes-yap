import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OPPORTUNITY_TYPE, REQUEST_STATUS, trDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/talepler/$id")({
  component: RequestDetail,
  errorComponent: ({ error }) => <p className="text-sm text-destructive">Talep açılamadı: {error.message}</p>,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? "—"}</span>
    </div>
  );
}

function RequestDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    address: "",
    neighborhood: "",
    district: "",
    city: "",
    area_m2: "",
    description: "",
  });
  const [fileLinks, setFileLinks] = useState<{ path: string; url: string; isVideo: boolean }[]>([]);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("renovation_requests").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["request-activities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("request_activities")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ["request-surveys", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, scheduled_date, scheduled_time, address, work_items, result, estimated_cost, is_done, notes, photos")
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: emirSession } = useQuery({
    queryKey: ["request-emir-session", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emir_chat_sessions")
        .select("id, summary, wants_survey, message_count, created_at")
        .eq("request_id", id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ["request-quotes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("id, quote_no, status, grand_total")
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const photos = (request?.photo_urls as string[] | null) ?? [];
    const videos = (request?.video_urls as string[] | null) ?? [];
    if (photos.length === 0 && videos.length === 0) {
      setFileLinks([]);
      return;
    }
    (async () => {
      const links: { path: string; url: string; isVideo: boolean }[] = [];
      for (const p of photos) {
        const url = await signedUrl(p);
        if (url) links.push({ path: p, url, isVideo: false });
      }
      for (const v of videos) {
        const url = await signedUrl(v);
        if (url) links.push({ path: v, url, isVideo: true });
      }
      setFileLinks(links);
    })();
  }, [request?.photo_urls, request?.video_urls]);

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("renovation_requests").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Talep güncellendi.");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      queryClient.invalidateQueries({ queryKey: ["request-activities", id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Not boş olamaz.");
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("request_activities").insert({
        request_id: id,
        actor_id: userData.user?.id ?? null,
        activity_type: "note",
        note: note.trim().slice(0, 2000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      toast.success("Not eklendi.");
      queryClient.invalidateQueries({ queryKey: ["request-activities", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCustomerAndProperty = useMutation({
    mutationFn: async () => {
      if (!request) return;
      let customerId = request.customer_id;
      if (!customerId) {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            full_name: request.full_name,
            phone: request.phone,
            email: request.email,
            city: request.city,
            district: request.district,
            neighborhood: request.neighborhood,
          })
          .select("id")
          .single();
        if (error) throw error;
        customerId = data.id;
      }
      let propertyId = request.property_id;
      if (!propertyId) {
        const { data, error } = await supabase
          .from("properties")
          .insert({
            customer_id: customerId,
            city: request.city,
            district: request.district,
            neighborhood: request.neighborhood,
            property_type: request.property_type,
            area_m2: request.area_m2,
          })
          .select("id")
          .single();
        if (error) throw error;
        propertyId = data.id;
      }
      const { error: upErr } = await supabase
        .from("renovation_requests")
        .update({ customer_id: customerId, property_id: propertyId })
        .eq("id", id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      toast.success("Müşteri ve gayrimenkul kaydı oluşturuldu.");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createSurvey = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const photos = (request.photo_urls as string[] | null) ?? [];
      const videos = (request.video_urls as string[] | null) ?? [];
      const { error } = await supabase.from("surveys").insert({
        request_id: id,
        customer_id: request.customer_id,
        property_id: request.property_id,
        address: request.address || [request.neighborhood, request.district, request.city].filter(Boolean).join(", "),
        responsible_id: request.assigned_to,
        work_items: request.renovation_type ?? null,
        notes: [request.description, emirSession?.summary ? `Emir özeti: ${emirSession.summary}` : null]
          .filter(Boolean)
          .join("\n\n") || null,
        photos,
        videos,
      });
      if (error) throw error;
      await supabase.from("renovation_requests").update({ status: "kesif_planlandi" }).eq("id", id);
    },
    onSuccess: () => {
      toast.success("Keşif kaydı oluşturuldu; talep fotoğrafları keşfe eklendi.");
      queryClient.invalidateQueries({ queryKey: ["request-surveys", id] });
      queryClient.invalidateQueries({ queryKey: ["request", id] });
      navigate({ to: "/yonetim/kesifler" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createQuote = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const survey = surveys[0];
      const context = [
        `Talep kaynağı: ${request.source === "web-emir" ? "WEB / EMİR (site asistanı)" : (request.source ?? "—")}`,
        `Konum: ${[request.neighborhood, request.district, request.city].filter(Boolean).join(" / ") || "—"}`,
        request.area_m2 ? `Yaklaşık alan: ${request.area_m2} m²` : null,
        request.property_type ? `Mekân tipi: ${request.property_type}` : null,
        emirSession?.summary ? `Emir sohbet özeti: ${emirSession.summary}` : null,
        request.description ? `Müşteri açıklaması: ${request.description}` : null,
        survey?.work_items ? `Keşif — yapılacak işler: ${survey.work_items}` : null,
        survey?.result ? `Keşif sonucu: ${survey.result}` : null,
        ((request.photo_urls as string[] | null) ?? []).length
          ? `Talep ekinde ${((request.photo_urls as string[] | null) ?? []).length} fotoğraf var (talep detayında görüntülenir).`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          request_id: id,
          customer_id: request.customer_id,
          property_id: request.property_id,
          title: `${request.renovation_type ?? "Tadilat"} — ${request.full_name}`,
          notes: context,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("renovation_requests").update({ status: "teklif_hazirlaniyor" }).eq("id", id);
      return data.id;
    },
    onSuccess: (quoteId) => {
      queryClient.invalidateQueries({ queryKey: ["request-quotes", id] });
      if (quoteId) navigate({ to: "/yonetim/teklifler/$id", params: { id: quoteId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createOpportunity = useMutation({
    mutationFn: async (type: string) => {
      if (!request) return;
      const { error } = await supabase.from("opportunities").insert({
        request_id: id,
        customer_id: request.customer_id,
        property_id: request.property_id,
        opportunity_type: type as never,
      });
      if (error) throw error;
      await supabase.from("renovation_requests").update({ opportunity_type: type as never }).eq("id", id);
    },
    onSuccess: () => {
      toast.success("Fırsat kaydı oluşturuldu.");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (!request) return <p className="text-sm text-muted-foreground">Talep bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{request.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {trDate(request.created_at)} · {request.renovation_type ?? "Tadilat türü belirtilmedi"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{REQUEST_STATUS[request.status as keyof typeof REQUEST_STATUS]}</Badge>
          <Button variant="outline" size="sm" asChild>
            <Link to="/yonetim/talepler">Listeye dön</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Talep bilgileri</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editing) {
                  setEditing(false);
                  return;
                }
                setForm({
                  address: request.address ?? "",
                  neighborhood: request.neighborhood ?? "",
                  district: request.district ?? "",
                  city: request.city ?? "",
                  area_m2: request.area_m2 == null ? "" : String(request.area_m2),
                  description: request.description ?? "",
                });
                setEditing(true);
              }}
            >
              {editing ? "Vazgeç" : "Düzenle"}
            </Button>
          </CardHeader>
          <CardContent>
            <Row label="Telefon" value={request.phone} />
            <Row label="E-posta" value={request.email} />
            {editing ? (
              <div className="space-y-3 pt-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Mahalle</p>
                    <Input
                      value={form.neighborhood}
                      onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">İlçe</p>
                    <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">İl</p>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Açık adres</p>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Yaklaşık m²</p>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.area_m2}
                    onChange={(e) => setForm({ ...form, area_m2: e.target.value })}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Açıklama</p>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate(
                      {
                        address: form.address.trim() || null,
                        neighborhood: form.neighborhood.trim() || null,
                        district: form.district.trim() || null,
                        city: form.city.trim() || null,
                        area_m2: form.area_m2.trim() === "" ? null : Number(form.area_m2),
                        description: form.description.trim() || null,
                      },
                      { onSuccess: () => setEditing(false) },
                    )
                  }
                >
                  Kaydet
                </Button>
              </div>
            ) : (
              <>
                <Row
                  label="Konum"
                  value={[request.neighborhood, request.district, request.city].filter(Boolean).join(" / ")}
                />
                <Row label="Açık adres" value={request.address} />
                <Row label="Gayrimenkul tipi" value={request.property_type} />
                <Row label="Tadilat türü" value={request.renovation_type} />
                <Row label="Yaklaşık m²" value={request.area_m2} />
                <Row label="Bütçe aralığı" value={request.budget_range} />
                <Row label="Başlangıç zamanı" value={request.desired_start} />
                <Row
                  label="Fırsat"
                  value={
                    request.opportunity_type
                      ? OPPORTUNITY_TYPE[request.opportunity_type as keyof typeof OPPORTUNITY_TYPE]
                      : "—"
                  }
                />
                <Row label="Kaynak" value={request.source} />
                <div className="pt-3 text-sm">
                  <p className="text-muted-foreground">Açıklama</p>
                  <p className="mt-1 whitespace-pre-wrap">{request.description ?? "—"}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={request.status}
                onChange={(e) => update.mutate({ status: e.target.value })}
              >
                {Object.entries(REQUEST_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Sorumlu personel</p>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={request.assigned_to ?? ""}
                  onChange={(e) => update.mutate({ assigned_to: e.target.value || null })}
                >
                  <option value="">Atanmadı</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name ?? s.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => createCustomerAndProperty.mutate()}
                  disabled={Boolean(request.customer_id && request.property_id)}
                >
                  Müşteri + gayrimenkul kaydı oluştur
                </Button>
                <Button variant="outline" onClick={() => createSurvey.mutate()} disabled={createSurvey.isPending}>
                  {surveys.length > 0 ? "Yeni keşif oluştur" : "Keşif oluştur"}
                </Button>
                <Button onClick={() => createQuote.mutate()} disabled={createQuote.isPending}>
                  {quotes.length > 0 ? "Yeni teklif oluştur" : "Teklif oluştur"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emir, keşif ve teklif akışı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {request.source === "web-emir" ? (
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <Badge variant="secondary">WEB / EMİR</Badge>
                  <p className="whitespace-pre-wrap">
                    {emirSession?.summary ?? "Sohbet özeti kaydedilmemiş."}
                  </p>
                  {emirSession?.wants_survey ? (
                    <p className="text-xs text-muted-foreground">Müşteri keşif talep etti.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-muted-foreground">Keşifler</p>
                {surveys.length === 0 ? (
                  <p className="text-muted-foreground">Keşif kaydı yok.</p>
                ) : (
                  surveys.map((s) => (
                    <div key={s.id} className="rounded-md border px-3 py-2">
                      <p className="font-medium">
                        {s.scheduled_date ? trDate(s.scheduled_date) : "Tarih planlanmadı"}
                        {s.is_done ? " · Yapıldı" : " · Bekliyor"}
                      </p>
                      {s.work_items ? (
                        <p className="text-xs text-muted-foreground">Yapılacak işler: {s.work_items}</p>
                      ) : null}
                      <Button variant="link" size="sm" className="px-0" asChild>
                        <Link to="/yonetim/kesifler">Keşifler ekranında aç</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <p className="text-muted-foreground">Teklifler</p>
                {quotes.length === 0 ? (
                  <p className="text-muted-foreground">Henüz teklif verilmedi.</p>
                ) : (
                  quotes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                      <span>
                        Teklif #{q.quote_no} · {QUOTE_STATUS[q.status as keyof typeof QUOTE_STATUS]}
                        <span className="block text-xs text-muted-foreground">{tl(q.grand_total)}</span>
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/yonetim/teklifler/$id" params={{ id: q.id }}>
                          Aç
                        </Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fırsat işaretle</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) createOpportunity.mutate(e.target.value);
                }}
              >
                <option value="">Fırsat türü seçin</option>
                {Object.entries(OPPORTUNITY_TYPE).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fırsat işaretle</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) createOpportunity.mutate(e.target.value);
                }}
              >
                <option value="">Fırsat türü seçin</option>
                {Object.entries(OPPORTUNITY_TYPE).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fotoğraf ve videolar</CardTitle>
          </CardHeader>
          <CardContent>
            {fileLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Dosya yüklenmemiş.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {fileLinks.map((f) =>
                  f.isVideo ? (
                    <video key={f.path} src={f.url} controls className="h-32 w-full rounded-md object-cover" />
                  ) : (
                    <a key={f.path} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt="Talep fotoğrafı" className="h-32 w-full rounded-md object-cover" />
                    </a>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşlem geçmişi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Görüşme notu, arama sonucu…"
                maxLength={2000}
                rows={3}
              />
              <Button size="sm" onClick={() => addNote.mutate()} disabled={addNote.isPending}>
                Not ekle
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              {activities.length === 0 ? (
                <p className="text-muted-foreground">Henüz kayıt yok.</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="rounded-md border px-3 py-2">
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("tr-TR")}</p>
                    <p>
                      {a.activity_type === "status_change"
                        ? `Durum: ${REQUEST_STATUS[a.old_status as keyof typeof REQUEST_STATUS] ?? "—"} → ${
                            REQUEST_STATUS[a.new_status as keyof typeof REQUEST_STATUS] ?? "—"
                          }`
                        : a.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
