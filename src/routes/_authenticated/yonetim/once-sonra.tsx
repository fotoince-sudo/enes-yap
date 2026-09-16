import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trDate } from "@/lib/domain";
import { signedUrl, uploadRequestFiles } from "@/lib/uploads";

export const Route = createFileRoute("/_authenticated/yonetim/once-sonra")({
  component: BeforeAfter,
});

type Row = {
  id: string;
  project_id: string | null;
  work_type: string | null;
  title: string | null;
  before_url: string | null;
  after_url: string | null;
  progress_urls: unknown;
  description: string | null;
  happened_on: string | null;
  is_published: boolean;
};

function Thumb({ path, label }: { path: string | null; label: string }) {
  const { data: url } = useQuery({
    queryKey: ["ba-url", path],
    queryFn: () => (path ? signedUrl(path) : null),
    enabled: Boolean(path),
  });
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {url ? (
        <img src={url} alt={label} className="h-32 w-full rounded-md border object-cover" loading="lazy" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border text-xs text-muted-foreground">
          Fotoğraf yok
        </div>
      )}
    </div>
  );
}

const emptyForm = {
  project_id: "",
  work_type: "",
  title: "",
  description: "",
  happened_on: "",
  is_published: false,
};

function BeforeAfter() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({ ...emptyForm });
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [progressFiles, setProgressFiles] = useState<File[]>([]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, project_no")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["before-after"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("before_after")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        project_id: form['project_id'] || null,
        work_type: form['work_type'] || null,
        title: form['title'] || null,
        description: form['description'] || null,
        happened_on: form['happened_on'] || null,
        is_published: Boolean(form['is_published']),
      };
      if (beforeFile) payload['before_url'] = (await uploadRequestFiles([beforeFile], "foto"))[0]!.path;
      if (afterFile) payload['after_url'] = (await uploadRequestFiles([afterFile], "foto"))[0]!.path;
      if (progressFiles.length) {
        const uploaded = await uploadRequestFiles(progressFiles, "foto");
        payload['progress_urls'] = uploaded.map((u) => u.path);
      }
      if (editingId) {
        const { error } = await supabase.from("before_after").update(payload as never).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("before_after").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Kayıt kaydedildi.");
      queryClient.invalidateQueries({ queryKey: ["before-after"] });
      setOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setBeforeFile(null);
      setAfterFile(null);
      setProgressFiles([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("before_after").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kayıt silindi.");
      queryClient.invalidateQueries({ queryKey: ["before-after"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await supabase
        .from("before_after")
        .update({ is_published: !row.is_published })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["before-after"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Önce / Sonra</h1>
          <p className="text-sm text-muted-foreground">
            Tamamlanan işlerin önce, uygulama sırası ve sonra fotoğrafları. Yayında olan kayıtlar referans galerisinde
            kullanılabilir.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm({ ...emptyForm });
            setOpen(true);
          }}
        >
          Yeni kayıt
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz önce/sonra kaydı yok.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => {
            const progress = Array.isArray(row.progress_urls) ? (row.progress_urls as string[]) : [];
            return (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    {row.title ?? row.work_type ?? "Kayıt"}
                    <Badge variant={row.is_published ? "default" : "secondary"}>
                      {row.is_published ? "Yayında" : "Gizli"}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {projects.find((p) => p.id === row.project_id)?.title ?? "Proje bağlı değil"} ·{" "}
                    {trDate(row.happened_on)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3">
                    <Thumb path={row.before_url} label="Önce" />
                    <Thumb path={progress[0] ?? null} label="Uygulama" />
                    <Thumb path={row.after_url} label="Sonra" />
                  </div>
                  {row.description ? <p className="text-sm text-muted-foreground">{row.description}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(row.id);
                        setForm({
                          project_id: row.project_id ?? "",
                          work_type: row.work_type ?? "",
                          title: row.title ?? "",
                          description: row.description ?? "",
                          happened_on: row.happened_on ?? "",
                          is_published: row.is_published,
                        });
                        setBeforeFile(null);
                        setAfterFile(null);
                        setProgressFiles([]);
                        setOpen(true);
                      }}
                    >
                      Düzenle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(row)}>
                      {row.is_published ? "Gizle" : "Yayınla"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Bu kaydı silmek istiyor musunuz?")) remove.mutate(row.id);
                      }}
                    >
                      Sil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Kaydı düzenle" : "Yeni önce / sonra kaydı"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ba-project">Proje</Label>
              <select
                id="ba-project"
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form['project_id'] ?? ""}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              >
                <option value="">Seçiniz</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.project_no} — {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ba-work">İş türü</Label>
              <Input
                id="ba-work"
                value={form['work_type'] ?? ""}
                onChange={(e) => setForm({ ...form, work_type: e.target.value })}
                placeholder="Banyo yenileme"
              />
            </div>
            <div>
              <Label htmlFor="ba-title">Başlık</Label>
              <Input
                id="ba-title"
                value={form['title'] ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ba-date">Tarih</Label>
              <Input
                id="ba-date"
                type="date"
                value={form['happened_on'] ?? ""}
                onChange={(e) => setForm({ ...form, happened_on: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ba-desc">Açıklama</Label>
              <Textarea
                id="ba-desc"
                rows={3}
                value={form['description'] ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ba-before">Önce fotoğrafı</Label>
              <Input
                id="ba-before"
                type="file"
                accept="image/*"
                onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="ba-after">Sonra fotoğrafı</Label>
              <Input
                id="ba-after"
                type="file"
                accept="image/*"
                onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ba-progress">Uygulama sırası fotoğrafları</Label>
              <Input
                id="ba-progress"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setProgressFiles(Array.from(e.target.files ?? []))}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="ba-pub"
                type="checkbox"
                checked={Boolean(form['is_published'])}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              <Label htmlFor="ba-pub">Yayında</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
