import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { uploadRequestFiles } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUDGET_RANGES, OPPORTUNITY_TYPE, PROPERTY_TYPES, START_TIMES } from "@/lib/domain";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ad soyad giriniz.").max(120),
  phone: z.string().trim().min(10, "Geçerli bir telefon giriniz.").max(30),
  email: z.string().trim().email("Geçerli bir e-posta giriniz.").max(255).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  neighborhood: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(400).optional().or(z.literal("")),
  property_type: z.string().max(80).optional().or(z.literal("")),
  service_category_id: z.string().optional().or(z.literal("")),
  area_m2: z.string().optional().or(z.literal("")),
  budget_range: z.string().max(80).optional().or(z.literal("")),
  desired_start: z.string().max(80).optional().or(z.literal("")),
  opportunity_type: z.string().optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

const initial = {
  full_name: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  neighborhood: "",
  address: "",
  property_type: "",
  service_category_id: "",
  area_m2: "",
  budget_range: "",
  desired_start: "",
  opportunity_type: "",
  description: "",
};

export function RequestForm() {
  const [form, setForm] = useState({ ...initial });
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [done, setDone] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Formu kontrol edin.");
      const v = parsed.data;

      const photoUploads = photos.length ? await uploadRequestFiles(photos, "foto") : [];
      const videoUploads = videos.length ? await uploadRequestFiles(videos, "video") : [];
      const category = categories.find((c) => c.id === v.service_category_id);

      const { error } = await supabase.from("renovation_requests").insert({
        full_name: v.full_name,
        phone: v.phone,
        email: v.email || null,
        city: v.city || null,
        district: v.district || null,
        neighborhood: v.neighborhood || null,
        address: v.address || null,
        property_type: v.property_type || null,
        service_category_id: v.service_category_id || null,
        renovation_type: category?.name ?? null,
        area_m2: v.area_m2 ? Number(v.area_m2) : null,
        budget_range: v.budget_range || null,
        desired_start: v.desired_start || null,
        opportunity_type: (v.opportunity_type || null) as never,
        description: v.description || null,
        photo_urls: photoUploads,
        video_urls: videoUploads,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ ...initial });
      setPhotos([]);
      setVideos([]);
      setDone(true);
      toast.success("Talebiniz alındı. En kısa sürede sizi arayacağız.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof typeof initial) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (done) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold">Talebiniz alındı</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ekibimiz talebinizi inceleyip keşif planlaması için sizinle iletişime geçecek.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setDone(false)}>
          Yeni talep oluştur
        </Button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <div>
        <Label htmlFor="f-name">Ad soyad *</Label>
        <Input id="f-name" value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="f-phone">Telefon *</Label>
        <Input id="f-phone" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} required />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="f-email">E-posta</Label>
        <Input id="f-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="f-city">İl</Label>
        <Input id="f-city" value={form.city} onChange={(e) => set("city")(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="f-district">İlçe</Label>
        <Input id="f-district" value={form.district} onChange={(e) => set("district")(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="f-hood">Mahalle</Label>
        <Input id="f-hood" value={form.neighborhood} onChange={(e) => set("neighborhood")(e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="f-address">Açık adres</Label>
        <Input
          id="f-address"
          value={form.address}
          onChange={(e) => set("address")(e.target.value)}
          placeholder="Sokak, bina, daire no"
        />
      </div>
      <div>
        <Label htmlFor="f-ptype">Gayrimenkul tipi</Label>
        <select
          id="f-ptype"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.property_type}
          onChange={(e) => set("property_type")(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="f-cat">Tadilat türü</Label>
        <select
          id="f-cat"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.service_category_id}
          onChange={(e) => set("service_category_id")(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="f-area">Yaklaşık m²</Label>
        <Input id="f-area" type="number" min="0" value={form.area_m2} onChange={(e) => set("area_m2")(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="f-budget">Tahmini bütçe</Label>
        <select
          id="f-budget"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.budget_range}
          onChange={(e) => set("budget_range")(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {BUDGET_RANGES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="f-start">İstenen başlangıç</Label>
        <select
          id="f-start"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.desired_start}
          onChange={(e) => set("desired_start")(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {START_TIMES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="f-opp">Amacınız</Label>
        <select
          id="f-opp"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.opportunity_type}
          onChange={(e) => set("opportunity_type")(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {Object.entries(OPPORTUNITY_TYPE).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="f-desc">Açıklama</Label>
        <Textarea
          id="f-desc"
          rows={4}
          maxLength={2000}
          placeholder="Yapılmasını istediğiniz işleri kısaca anlatın."
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="f-photos">Fotoğraflar (en fazla 15 MB)</Label>
        <Input
          id="f-photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
        />
      </div>
      <div>
        <Label htmlFor="f-videos">Video (en fazla 90 MB)</Label>
        <Input
          id="f-videos"
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => setVideos(Array.from(e.target.files ?? []))}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full" size="lg" disabled={submit.isPending}>
          {submit.isPending ? "Gönderiliyor…" : "Tadilat talebi oluştur"}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Bilgileriniz yalnızca talebinizin değerlendirilmesi için kullanılır.
        </p>
      </div>
    </form>
  );
}
