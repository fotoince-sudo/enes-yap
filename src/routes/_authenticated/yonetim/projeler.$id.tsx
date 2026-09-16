import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { uploadRequestFiles, signedUrl } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHOTO_PHASE, PROJECT_STATUS, tl } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/yonetim/projeler/$id")({
  component: ProjectDetail,
  errorComponent: ({ error }) => <p className="text-sm text-destructive">Proje açılamadı: {error.message}</p>,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<keyof typeof PHOTO_PHASE>("once");
  const [uploading, setUploading] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [partnerRole, setPartnerRole] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*, customers(full_name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["project-photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_photos")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const withUrls = await Promise.all(
        (data ?? []).map(async (p) => ({ ...p, viewUrl: p.url.startsWith("http") ? p.url : await signedUrl(p.url) })),
      );
      return withUrls;
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ["partners-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("id, name, partner_type").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assigned = [] } = useQuery({
    queryKey: ["project-partners", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_partners")
        .select("id, role, agreed_cost, partners(name, partner_type)")
        .eq("project_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from("projects").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignPartner = useMutation({
    mutationFn: async () => {
      if (!partnerId) throw new Error("Ekip seçin.");
      const { error } = await supabase.from("project_partners").insert({
        project_id: id,
        partner_id: partnerId,
        role: partnerRole || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPartnerId("");
      setPartnerRole("");
      queryClient.invalidateQueries({ queryKey: ["project-partners", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeAssignment = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("project_partners").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-partners", id] }),
  });

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadRequestFiles(Array.from(files), "foto");
      const { error } = await supabase
        .from("project_photos")
        .insert(uploaded.map((u) => ({ project_id: id, phase, url: u.path })));
      if (error) throw error;
      toast.success("Fotoğraflar eklendi.");
      queryClient.invalidateQueries({ queryKey: ["project-photos", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
    }
  };

  const togglePublic = useMutation({
    mutationFn: async ({ photoId, value }: { photoId: string; value: boolean }) => {
      const { error } = await supabase.from("project_photos").update({ is_public: value }).eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-photos", id] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (!project) return <p className="text-sm text-muted-foreground">Proje bulunamadı.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            #{project.project_no} · {project.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {(project.customers as { full_name: string } | null)?.full_name ?? "Müşteri seçilmedi"} ·{" "}
            {tl(project.contract_total)}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/yonetim/projeler">Listeye dön</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proje bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-title">Başlık</Label>
              <Input id="p-title" defaultValue={project.title} onBlur={(e) => update.mutate({ title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="p-status">Durum</Label>
              <select
                id="p-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={project.status}
                onChange={(e) => update.mutate({ status: e.target.value })}
              >
                {Object.entries(PROJECT_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-contract">Sözleşme tutarı</Label>
              <Input
                id="p-contract"
                type="number"
                defaultValue={Number(project.contract_total)}
                onBlur={(e) => update.mutate({ contract_total: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="p-cost">Maliyet</Label>
              <Input
                id="p-cost"
                type="number"
                defaultValue={Number(project.cost_total)}
                onBlur={(e) => update.mutate({ cost_total: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="p-paid">Tahsil edilen</Label>
              <Input
                id="p-paid"
                type="number"
                defaultValue={Number(project.paid_total)}
                onBlur={(e) => update.mutate({ paid_total: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="p-start">Başlangıç</Label>
              <Input
                id="p-start"
                type="date"
                defaultValue={project.start_date ?? ""}
                onBlur={(e) => update.mutate({ start_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="p-est">Tahmini bitiş</Label>
              <Input
                id="p-est"
                type="date"
                defaultValue={project.estimated_end_date ?? ""}
                onBlur={(e) => update.mutate({ estimated_end_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor="p-end">Gerçek bitiş</Label>
              <Input
                id="p-end"
                type="date"
                defaultValue={project.actual_end_date ?? ""}
                onBlur={(e) => update.mutate({ actual_end_date: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-pay">Ödeme bilgileri</Label>
              <Textarea
                id="p-pay"
                defaultValue={project.payment_notes ?? ""}
                onBlur={(e) => update.mutate({ payment_notes: e.target.value || null })}
                rows={2}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-notes">Notlar</Label>
              <Textarea
                id="p-notes"
                defaultValue={project.notes ?? ""}
                onBlur={(e) => update.mutate({ notes: e.target.value || null })}
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={project.is_public_reference}
                onChange={(e) => update.mutate({ is_public_reference: e.target.checked })}
              />
              Web sitesinde referans proje olarak göster
            </label>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ekipler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {assigned.length === 0 ? (
                <p className="text-muted-foreground">Ekip atanmadı.</p>
              ) : (
                assigned.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span>
                      {(a.partners as { name: string } | null)?.name} {a.role ? `· ${a.role}` : ""}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => removeAssignment.mutate(a.id)}>
                      Kaldır
                    </Button>
                  </div>
                ))
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                >
                  <option value="">Usta / ekip seçin</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.partner_type})
                    </option>
                  ))}
                </select>
                <Input placeholder="Görev" value={partnerRole} onChange={(e) => setPartnerRole(e.target.value)} />
                <Button className="sm:col-span-3" variant="outline" onClick={() => assignPartner.mutate()}>
                  Ekibi projeye ekle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotoğraflar (önce / uygulama / sonra)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value as keyof typeof PHOTO_PHASE)}
                >
                  {Object.entries(PHOTO_PHASE).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <Input type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(e.target.files)} />
              </div>
              {uploading ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <div key={p.id} className="space-y-1">
                    {p.viewUrl ? (
                      <img src={p.viewUrl} alt={PHOTO_PHASE[p.phase as keyof typeof PHOTO_PHASE]} className="h-28 w-full rounded-md object-cover" />
                    ) : null}
                    <p className="text-xs text-muted-foreground">{PHOTO_PHASE[p.phase as keyof typeof PHOTO_PHASE]}</p>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={p.is_public}
                        onChange={(e) => togglePublic.mutate({ photoId: p.id, value: e.target.checked })}
                      />
                      Sitede göster
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
