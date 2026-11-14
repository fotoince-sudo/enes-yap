import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSolutionPartner } from "@/lib/solution-partner.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/cozum-ortagi")({
  head: () => pageHead({
    path: "/cozum-ortagi",
    title: "Çözüm Ortağı Başvurusu | Enes Yapı",
    description: "Tadilat, yenileme ve uygulama işleri için Enes Yapı çözüm ortaklığına başvurun.",
  }),
  component: CozumOrtagiPage,
});

const alanlar = [
  { ad: "firma", etiket: "Firma veya ekip adı", otomatik: "organization", uzunluk: 120 },
  { ad: "yetkili", etiket: "Yetkili adı soyadı", otomatik: "name", uzunluk: 120 },
  { ad: "telefon", etiket: "Telefon", otomatik: "tel", tur: "tel", uzunluk: 30 },
  { ad: "eposta", etiket: "E-posta", otomatik: "email", tur: "email", uzunluk: 255 },
  { ad: "uzmanlik", etiket: "Hizmet veya uzmanlık", uzunluk: 160 },
  { ad: "bolge", etiket: "Çalıştığınız il ve ilçeler", uzunluk: 160 },
];

function CozumOrtagiPage() {
  const [alindi, setAlindi] = useState(false);
  const basvuru = useMutation({ mutationFn: saveSolutionPartner, onSuccess: () => setAlindi(true) });

  function gonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (basvuru.isPending) return;
    const form = new FormData(event.currentTarget);
    if (form.get("onay") !== "on") return;
    const metin = (ad: string) => String(form.get(ad) ?? "").trim();
    basvuru.mutate({
      data: {
        firma: metin("firma"),
        yetkili: metin("yetkili"),
        telefon: metin("telefon"),
        eposta: metin("eposta"),
        uzmanlik: metin("uzmanlik"),
        bolge: metin("bolge"),
        not: metin("not"),
        onay: true,
      },
    });
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <h1 className="font-display text-3xl font-semibold">Enes Yapı çözüm ortaklığı</h1>
        <p className="mt-3 text-muted-foreground">
          Tadilat, yenileme ve uygulama işleri için firmanız veya ekibiniz adına ücretsiz başvurun.
        </p>
        {alindi ? (
          <p role="status" className="mt-6 rounded-lg border bg-card p-5">
            Başvurunuz alındı. Ekibimiz incelemenin ardından sizinle iletişime geçecek.
          </p>
        ) : (
          <form onSubmit={gonder} className="mt-6 grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 sm:p-6">
            {alanlar.map(({ ad, etiket, otomatik, tur, uzunluk }) => (
              <label key={ad} className="grid gap-1.5 text-sm font-medium">
                {etiket}
                <Input name={ad} type={tur ?? "text"} autoComplete={otomatik}
                  minLength={ad === "telefon" ? 10 : 2} maxLength={uzunluk} required />
              </label>
            ))}
            <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
              Ek bilgi
              <Textarea name="not" maxLength={1000} rows={3} />
            </label>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="onay" required className="mt-1" />
              Enes Yapı’nın başvurumu değerlendirmek için benimle iletişime geçmesini kabul ediyorum.
            </label>
            {basvuru.isError && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {basvuru.error.message || "Başvuru gönderilemedi. Bilgilerinizi kontrol edip tekrar deneyin."}
              </p>
            )}
            <Button type="submit" disabled={basvuru.isPending}>
              {basvuru.isPending ? "Gönderiliyor…" : "Başvuruyu gönder"}
            </Button>
          </form>
        )}
      </section>
    </SiteShell>
  );
}
