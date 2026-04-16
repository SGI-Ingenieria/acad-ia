import type { OpenAI } from "openai";
import { supabase } from "../supabase.ts";
import type { Json } from "../../_shared/database.types.ts";
import { ResponseMetadata } from "../../_shared/utils.ts";

function extractOutputText(response: OpenAI.Responses.Response): string {
  const direct = (response as unknown as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

  const output = (response as unknown as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";

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

function splitAiOutputStringsAndColumns(
  aiOutput: unknown,
): { aiOutputJson: Json; columnasGeneradas: Record<string, unknown> } {
  if (!aiOutput || typeof aiOutput !== "object" || Array.isArray(aiOutput)) {
    return { aiOutputJson: aiOutput as unknown as Json, columnasGeneradas: {} };
  }

  const record = aiOutput as Record<string, unknown>;
  const stringsOnly: Record<string, string> = {};
  const columnasGeneradas: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      stringsOnly[key] = value;
    } else {
      columnasGeneradas[key] = value;
    }
  }

  return { aiOutputJson: stringsOnly as unknown as Json, columnasGeneradas };
}

async function marcarFalloAsignatura(
  asignaturaId: string,
  reason: string,
  extra?: unknown,
): Promise<void> {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("asignaturas")
      .select("meta_origen")
      .eq("id", asignaturaId)
      .maybeSingle();
    if (existingError) {
      console.warn("No se pudo leer meta_origen para marcar fallo", {
        asignaturaId,
        existingError,
      });
    }

    const baseMeta = (existing?.meta_origen &&
        typeof existing.meta_origen === "object" &&
        !Array.isArray(existing.meta_origen))
      ? (existing.meta_origen as Record<string, unknown>)
      : {};

    const nextMeta: Record<string, unknown> = {
      ...baseMeta,
      ai_error: {
        reason,
        extra: extra ?? null,
        at: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from("asignaturas")
      .update({ estado: "borrador", meta_origen: nextMeta as unknown as Json })
      .eq("id", asignaturaId);
    if (error) {
      console.warn("No se pudo marcar fallo en asignatura", {
        asignaturaId,
        error,
      });
    }
  } catch (e) {
    console.warn("Fallo inesperado marcando fallo en asignatura", {
      asignaturaId,
      e,
    });
  }
}

export async function handleCrearAsignaturaResponse(
  response: OpenAI.Responses.Response,
): Promise<void> {
  const metadata = response.metadata as ResponseMetadata | null;
  const asignaturaId = metadata?.id;
  if (!asignaturaId) {
    console.warn("No se recibió metadata.id para actualizar la asignatura");
    return;
  }

  try {
    const outputText = extractOutputText(response);
    if (!outputText) {
      console.warn("La respuesta no contiene output_text");
      await marcarFalloAsignatura(asignaturaId, "MISSING_OUTPUT_TEXT", {
        responseId: response.id,
      });
      return;
    }

    let aiOutput: unknown;
    try {
      aiOutput = JSON.parse(outputText);
    } catch (e) {
      console.warn("No se pudo parsear JSON de la respuesta", e);
      await marcarFalloAsignatura(asignaturaId, "INVALID_JSON", {
        responseId: response.id,
        outputText,
      });
      return;
    }

    const { aiOutputJson, columnasGeneradas } = splitAiOutputStringsAndColumns(
      aiOutput,
    );

    const { data: existing, error: existingError } = await supabase
      .from("asignaturas")
      .select("meta_origen")
      .eq("id", asignaturaId)
      .maybeSingle();

    if (existingError) {
      console.warn("No se pudo leer meta_origen existente", {
        asignaturaId,
        existingError,
      });
    }

    const baseMeta = (existing?.meta_origen &&
        typeof existing.meta_origen === "object" &&
        !Array.isArray(existing.meta_origen))
      ? (existing.meta_origen as Record<string, unknown>)
      : {};

    const nextMeta: Record<string, unknown> = {
      ...baseMeta,
      ai: {
        ...(typeof baseMeta.ai === "object" && baseMeta.ai &&
            !Array.isArray(baseMeta.ai)
          ? (baseMeta.ai as Record<string, unknown>)
          : {}),
        responseId: response.id,
        model: response.model,
      },
    };

    const updatePatch: Record<string, unknown> = {
      datos: aiOutputJson,
      estado: "borrador",
      tipo_origen: "IA",
      meta_origen: nextMeta as unknown as Json,
    };

    for (const value of Object.values(columnasGeneradas)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }
      const xColumn = (value as Record<string, unknown>)["x-column"];
      const xDef = (value as Record<string, unknown>)["x-definicion"];
      if (typeof xColumn !== "string" || !xColumn.length) continue;
      updatePatch[xColumn] = xDef as unknown as Json;
    }

    const { error: updateError } = await supabase
      .from("asignaturas")
      .update(
        updatePatch as unknown as {
          [k: string]: unknown;
        },
      )
      .eq("id", asignaturaId);

    if (updateError) {
      console.warn("No se pudo actualizar asignatura con datos", {
        asignaturaId,
        updateError,
      });
      await marcarFalloAsignatura(asignaturaId, "SUPABASE_UPDATE_FAILED", {
        updateError,
      });
      return;
    }
  } catch (e) {
    console.warn("Fallo inesperado procesando asignatura", {
      asignaturaId,
      e,
    });
    await marcarFalloAsignatura(asignaturaId, "UNEXPECTED", { e });
    return;
  }
}
