import { supabase } from "@/integrations/supabase/client";

export const UPLOAD_BUCKET = "yapi-talep-gorseller"; // Enes Emlak ortak CRM depolama alanı

const MAX_IMAGE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO = 90 * 1024 * 1024; // 90 MB

export type UploadedFile = { path: string; name: string; type: string };

/**
 * Talep formundaki dosyalar için imzalı yükleme.
 * Depolama alanı gizlidir; dosyalar yalnızca yönetim panelinden görüntülenir.
 */
export async function uploadRequestFiles(files: File[], kind: "foto" | "video"): Promise<UploadedFile[]> {
  const limit = kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  const results: UploadedFile[] = [];

  for (const file of files) {
    if (file.size > limit) {
      throw new Error(
        `${file.name} çok büyük. ${kind === "video" ? "Videolar" : "Fotoğraflar"} en fazla ${Math.round(limit / 1024 / 1024)} MB olabilir.`,
      );
    }
    const expected = kind === "video" ? "video/" : "image/";
    if (!file.type.startsWith(expected)) {
      throw new Error(`${file.name} geçerli bir ${kind === "video" ? "video" : "fotoğraf"} dosyası değil.`);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `talep/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;

    const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) throw new Error(`${file.name} yüklenemedi: ${error.message}`);
    results.push({ path, name: file.name, type: file.type });
  }

  return results;
}

export async function signedUrl(path: string, seconds = 3600) {
  const { data } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
