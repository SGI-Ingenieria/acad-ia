import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { corsHeaders } from "../_shared/cors.ts";
import type { Database, Json } from "../_shared/database.types.ts";
import { HttpError } from "../_shared/utils.ts";
import { CarboneClient } from "./carbone.ts";

const DownloadReportBodySchema = z.record(z.unknown()).optional().default({});

const DownloadReportPlanSchema = z
  .object({
    action: z.literal("downloadReport"),
    plan_estudio_id: z.string().min(1),
    body: DownloadReportBodySchema,
  })
  .strict();

const DownloadReportAsignaturaSchema = z
  .object({
    action: z.literal("downloadReport"),
    asignatura_id: z.string().min(1),
    body: DownloadReportBodySchema,
  })
  .strict();

export const DownloadReportSchema = z.union([
  DownloadReportPlanSchema,
  DownloadReportAsignaturaSchema,
]);

export type DownloadReportInput = z.infer<typeof DownloadReportSchema>;

type SupabaseClient = ReturnType<typeof createClient<Database>>;

type CarboneDownload = {
  buffer: Uint8Array;
  contentType: string | null;
  contentDisposition: string | null;
};

async function loadPlanDatos(
  supabase: SupabaseClient,
  planEstudioId: string,
): Promise<{ datos: Json; estructura_id: string }> {
  const { data, error } = await supabase
    .from("planes_estudio")
    .select("datos, estructura_id")
    .eq("id", planEstudioId)
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "Error consultando el plan de estudios.",
      "DB_ERROR",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    );
  }
  if (!data) {
    throw new HttpError(404, "Plan de estudios no encontrado.", "NOT_FOUND", {
      plan_estudio_id: planEstudioId,
    });
  }

  return { datos: data.datos, estructura_id: data.estructura_id };
}

async function loadTemplateIdForEstructura(
  supabase: SupabaseClient,
  estructuraId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("estructuras_plan")
    .select("template_id")
    .eq("id", estructuraId)
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "Error consultando la estructura del plan.",
      "DB_ERROR",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    );
  }
  if (!data) {
    throw new HttpError(
      404,
      "Estructura del plan no encontrada.",
      "NOT_FOUND",
      {
        estructura_id: estructuraId,
      },
    );
  }
  if (!data.template_id) {
    throw new HttpError(
      409,
      "La estructura del plan no tiene template_id configurado.",
      "MISSING_TEMPLATE_ID",
      { estructura_id: estructuraId },
    );
  }

  return data.template_id;
}

async function loadTemplateIdForAsignatura(
  supabase: SupabaseClient,
  asignaturaId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("plantilla_asignatura")
    .select("template_id")
    .eq("asignatura_id", asignaturaId)
    .maybeSingle();

  if (error) {
    throw new HttpError(
      500,
      "Error consultando la plantilla de la asignatura.",
      "DB_ERROR",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
      },
    );
  }
  if (!data) {
    throw new HttpError(404, "Asignatura no encontrada.", "NOT_FOUND", {
      asignatura_id: asignaturaId,
    });
  }
  if (!data.template_id) {
    throw new HttpError(
      409,
      "La asignatura no tiene template_id configurado.",
      "MISSING_TEMPLATE_ID",
      { asignatura_id: asignaturaId },
    );
  }

  return data.template_id;
}

function ensureCarboneDownload(result: unknown): CarboneDownload {
  if (!(result && typeof result === "object" && "buffer" in result)) {
    throw new HttpError(
      502,
      "Respuesta inválida de Carbone.",
      "UPSTREAM_INVALID_RESPONSE",
    );
  }

  const download = result as CarboneDownload;
  if (!(download.buffer instanceof Uint8Array)) {
    throw new HttpError(
      502,
      "Respuesta inválida de Carbone.",
      "UPSTREAM_INVALID_RESPONSE",
    );
  }

  return download;
}

function downloadToResponse(download: CarboneDownload): Response {
  const headers = new Headers({
    ...corsHeaders,
    "Content-Type": download.contentType === "application/pdf"
      ? "application/pdf"
      : "application/octet-stream",
    Connection: "keep-alive",
  });

  if (download.contentDisposition) {
    headers.set("Content-Disposition", download.contentDisposition);
  }

  const body = new Uint8Array(
    download.buffer.buffer as ArrayBuffer,
    download.buffer.byteOffset,
    download.buffer.byteLength,
  );
  return new Response(body, { status: 200, headers });
}

export async function handleDownloadReportAction(args: {
  bodyUnknown: unknown;
  supabase: SupabaseClient;
  carboneBaseUrl: string;
  carboneApiToken: string;
}): Promise<Response> {
  const input: DownloadReportInput = DownloadReportSchema.parse(
    args.bodyUnknown,
  );
  const carbone = new CarboneClient(args.carboneBaseUrl, args.carboneApiToken);

  if ("plan_estudio_id" in input) {
    const { datos, estructura_id } = await loadPlanDatos(
      args.supabase,
      input.plan_estudio_id,
    );
    const templateId = await loadTemplateIdForEstructura(
      args.supabase,
      estructura_id,
    );

    const { data: _ignoredData, ...extraBody } = input.body;
    const result = await carbone.render(
      templateId,
      { data: datos, ...extraBody },
      { download: true },
    );

    return downloadToResponse(ensureCarboneDownload(result));
  }

  const templateId = await loadTemplateIdForAsignatura(
    args.supabase,
    input.asignatura_id,
  );

  const hasData = Object.prototype.hasOwnProperty.call(input.body, "data");
  if (!hasData) {
    throw new HttpError(
      400,
      "Para asignatura_id se requiere body.data.",
      "MISSING_DATA",
      { asignatura_id: input.asignatura_id },
    );
  }

  // console.log("body:", input.body);
  const { data, ...extraBody } = input.body as Record<string, unknown>;
  const result = await carbone.render(
    templateId,
    { data, ...extraBody },
    { download: true },
  );

  return downloadToResponse(ensureCarboneDownload(result));
}
