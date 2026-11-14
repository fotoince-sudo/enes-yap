import { createServerFn } from "@tanstack/react-start";
import postgres from "postgres";
import { z } from "zod";

const input = z.object({
  _ad: z.string().trim().min(2).max(120),
  _telefon: z.string().trim().min(10).max(30).refine((value) => value.replace(/\D/g, "").length >= 10),
  _eposta: z.string().email().max(255).nullable(),
  _ilce: z.string().max(80).nullable(),
  _mahalle: z.string().max(80).nullable(),
  _gayrimenkul_turu: z.string().max(80).nullable(),
  _tadilat_isi: z.string().max(120).nullable(),
  _aciklama: z.string().max(4000).nullable(),
  _gorseller: z.array(z.string().max(230).regex(/^talep\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_.-]+$/)).max(30),
  consent: z.literal(true),
});

let sql: ReturnType<typeof postgres> | undefined;

export const saveRequestToPlesk = createServerFn({ method: "POST" })
  .inputValidator((value) => input.parse(value))
  .handler(async ({ data }) => {
    const url = process.env["ENES_DATABASE_URL"];
    if (!url) return { handled: false };

    sql ??= postgres(url, { max: 4, connect_timeout: 5, idle_timeout: 20 });
    try {
      const [result] = await sql<{ talep_id: string }[]>`
        SELECT talep_id FROM public.create_yapi_web_talep(
          _ad => ${data._ad}::text,
          _telefon => ${data._telefon}::text,
          _eposta => ${data._eposta}::text,
          _ilce => ${data._ilce}::text,
          _mahalle => ${data._mahalle}::text,
          _gayrimenkul_turu => ${data._gayrimenkul_turu}::text,
          _tadilat_isi => ${data._tadilat_isi}::text,
          _aciklama => ${data._aciklama}::text,
          _gorseller => ${sql.array(data._gorseller, 25)}::text[]
        )
      `;
      if (!result?.talep_id) throw new Error("Talep kimliği oluşturulamadı.");
    } catch {
      throw new Error("Talebiniz kaydedilemedi. Lütfen tekrar deneyin.");
    }
    return { handled: true };
  });
