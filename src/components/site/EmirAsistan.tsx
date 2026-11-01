import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { DISTRICTS, SERVICES, SITE } from "@/lib/seo";

/**
 * Emir — Enes Yapı yazışma asistanı (Enes Emlak'taki Derya gibi).
 * Ücretli yapay zekâ kullanmaz: hazır seçenekler + anahtar kelimeyle eşleşen gerçek bilgiler (seo.ts) verir,
 * ayrıntı için talep formuna ve yetkiliye yönlendirir.
 */

type Mesaj = { id: number; kim: "emir" | "ben"; metin: string };

const ACILIS =
  "Merhaba, ben Emir. Enes Yapı dijital asistanıyım. Tadilat, yenileme ve keşif konusunda size yardımcı olabilirim. Aşağıdan bir konu seçin ya da sorunuzu yazın.";

const SECENEKLER = [
  "Tadilat teklifi almak istiyorum",
  "Hangi hizmetleri veriyorsunuz?",
  "Hangi bölgelere geliyorsunuz?",
  "Keşif ve fiyat nasıl belirleniyor?",
  "Yetkili ile görüşmek istiyorum",
] as const;

const yetkili = () => `Yetkilimize doğrudan ulaşabilirsiniz: 📞 ${SITE.phoneDisplay} (${SITE.openingHours}).`;
const formaYonlendir =
  "En hızlısı sayfadaki talep formunu doldurmanız: işin türünü, yaklaşık m²'yi ve varsa fotoğrafları ekleyin, size dönüş yapalım.";

const kucuk = (s: string) => s.toLocaleLowerCase("tr-TR");

function yanitBul(soru: string): { metin: string; formaGit?: boolean } {
  const s = kucuk(soru);
  if (s.includes("teklif") || s.includes("talep"))
    return { metin: `${formaYonlendir} Keşif sonrası net fiyat verilir.`, formaGit: true };
  if (s.includes("yetkili") || s.includes("telefon") || /(^|\s)ara(y|r|ma|bilir|ın|$)/.test(s) || s.includes("görüş") || s.includes("numara"))
    return { metin: yetkili() };
  if (s.includes("bölge") || s.includes("ilçe") || s.includes("nereye") || s.includes("hangi yer"))
    return {
      metin: `İzmir'de şu bölgelerde hizmet veriyoruz: ${DISTRICTS.map((d) => d.name).join(", ")}. Ofisimiz ${SITE.district}'ta (${SITE.street}).`,
    };
  const ilce = DISTRICTS.find((d) => s.includes(kucuk(d.name)));
  if (ilce) return { metin: `Evet, ${ilce.name}'da hizmet veriyoruz. ${ilce.note}` };
  if (s.includes("keşif") || s.includes("kesif") || s.includes("fiyat") || s.includes("ücret") || s.includes("kaç para") || s.includes("bütçe"))
    return {
      metin:
        "Fiyat; alanın durumu, iş kapsamı, ölçüler ve malzeme tercihleri yerinde görüldükten sonra belirlenir. Talebinizi aldıktan sonra sizi arar, uygun bir keşif zamanı planlarız.",
      formaGit: true,
    };
  if (s.includes("süre") || s.includes("ne kadar sür") || s.includes("kaç gün") || s.includes("ne zaman"))
    return {
      metin: "Süre işin kapsamına göre değişir; keşifte iş planını ve takvimi birlikte netleştiriyoruz.",
      formaGit: true,
    };
  const hizmet = SERVICES.find((h) => kucuk(h.name).split(" ").some((k) => k.length > 3 && s.includes(k)));
  if (hizmet) return { metin: `${hizmet.name}: ${hizmet.intro}`, formaGit: true };
  if (s.includes("hizmet") || s.includes("ne yap") || s.includes("neler"))
    return { metin: `Verdiğimiz hizmetler: ${SERVICES.map((h) => h.name).join(", ")}.` };
  if (s.includes("ilan") || s.includes("satılık") || s.includes("kiralık") || s.includes("ev arıyorum") || s.includes("emlak"))
    return {
      metin:
        "Satılık ve kiralık gayrimenkul için kardeş firmamız Enes Emlak'a bakabilirsiniz: izmirenesemlak.com.tr. Menüdeki \"İlan Ara\" ve \"İlan Ver\" sizi oraya götürür.",
    };
  return { metin: `Mesajınızı aldım. ${formaYonlendir} ${yetkili()}`, formaGit: true };
}

export function EmirAsistan() {
  const [acik, setAcik] = useState(false);
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([{ id: 0, kim: "emir", metin: ACILIS }]);
  const [yazi, setYazi] = useState("");
  const [yaziyor, setYaziyor] = useState(false);
  const [formaGit, setFormaGit] = useState(false);
  const alt = useRef<HTMLDivElement>(null);
  const sayac = useRef(1);

  useEffect(() => {
    alt.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, yaziyor]);

  const gonder = (metin: string) => {
    const t = metin.trim();
    if (!t || yaziyor) return;
    setMesajlar((m) => [...m, { id: sayac.current++, kim: "ben", metin: t }]);
    setYazi("");
    setYaziyor(true);
    const y = yanitBul(t);
    setTimeout(() => {
      setMesajlar((m) => [...m, { id: sayac.current++, kim: "emir", metin: y.metin }]);
      setFormaGit(Boolean(y.formaGit));
      setYaziyor(false);
    }, 700);
  };

  const talepFormu = () => {
    setAcik(false);
    if (document.getElementById("talep")) {
      document.getElementById("talep")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#talep";
    }
  };

  return (
    <>
      {!acik && (
        <button
          type="button"
          onClick={() => setAcik(true)}
          aria-label="Emir'e sor"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
        >
          <MessageCircle className="size-5" />
          Emir'e sor
        </button>
      )}
      {acik && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[380px]">
          <div className="flex items-center justify-between gap-3 border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground font-bold text-primary">E</span>
              <div className="leading-tight">
                <p className="font-semibold">Emir</p>
                <p className="text-xs opacity-80">Enes Yapı asistanı</p>
              </div>
            </div>
            <button type="button" onClick={() => setAcik(false)} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-primary-foreground/15">
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {mesajlar.map((m) => (
              <div key={m.id} className={m.kim === "ben" ? "flex justify-end" : "flex"}>
                <p
                  className={
                    m.kim === "ben"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                  }
                >
                  {m.metin}
                </p>
              </div>
            ))}
            {yaziyor && <p className="text-xs text-muted-foreground">Emir yazıyor…</p>}
            {!yaziyor && mesajlar.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SECENEKLER.map((s) => (
                  <button key={s} type="button" onClick={() => gonder(s)} className="rounded-full border px-3 py-1.5 text-left text-xs hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {!yaziyor && formaGit && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={talepFormu} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  Talep formunu aç
                </button>
                <a href={`tel:${SITE.phoneE164}`} className="rounded-full border px-3 py-1.5 text-xs">
                  Ara: {SITE.phoneDisplay}
                </a>
              </div>
            )}
            <div ref={alt} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              gonder(yazi);
            }}
            className="flex items-center gap-2 border-t p-3"
          >
            <input
              value={yazi}
              onChange={(e) => setYazi(e.target.value)}
              placeholder="Sorunuzu yazın…"
              maxLength={300}
              className="h-10 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:border-primary"
            />
            <button type="submit" aria-label="Gönder" className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
