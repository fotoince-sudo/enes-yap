import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM_PROMPT = `Adın Emir. Enes Yapı'nın site asistanısın. Enes Yapı; İzmir Bayraklı merkezli tadilat, yenileme, bakım, onarım ve anahtar teslim uygulama firmasıdır (Enes Emlak'tan bağımsızdır, mimarlık ofisi değildir).

Görevin: siteyi ziyaret eden kişilere Türkçe, kısa ve net yazılı cevaplar vermek; hizmetleri anlatmak, süreci açıklamak ve talep oluşturmaya yönlendirmek.

Süreç: 1) Talep oluşturma 2) Keşif (yerinde ölçü) 3) Kalem kalem teklif 4) Uygulama 5) Teslim (önce/sonra kaydı).
Hizmetler: banyo ve mutfak yenileme, boya, alçı, alçıpan, seramik ve zemin, sıhhi tesisat, elektrik, mantolama ve dış cephe, çatı ve izolasyon, komple daire/ofis yenileme.
Çalışma bölgesi: İzmir ve ilçeleri.
İletişim: 0533 399 25 40 (telefon ve WhatsApp: https://wa.me/905333992540), adres Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir.

Kurallar:
- Asla fiyat, metrekare birim fiyatı veya süre taahhüdü verme. Fiyat sorulursa: keşif sonrası kalem kalem net teklif verildiğini söyle ve talep formuna ya da WhatsApp'a yönlendir.
- Bilmediğin bir şeyi uydurma; ekibin dönüş yapacağını söyle.
- 2-4 cümleyi geçme, sade bir dil kullan, madde işareti gerekiyorsa kısa tut.
- Uygun olduğunda "Sayfadaki 'Tadilat talebi oluştur' formunu doldurabilirsiniz" diye yönlendir.`;

export const askEmir = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { reply: "Şu anda yazılı asistan devre dışı. 0533 399 25 40 numarasından bize ulaşabilirsiniz." };
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return { reply: "Şu an yoğunluk var, biraz sonra tekrar deneyin. Acil ise: 0533 399 25 40." };
        }
        console.error("AI gateway error", res.status, await res.text());
        return { reply: "Bir aksaklık oldu. WhatsApp'tan yazabilirsiniz: 0533 399 25 40." };
      }

      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const reply = json.choices?.[0]?.message?.content?.trim();
      return { reply: reply || "Bunu tam anlayamadım, biraz daha açabilir misiniz?" };
    } catch (err) {
      console.error("AI gateway request failed", err);
      return { reply: "Bağlantı kurulamadı. 0533 399 25 40 numarasından bize ulaşabilirsiniz." };
    }
  });
