import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { pleskDatabase } from "./plesk-db.server";

const application = z.object({
  firma: z.string().trim().min(2).max(120),
  yetkili: z.string().trim().min(2).max(120),
  telefon: z.string().trim().max(30).transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(15)),
  eposta: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  uzmanlik: z.string().trim().min(2).max(160),
  bolge: z.string().trim().min(2).max(160),
  not: z.string().trim().max(1000),
  onay: z.literal(true),
});

export const saveSolutionPartner = createServerFn({ method: "POST" })
  .inputValidator((value) => application.parse(value))
  .handler(async ({ data }) => {
    const sql = pleskDatabase();
    if (!sql) throw new Error("Başvuru formu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.");
    try {
      await sql`
        INSERT INTO public.yapi_cozum_ortagi_basvurulari
          (firma, yetkili, telefon, eposta, uzmanlik, bolge, notlar)
        VALUES (${data.firma}, ${data.yetkili}, ${data.telefon}, ${data.eposta},
                ${data.uzmanlik}, ${data.bolge}, ${data.not || null})
        ON CONFLICT (eposta) WHERE durum = 'beklemede' DO NOTHING
      `;
    } catch {
      throw new Error("Başvuru şu anda kaydedilemedi. Lütfen daha sonra tekrar deneyin.");
    }
  });
