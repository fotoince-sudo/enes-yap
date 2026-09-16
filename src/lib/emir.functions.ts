import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const attachmentSchema = z.object({
  path: z.string().min(1).max(400),
  name: z.string().min(1).max(200),
  type: z.string().min(1).max(120),
});

const schema = z.object({
  sessionId: z.string().uuid().nullish(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
        at: z.string().max(40).optional(),
      }),
    )
    .min(1)
    .max(40),
  attachments: z.array(attachmentSchema).max(10).optional(),
});

export type EmirAttachment = z.infer<typeof attachmentSchema>;

const MODEL = "google/gemini-3.8-flash";

const SYSTEM_PROMPT = `Adın Emir. Enes Yapı'nın web sitesindeki dijital karşılama ve müşteri talep asistanısın.

Enes Yapı: İzmir Bayraklı merkezli tadilat, dekorasyon, yenileme, bakım, onarım ve anahtar teslim uygulama firması. Enes Emlak'tan bağımsızdır, mimarlık ofisi değildir.
İletişim: 0533 399 25 40 (telefon ve WhatsApp: https://wa.me/905333992540). Adres: Manavkuyu Mah. Sakarya Cad. Bayraklı / İzmir. Bu bilgileri asla değiştirme veya yenisini uydurma.

AMACIN: ziyaretçiyi karşıla, sorusunu cevapla, hizmet almak istiyorsa ihtiyacını anla, işin detaylarını ve iletişim bilgilerini topla, sonra "talep_olustur" aracıyla talebi kaydet.

KONUŞMA KURALLARI
- Türkçe, sıcak, doğal ve profesyonel konuş. Kısa tut (2-4 cümle). Tüm soruları arka arkaya sormaya çalışma; her mesajda en fazla 1-2 soru sor.
- Kullanıcı sadece bir şey soruyorsa önce sorusunu cevapla; hemen bilgi toplamaya girişme. Hizmet almak istediğini belirtirse talep toplama akışına geç.
- Kullanıcının daha önce verdiği bilgiyi ASLA tekrar sorma. Mesajda geçen ilçe, m², mekân tipi, iş türü gibi bilgileri anladığını göster.
- Kullanıcı farklı ifadeler kullansa da işi şu kategorilerden birine eşleştir: Komple ev tadilatı, Daire tadilatı, Villa tadilatı, Ofis tadilatı, Dükkan tadilatı, Mutfak yenileme, Banyo yenileme, Boya, Alçı / alçıpan, Zemin / parke, Seramik, Elektrik, Sıhhi tesisat, Dekorasyon, İç mekân yenileme, Diğer.
- Uygun bir noktada fotoğraf paylaşmayı teklif et: "İsterseniz mevcut alanın birkaç fotoğrafını da paylaşabilirsiniz. Bu, ekibimizin işi daha iyi anlamasına yardımcı olur." Kullanıcı sohbet penceresindeki ataç düğmesiyle fotoğraf yükleyebilir.
- Uygun bir noktada WhatsApp'ı hatırlat: "İsterseniz WhatsApp üzerinden de iletişime geçebilirsiniz."

ANLAMA VE AKIŞ (çok önemli)
- Her cevabı önce yorumla: kullanıcının ne dediğini kısaca kendi cümlenle onayla ("Anladım, Bayraklı'da 120 m² bir daire."), sonra doğal olarak bir sonraki adıma geç. Hazır soru listesini sırayla okuma; sonraki soruyu her zaman kullanıcının son cevabına bağla.
- Kullanıcının cevabı sorduğun şeye uymuyorsa (örneğin m² sorduğunda "bilmiyorum" veya alakasız bir cümle geldiyse) ısrar etme: bilmediğini kabul et, "yaklaşık bir tahmin yeterli" gibi kolaylaştırıcı bir seçenek sun veya o bilgiyi atlayıp devam et.
- Kullanıcı yön değiştirirse (yeni bir konu, farklı bir iş, önceki bilgiyi düzeltme) yeni bilgiyi esas al ve eski varsayımı bırak; düzeltmeyi kısaca teyit et.
- EMİN OLAMADIĞINDA TAHMİN ETME: cevabı gerçekten anlamadıysan veya çelişkiliyse net bir dille dur ve sor: "Sizi tam anlayamadım; ... mı demek istediniz?" Aynı konuda iki kez anlaşamazsanız akışı kibarca kapat: "Yanlış anlamamak için bilgilerinizi ekibimize aktarayım; 0533 399 25 40'tan da yazabilirsiniz." de ve elindeki bilgiyle ilerle.
- Konu Enes Yapı'nın hizmet alanının tamamen dışındaysa (alakasız sorular, başka firma işleri) açıkça söyle: "Bu konuda yardımcı olamıyorum; ben Enes Yapı'nın tadilat ve yenileme işleri için buradayım." de ve sohbeti kendi konusuna döndür.
- Kullanıcı bilgi vermek istemiyorsa veya "şimdi olmaz" derse zorlamayı bırak, WhatsApp ve telefonu hatırlat, sohbeti nazikçe bitir.

NETLEŞTİRME KAYDI (zorunlu)
- Kullanıcının cevabını anlamadığında, cevap sorduğun şeyle uyuşmadığında, konu hizmet alanının dışında olduğunda, kullanıcı bilgi vermeyi reddettiğinde veya akışı kibarca kapattığında "netlestirme_kaydet" aracını çağır.
- Aracı çağırırken: tip alanına durumu yaz (anlasilamadi, celiskili_cevap, konu_disi, bilgi_verilmedi, akis_durduruldu), detay alanına kullanıcının ne dediğini ve neyi anlamadığını kısaca yaz, netlestirme_sorusu alanına kullanıcıya soracağın tek net soruyu yaz, sonraki_adim alanına akışın nasıl devam edeceğini yaz.
- Aracı çağırdıktan sonra kullanıcıya yazdığın cevapta o netleştirme sorusunu doğal bir dille sor ve doğru devam adımına geç. Aynı konuda iki kez anlaşılamadıysa tip olarak akis_durduruldu kullan, açık bir kapanış mesajı ver ve elindeki bilgiyle ilerle.

TOPLANACAK BİLGİLER (doğal akışta, sırayla değil): yapılacak iş ve kapsam, iş kategorisi, mekân tipi (ev/daire/ofis/dükkan/villa/diğer), ilçe, mahalle, yaklaşık m², tahmini bütçe (kullanıcı isterse), ad soyad, telefon, uygun iletişim zamanı, keşif isteyip istemediği.

TELEFON: "Size geri dönüş sağlayabilmemiz için telefon numaranızı paylaşabilir misiniz?" gibi doğal biçimde iste. Numara en az 10 haneli olmalı; geçersizse kibarca tekrar iste.

ASLA UYDURMA: fiyat, süre, keşif sonucu, teknik karar, özel teklif, kampanya, kesin randevu saati. Bunlar sorulursa: "Bu konuda net bilgi verebilmemiz için Enes Yapı ekibinin incelemesi gerekir." de ve talep oluşturmayı öner.
KEŞİF ÜCRETİ: keşfin ücretli veya ücretsiz olduğuna dair hiçbir şey söyleme; bilmiyorsun.
FİYAT sorulursa: "Fiyat; işin kapsamı, alanın durumu, kullanılacak malzeme ve yapılacak uygulamaya göre değişir. İsterseniz bilgilerinizi alıp ekibimizin değerlendirmesi için talep oluşturabilirim." de.
KEŞİF isterse: "Elbette. Size uygun bir keşif/görüşme talebi oluşturabilirim." de, bilgileri topla, kesin saat sözü verme.
GİZLİLİK: başka müşterilerin, taleplerin veya iç kayıtların bilgilerini asla paylaşma; sende böyle bir bilgi yok.

TALEP KAYDI: en az ad soyad + telefon + yapılacak işin tanımı elinde olduğunda "talep_olustur" aracını çağır. Araç başarılı dönerse kullanıcıya talep numarasını söyle ve ekibin arayacağını belirt. Aynı sohbette aynı talebi ikinci kez oluşturma.`;

const tools = [
  {
    type: "function",
    function: {
      name: "talep_olustur",
      description:
        "Enes Yapı CRM sisteminde yeni tadilat talebi oluşturur. Ad soyad, telefon ve iş açıklaması zorunludur.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Müşterinin ad soyadı" },
          phone: { type: "string", description: "Telefon numarası" },
          description: { type: "string", description: "Yapılacak işin ve kapsamının açıklaması" },
          renovation_type: { type: "string", description: "İş kategorisi, örn. Banyo yenileme" },
          property_type: { type: "string", description: "Mekân tipi: ev, daire, ofis, dükkan, villa, diğer" },
          district: { type: "string", description: "İlçe" },
          neighborhood: { type: "string", description: "Mahalle" },
          area_m2: { type: "number", description: "Yaklaşık metrekare" },
          budget_range: { type: "string", description: "Tahmini bütçe (kullanıcı paylaştıysa)" },
          contact_time: { type: "string", description: "Uygun iletişim zamanı" },
          wants_survey: { type: "boolean", description: "Kullanıcı keşif / yerinde görüşme istiyor mu" },
          summary: {
            type: "string",
            description:
              "Sohbetin 1-2 cümlelik özeti, örn. '120 m² Bayraklı'da bulunan dairenin komple tadilatını isteyen müşteri. Keşif istiyor.'",
          },
        },
        required: ["full_name", "phone", "description", "summary"],
      },
    },
  },
] as const;

type GwMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }> | undefined;
  tool_call_id?: string | undefined;
};

const FALLBACK = "Şu anda cevap veremedim. 0533 399 25 40 numarasından bize ulaşabilirsiniz.";

async function callGateway(apiKey: string, messages: GwMessage[]) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, tools }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("AI gateway error", res.status, text);
    throw new Error(res.status === 429 ? "rate_limit" : "gateway");
  }
  return (await res.json()) as {
    choices?: Array<{ message?: GwMessage }>;
  };
}

function digits(v: string) {
  return v.replace(/\D/g, "");
}

export const emirChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        reply: "Yazılı asistan şu anda devre dışı. 0533 399 25 40 numarasından bize ulaşabilirsiniz.",
        sessionId: data.sessionId ?? null,
        requestId: null as string | null,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const attachments = data.attachments ?? [];

    // Sohbet oturumu (yalnızca yönetim panelinden görülebilir)
    let sessionId = data.sessionId ?? null;
    let existingRequestId: string | null = null;
    if (sessionId) {
      const { data: row } = await supabaseAdmin
        .from("emir_chat_sessions")
        .select("id, request_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (row) existingRequestId = row.request_id;
      else sessionId = null;
    }
    if (!sessionId) {
      const { data: created, error } = await supabaseAdmin
        .from("emir_chat_sessions")
        .insert({ messages: [], collected: {} })
        .select("id")
        .single();
      if (error) console.error("emir session insert failed", error);
      sessionId = created?.id ?? null;
    }

    const history: GwMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(attachments.length
        ? [
            {
              role: "system" as const,
              content: `Kullanıcı ${attachments.length} dosya yükledi (${attachments
                .map((a) => a.name)
                .join(", ")}). Bu dosyalar talep oluşturulduğunda otomatik olarak talebe eklenir; tekrar yüklemesini isteme.`,
            },
          ]
        : []),
      ...(existingRequestId
        ? [
            {
              role: "system" as const,
              content:
                "Bu sohbette zaten bir talep oluşturuldu. Yeni bir talep oluşturma; kullanıcıya ekibin dönüş yapacağını hatırlat.",
            },
          ]
        : []),
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let reply = "";
    let requestId: string | null = existingRequestId;
    let summary: string | null = null;
    let wantsSurvey = false;
    let collected: Record<string, unknown> = {};

    try {
      let completion = await callGateway(apiKey, history);
      let message = completion.choices?.[0]?.message;

      const call = message?.tool_calls?.[0];
      if (call && call.function.name === "talep_olustur" && !existingRequestId) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(call.function.arguments || "{}");
        } catch {
          args = {};
        }
        collected = args;
        summary = typeof args["summary"] === "string" ? (args["summary"] as string) : null;
        wantsSurvey = args["wants_survey"] === true;

        const fullName = String(args["full_name"] ?? "").trim().slice(0, 120);
        const phoneRaw = String(args["phone"] ?? "").trim().slice(0, 30);
        const description = String(args["description"] ?? "").trim().slice(0, 2000);

        let toolResult: string;
        if (fullName.length < 2 || digits(phoneRaw).length < 10 || description.length < 3) {
          toolResult = JSON.stringify({
            ok: false,
            error: "Ad soyad, geçerli bir telefon numarası ve iş açıklaması gerekli. Eksik bilgiyi kullanıcıdan iste.",
          });
        } else {
          const notes = [
            summary ? `Emir özeti: ${summary}` : null,
            args["contact_time"] ? `Uygun iletişim zamanı: ${String(args["contact_time"]).slice(0, 120)}` : null,
            wantsSurvey ? "Müşteri keşif / yerinde görüşme talep ediyor." : null,
          ].filter(Boolean);

          const insertPayload = {
            full_name: fullName,
            phone: phoneRaw,
            description: [description, ...notes].join("\n\n").slice(0, 4000),
            renovation_type: args["renovation_type"] ? String(args["renovation_type"]).slice(0, 120) : null,
            property_type: args["property_type"] ? String(args["property_type"]).slice(0, 80) : null,
            city: "İzmir",
            district: args["district"] ? String(args["district"]).slice(0, 80) : null,
            neighborhood: args["neighborhood"] ? String(args["neighborhood"]).slice(0, 80) : null,
            area_m2: typeof args["area_m2"] === "number" ? args["area_m2"] : null,
            budget_range: args["budget_range"] ? String(args["budget_range"]).slice(0, 80) : null,
            source: "web-emir",
            photo_urls: attachments,
          };

          const { data: inserted, error } = await supabaseAdmin
            .from("renovation_requests")
            .insert(insertPayload)
            .select("id")
            .single();

          if (error || !inserted) {
            console.error("emir request insert failed", error);
            toolResult = JSON.stringify({ ok: false, error: "Talep kaydedilemedi, kullanıcıya telefonla ulaşmasını öner." });
          } else {
            requestId = inserted.id;
            let surveyId: string | null = null;
            if (wantsSurvey) {
              const { data: survey, error: surveyError } = await supabaseAdmin
                .from("surveys")
                .insert({
                  request_id: inserted.id,
                  notes: `Web / Emir üzerinden keşif talebi.${summary ? ` ${summary}` : ""}`,
                  work_items: description.slice(0, 1000),
                })
                .select("id")
                .single();
              if (surveyError) console.error("emir survey insert failed", surveyError);
              surveyId = survey?.id ?? null;
            }

            if (sessionId) {
              await supabaseAdmin
                .from("emir_chat_sessions")
                .update({
                  request_id: inserted.id,
                  survey_id: surveyId,
                  wants_survey: wantsSurvey,
                  summary,
                  collected: collected as never,
                  status: wantsSurvey ? "kesif-talebi" : "talep-olusturuldu",
                })
                .eq("id", sessionId);
            }

            toolResult = JSON.stringify({
              ok: true,
              talep_no: inserted.id.slice(0, 8).toUpperCase(),
              kesif_talebi: wantsSurvey,
            });
          }
        }

        completion = await callGateway(apiKey, [
          ...history,
          { role: "assistant", content: message?.content ?? "", tool_calls: message?.tool_calls },
          { role: "tool", tool_call_id: call.id, content: toolResult },
        ]);
        message = completion.choices?.[0]?.message;
      }

      reply = (message?.content ?? "").trim();
      if (!reply) reply = "Bunu tam anlayamadım, biraz daha açabilir misiniz?";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      reply =
        msg === "rate_limit"
          ? "Şu an yoğunluk var, biraz sonra tekrar deneyin. Acil ise: 0533 399 25 40."
          : FALLBACK;
    }

    if (sessionId) {
      const transcript = [...data.messages, { role: "assistant" as const, content: reply }];
      await supabaseAdmin
        .from("emir_chat_sessions")
        .update({
          messages: transcript as never,
          message_count: transcript.length,
          ...(summary ? { summary } : {}),
        })
        .eq("id", sessionId);
    }

    return { reply, sessionId, requestId };
  });
