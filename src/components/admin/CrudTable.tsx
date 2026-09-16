import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type FieldType = "text" | "number" | "textarea" | "select" | "date" | "time" | "boolean" | "tags";

export type CrudField = {
  key: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  inList?: boolean;
  required?: boolean;
  placeholder?: string;
  /** Listede özel gösterim */
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

type Props = {
  table: string;
  title: string;
  description?: string;
  fields: CrudField[];
  orderBy?: { column: string; ascending?: boolean };
  searchKeys?: string[];
};

const emptyValue = (f: CrudField) => {
  if (f.type === "boolean") return false;
  if (f.type === "tags") return "";
  return "";
};

export function CrudTable({ table, title, description, fields, orderBy, searchKeys = [] }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");

  const listFields = fields.filter((f) => f.inList !== false).slice(0, 6);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["crud", table],
    queryFn: async () => {
      const order = orderBy ?? { column: "created_at", ascending: false };
      const { data, error } = await (supabase.from(table as never) as any)
        .select("*")
        .order(order.column, { ascending: order.ascending ?? false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    const keys = searchKeys.length ? searchKeys : fields.map((f) => f.key);
    return rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, search, searchKeys, fields]);

  const save = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        let v = values[f.key];
        if (f.type === "number") v = v === "" || v === null || v === undefined ? null : Number(v);
        else if (f.type === "tags") {
          v = typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : (v ?? []);
        } else if (f.type === "boolean") v = Boolean(v);
        else if (v === "") v = null;
        payload[f.key] = v;
      }
      if (editing?.['id']) {
        const { error } = await (supabase.from(table as never) as any).update(payload).eq("id", editing['id']);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from(table as never) as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Kayıt kaydedildi.");
      queryClient.invalidateQueries({ queryKey: ["crud", table] });
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table as never) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kayıt silindi.");
      queryClient.invalidateQueries({ queryKey: ["crud", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)])));
    setOpen(true);
  };

  const openEdit = (row: Record<string, any>) => {
    setEditing(row);
    setForm(
      Object.fromEntries(
        fields.map((f) => [f.key, f.type === "tags" ? (row[f.key] ?? []).join(", ") : (row[f.key] ?? emptyValue(f))]),
      ),
    );
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara…"
            className="w-40 sm:w-56"
          />
          <Button onClick={openNew}>Yeni kayıt</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {listFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={listFields.length + 1}>Yükleniyor…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={listFields.length + 1} className="text-muted-foreground">
                  Kayıt yok.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row['id']}>
                  {listFields.map((f) => (
                    <TableCell key={f.key} className="max-w-[240px] truncate">
                      {f.render ? (
                        f.render(row)
                      ) : f.type === "boolean" ? (
                        <Badge variant={row[f.key] ? "default" : "secondary"}>{row[f.key] ? "Evet" : "Hayır"}</Badge>
                      ) : f.type === "select" ? (
                        (f.options?.find((o) => o.value === row[f.key])?.label ?? row[f.key] ?? "—")
                      ) : Array.isArray(row[f.key]) ? (
                        row[f.key].join(", ") || "—"
                      ) : (
                        String(row[f.key] ?? "—")
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="space-x-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Bu kaydı silmek istiyor musunuz?")) remove.mutate(row['id']);
                      }}
                    >
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Kaydı düzenle" : "Yeni kayıt"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    rows={3}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={f.key}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">Seçiniz</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "boolean" ? (
                  <div className="mt-2">
                    <input
                      id={f.key}
                      type="checkbox"
                      checked={Boolean(form[f.key])}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    />
                  </div>
                ) : (
                  <Input
                    id={f.key}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
                {f.type === "tags" ? (
                  <p className="mt-1 text-xs text-muted-foreground">Virgülle ayırarak yazın.</p>
                ) : null}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
