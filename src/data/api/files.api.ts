import { supabaseBrowser } from "../supabase/client";
import { throwIfError, requireData, getUserIdOrThrow } from "./_helpers";
import type { Archivo, UUID } from "../types/domain";

const DEFAULT_BUCKET = "archivos";

export type UploadFileInput = {
  file: File;
  bucket?: string;
  pathPrefix?: string; // ej: "planes/<planId>" o "materias/<id>"
  temporal?: boolean;
  notas?: string | null;
};

export async function files_upload(input: UploadFileInput): Promise<Archivo> {
  const supabase = supabaseBrowser();
  const userId = await getUserIdOrThrow(supabase);

  const bucket = input.bucket ?? DEFAULT_BUCKET;
  const safeName = input.file.name.replace(/[^\w.\-() ]+/g, "_");
  const pathPrefix = (input.pathPrefix ?? `usuarios/${userId}`).replace(/\/+$/g, "");

  const storagePath = `${pathPrefix}/${crypto.randomUUID()}-${safeName}`;

  const { data: upData, error: upErr } = await supabase.storage
    .from(bucket)
    .upload(storagePath, input.file, { upsert: false });

  throwIfError(upErr);
  requireData(upData, "No se pudo subir archivo.");

  const { data: row, error: insErr } = await supabase
    .from("archivos")
    .insert({
      ruta_storage: `${bucket}/${storagePath}`,
      nombre: input.file.name,
      mime_type: input.file.type || null,
      bytes: input.file.size,
      subido_por: userId as UUID,
      temporal: Boolean(input.temporal),
      notas: input.notas ?? null,
    })
    .select("id,ruta_storage,nombre,mime_type,bytes,subido_por,subido_en,temporal,openai_file_id,notas")
    .single();

  throwIfError(insErr);
  return requireData(row, "No se pudo registrar metadata del archivo.");
}

export async function files_signed_url(params: {
  ruta_storage: string; // "bucket/path/to/file"
  expiresIn?: number; // segundos
}): Promise<string> {
  const supabase = supabaseBrowser();
  const expires = params.expiresIn ?? 60 * 10;

  const [bucket, ...rest] = params.ruta_storage.split("/");
  const path = rest.join("/");

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  throwIfError(error);
  return requireData(data?.signedUrl, "No se pudo generar URL firmada.");
}
