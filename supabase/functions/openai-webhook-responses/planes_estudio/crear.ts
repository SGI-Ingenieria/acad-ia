import type { OpenAI } from "openai";
import { supabase } from "../supabase.ts";
import type { Json } from "../../_shared/database.types.ts";
import { ResponseMetadata } from "../../_shared/utils.ts";

async function getEstadoId(clave: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("estados_plan")
    .select("id")
    .eq("clave", clave)
    .maybeSingle();
  if (error) {
    console.warn("No se pudo obtener estado:", clave, error);
    return null;
  }
  return data?.id ?? null;
}

async function marcarFallido(planId: string): Promise<void> {
  const fallId = await getEstadoId("FALLDA");
  if (!fallId) {
    console.warn("No existe estado FALLDA; no se pudo marcar fallo", {
      planId,
    });
    return;
  }
  const { error } = await supabase
    .from("planes_estudio")
    .update({ estado_actual_id: fallId })
    .eq("id", planId);
  if (error) {
    console.warn("No se pudo marcar plan como FALLDA", { planId, error });
  }
}

function extractOutputText(response: OpenAI.Responses.Response): string {
  const direct = (response as unknown as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

  const output = (response as unknown as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

  // Fallback similar al usado en index.ts
  try {
    return output
      .filter((item) => (item as { type?: unknown })?.type === "message")
      .flatMap((item) => (item as { content?: unknown })?.content ?? [])
      .filter((c) => (c as { type?: unknown })?.type === "output_text")
      .map((c) => String((c as { text?: unknown })?.text ?? ""))
      .join("");
  } catch {
    return "";
  }
}

export async function handleCrearPlanEstudio(
  response: OpenAI.Responses.Response,
): Promise<void> {
  const metadata = response.metadata as ResponseMetadata | null;
  const planId = metadata?.id;
  if (!planId) {
    console.warn("No se recibió metadata.id para actualizar el plan");
    return;
  }

  try {
    const borradorId = await getEstadoId("BORRADOR");
    if (!borradorId) {
      console.warn("No existe estado BORRADOR");
      await marcarFallido(planId);
      return;
    }

    const outputText = extractOutputText(response);
    if (!outputText) {
      console.warn("La respuesta no contiene output_text");
      await marcarFallido(planId);
      return;
    }

    let datos: Json;
    try {
      datos = JSON.parse(outputText) as Json;
    } catch (e) {
      console.warn("No se pudo parsear JSON de la respuesta", e);
      await marcarFallido(planId);
      return;
    }

    const { error } = await supabase
      .from("planes_estudio")
      .update({ datos, estado_actual_id: borradorId })
      .eq("id", planId);

    if (error) {
      console.warn("No se pudo actualizar el plan con datos", {
        planId,
        error,
      });
      await marcarFallido(planId);
      return;
    }
  } catch (e) {
    console.warn("Fallo inesperado procesando plan", { planId, e });
    await marcarFallido(planId);
    return;
  }
}
