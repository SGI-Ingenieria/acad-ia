import { supabaseBrowser } from "../supabase/client";
import { invokeEdge } from "../supabase/invokeEdge";
import { throwIfError } from "./_helpers";
import type { AppFile } from "./openaiFiles.api";

const EDGE = {
  signedUrl: "files_signed_url", // Edge: recibe archivoId o ruta_storage y devuelve URL
} as const;

export async function files_list(params?: {
  temporal?: boolean;
  search?: string;
  limit?: number;
}): Promise<AppFile[]> {
  const supabase = supabaseBrowser();

  let q = supabase
    .from("archivos")
    .select("id,openai_file_id,nombre,mime_type,bytes,ruta_storage,temporal,notas,subido_en")
    .order("subido_en", { ascending: false });

  if (typeof params?.temporal === "boolean") q = q.eq("temporal", params.temporal);
  if (params?.search?.trim()) q = q.ilike("nombre", `%${params.search.trim()}%`);
  if (params?.limit) q = q.limit(params.limit);

  const { data, error } = await q;
  throwIfError(error);
  return (data ?? []) as AppFile[];
}

/** Para preview/descarga desde espejo — SIN tocar storage directo en el cliente */
export async function files_get_signed_url(payload: {
  archivoId: string;      // id interno (tabla archivos)
  expiresIn?: number;     // segundos
}): Promise<{ signedUrl: string }> {
  return invokeEdge<{ signedUrl: string }>(EDGE.signedUrl, payload);
}
