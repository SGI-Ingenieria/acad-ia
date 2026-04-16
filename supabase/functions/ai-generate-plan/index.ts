// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { HttpError, sendError, sendSuccess } from "../_shared/utils.ts";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../_shared/database.types.ts";
import type { AIGeneratePlanInput } from "./types.ts";
import { z } from "zod";
import { systemPrompt } from "./prompts.ts";
import { OpenAIService } from "../_shared/openai-service.ts";
import type { StructuredResponseOptions } from "../_shared/openai-service.ts";
// Typed aliases for strict field unions
type NivelType =
  Database["public"]["Tables"]["planes_estudio"]["Insert"]["nivel"];
type TipoCicloType =
  Database["public"]["Tables"]["planes_estudio"]["Insert"]["tipo_ciclo"];

type BeforeUnloadWithDetail = Event & { detail?: { reason?: unknown } };

// Re-registramos con tipo estricto (evita `any` en análisis)
addEventListener("beforeunload", (ev: BeforeUnloadWithDetail) => {
  console.error("ALERTA: La función se va a apagar. Razón:", ev.detail?.reason);
});

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const functionName = url.pathname.split("/").pop();
  console.log(
    `[${new Date().toISOString()}][${functionName}]: Request received`,
  );

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const method = req.method;
    if (method !== "POST") {
      console.error(
        `[${
          new Date().toISOString()
        }][${functionName}]: Invalid method: ${method}`,
      );
      throw new HttpError(
        405,
        "Método no permitido.",
        "METHOD_NOT_ALLOWED",
        { method },
      );
    }

    const authHeaderRaw = req.headers.get("Authorization") ??
      req.headers.get("authorization");
    if (!authHeaderRaw) {
      console.error(
        `[${
          new Date().toISOString()
        }][${functionName}]: Missing Authorization header`,
      );
      throw new HttpError(
        401,
        "No autorizado.",
        "UNAUTHORIZED",
        { reason: "missing_authorization_header" },
      );
    }

    const contentType = (req.headers.get("content-type") || "").toLowerCase();
    if (!contentType.startsWith("multipart/form-data")) {
      console.error(
        `[${
          new Date().toISOString()
        }][${functionName}]: Unsupported content type: ${contentType}`,
      );
      throw new HttpError(
        415,
        "Content-Type no soportado.",
        "UNSUPPORTED_MEDIA_TYPE",
        { contentType },
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new HttpError(
        500,
        "Configuración del servidor incompleta.",
        "MISSING_ENV",
        {
          missing: [
            !SUPABASE_URL ? "SUPABASE_URL" : null,
            !SUPABASE_ANON_KEY ? "SUPABASE_ANON_KEY" : null,
          ].filter(Boolean),
        },
      );
    }

    // If needed for RLS-protected reads, create an anon client with user's JWT
    // Currently not used; kept here for future expansion.
    // const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    //   global: {
    //     headers: {
    //       Authorization: authHeaderRaw,
    //     },
    //   },
    // });

    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) {
      throw new HttpError(
        500,
        "Configuración del servidor incompleta.",
        "MISSING_ENV",
        { missing: ["SUPABASE_SERVICE_ROLE_KEY"] },
      );
    }

    const supabaseService = createClient<Database>(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
    );

    // Model name controlled via env var (single use)
    const AI_GENERATE_PLAN_MODELO = Deno.env.get("AI_GENERATE_PLAN_MODELO") ??
      "gpt-5-nano";

    const formData = await req.formData();
    const validation = parseAndValidate(formData);
    if (!validation.success) {
      console.error(
        `[${new Date().toISOString()}][${functionName}]: Validation errors:`,
        validation.errors,
      );
      const message = validation.errors
        .map((e, i) => `(${i + 1}) ${e}`)
        .join("\n");

      throw new HttpError(
        422,
        message,
        "VALIDATION_ERROR",
        { errors: validation.errors },
      );
    }

    const payload: AIGeneratePlanInput = validation.data;

    const { data: estructuraPlan, error: estructuraPlanError } =
      await supabaseService
        .from("estructuras_plan")
        .select("id,nombre,tipo,template_id,definicion")
        .eq("id", payload.datosBasicos.estructuraPlanId)
        .single();
    if (estructuraPlanError) {
      const maybeCode = (estructuraPlanError as { code?: string }).code;
      if (maybeCode === "PGRST116") {
        throw new HttpError(
          404,
          "No se encontró la estructura del plan.",
          "NOT_FOUND",
          {
            table: "estructuras_plan",
            id: payload.datosBasicos.estructuraPlanId,
          },
        );
      }
      throw new HttpError(
        500,
        "No se pudo obtener la estructura del plan.",
        "SUPABASE_QUERY_FAILED",
        estructuraPlanError,
      );
    }

    const userPrompt =
      `Genera un borrador completo del PLAN DE ESTUDIOS con base en lo siguiente:
      - Nombre de la institución: Universidad La Salle México
    - Nombre del plan: ${payload.datosBasicos.nombrePlan}
    - Nivel: ${payload.datosBasicos.nivel}
    - Tipo de ciclo: ${payload.datosBasicos.tipoCiclo}
    - Número de ciclos: ${payload.datosBasicos.numCiclos}
    - Descripción del enfoque académico (sobre el contenido de la respuesta generada): ${payload.iaConfig.descripcionEnfoqueAcademico}
    - Notas adicionales (sobre el formato de la respuesta generada): ${
        payload.iaConfig.instruccionesAdicionalesIA ?? "Ninguna"
      }`;
    // Ensure the JSON schema is an object as required by OpenAI types
    const schemaDef: Record<string, unknown> =
      typeof estructuraPlan?.definicion === "object" &&
        estructuraPlan?.definicion !== null
        ? estructuraPlan.definicion as Record<string, unknown>
        : {};

    const { data: estado } = await supabaseService
      .from("estados_plan")
      .select("id,clave,orden")
      .eq("clave", "GENERANDO")
      .maybeSingle();

    if (!estado?.id) {
      throw new HttpError(
        500,
        "No se encontró el estado GENERANDO.",
        "MISSING_STATE",
        { clave: "GENERANDO" },
      );
    }

    const { data: carrera, error: carreraError } = await supabaseService
      .from("carreras")
      .select("id,nombre,facultad_id,facultades(id,nombre,nombre_corto)")
      .eq("id", payload.datosBasicos.carreraId)
      .maybeSingle();
    if (carreraError) {
      throw new HttpError(
        500,
        "No se pudo obtener la carrera.",
        "SUPABASE_QUERY_FAILED",
        carreraError,
      );
    }
    if (!carrera) {
      throw new HttpError(
        404,
        "No se encontró la carrera.",
        "NOT_FOUND",
        { table: "carreras", id: payload.datosBasicos.carreraId },
      );
    }

    const planInsert: Database["public"]["Tables"]["planes_estudio"]["Insert"] =
      {
        carrera_id: carrera.id as string,
        estructura_id: estructuraPlan?.id as string,
        nombre: payload.datosBasicos.nombrePlan,
        nivel: payload.datosBasicos.nivel as NivelType,
        tipo_ciclo: payload.datosBasicos.tipoCiclo as TipoCicloType,
        numero_ciclos: payload.datosBasicos.numCiclos,
        // IMPORTANTE: se inserta SIN `datos` (se actualiza vía webhook)
        estado_actual_id: estado.id,
        activo: true,
        tipo_origen: "IA",
        meta_origen: {
          generado_por: "ai-generate-plan",
          referencias: {
            archivosReferenciaIds: payload.iaConfig?.archivosReferencia ?? null,
            repositoriosIds: payload.iaConfig?.repositoriosIds ?? null,
          },
          iaConfig: {
            descripcionEnfoqueAcademico:
              payload.iaConfig?.descripcionEnfoqueAcademico ?? null,
            instruccionesAdicionalesIA:
              payload.iaConfig?.instruccionesAdicionalesIA ?? null,
            usarMCP: Boolean(payload.iaConfig?.usarMCP),
          },
        } as unknown as Json,
      };

    const { data: plan, error: planError } = await supabaseService
      .from("planes_estudio")
      .insert(planInsert)
      .select(
        "id,nombre,nivel,tipo_ciclo,numero_ciclos,carrera_id,estructura_id,estado_actual_id,activo,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,datos",
      )
      .single();

    if (planError) {
      const maybeCode = (planError as { code?: string }).code;
      const status = maybeCode ? 409 : 500;
      throw new HttpError(
        status,
        "No se pudo guardar el plan de estudios.",
        "SUPABASE_INSERT_FAILED",
        { ...planError, code: maybeCode },
      );
    }

    const aiStructuredPayload: StructuredResponseOptions = {
      model: AI_GENERATE_PLAN_MODELO,
      background: true,
      metadata: {
        tabla: "planes_estudio",
        accion: "crear",
        id: String(plan.id),
      },
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "plan_de_estudios_standard",
          schema: schemaDef,
          strict: true,
        },
      },
    };

    // Use shared OpenAI service directly (no HTTP invoke)
    const svc = OpenAIService.fromEnv();
    if (!(svc instanceof OpenAIService)) {
      throw new HttpError(
        500,
        "Configuración del servidor incompleta.",
        "OPENAI_MISCONFIGURED",
        svc,
      );
    }

    // INICIO DE CÓDIGO PARA DEBBUGGING
    // console.log(
    //   `[${
    //     new Date().toISOString()
    //   }][${functionName}]: Request processed successfully`,
    // );
    // const { data: plan_debug } = await supabaseService
    //   .from("planes_estudio")
    //   .select("*")
    //   .eq("id", "7ce657b1-1abf-4972-858d-5fffe1d51499")
    //   .maybeSingle();
    // return sendSuccess(plan_debug);
    // FIN DE CÓDIGO PARA DEBBUGGING

    const aiResult = await svc.createStructuredResponse(
      aiStructuredPayload,
      payload.archivosAdjuntos,
    );
    if (!aiResult.ok) {
      const status = aiResult.code === "MissingEnv" ? 500 : 502;
      throw new HttpError(
        status,
        "No se pudo iniciar la generación del plan con IA.",
        "OPENAI_REQUEST_FAILED",
        aiResult,
      );
    }

    // TODO: update a interaccion_ia y e insert a cambios_plan con id de plan generado

    console.log(
      `[${
        new Date().toISOString()
      }][${functionName}]: Request processed successfully`,
    );
    return sendSuccess(plan);
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(
        `[${new Date().toISOString()}][${functionName}] ⚠️ Handled Error:`,
        {
          message: error.message,
          code: error.code,
          internalDetails: error.internalDetails || "N/A",
        },
      );

      // RESPONSE: Solo enviamos el mensaje limpio y el código
      return sendError(error.status, error.message, error.code);
    }

    // CASO B: Error Inesperado (Crash, Bug, Syntax Error, etc.)
    // El usuario NO debe ver esto.
    const unexpectedError = error instanceof Error
      ? error
      : new Error(String(error));

    // LOG: Full stack trace y mensaje real
    console.error(
      `[${
        new Date().toISOString()
      }][${functionName}] 💥 CRITICAL UNHANDLED ERROR:`,
      unexpectedError.stack || unexpectedError.message, // Esto es lo que necesitas para debuguear
    );

    // RESPONSE: Mensaje genérico y seguro
    return sendError(
      500,
      "Ocurrió un error inesperado en el servidor.",
      "INTERNAL_SERVER_ERROR",
    );
  }
});

// Este helper recibe un esquema (ej. DatosBasicosSchema) y devuelve un validador
// que acepta un string JSON y lo valida contra ese esquema.
const jsonFromString = <T extends z.ZodTypeAny>(schema: T) =>
  z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (_e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El formato no es un JSON válido",
      });
      return z.NEVER; // Detiene la ejecución aquí si falla el parseo
    }
  }).pipe(schema); // Si el parseo es exitoso, pasa los datos al esquema real

// --- VALIDACIÓN ESTRICTA DE DATOS BÁSICOS ---
const DatosBasicosSchema: z.ZodType<AIGeneratePlanInput["datosBasicos"]> = z
  .object({
    nombrePlan: z.string().min(1, "El nombre es requerido"),
    carreraId: z.string().uuid("carreraId debe ser un UUID"),
    facultadId: z.string().uuid("facultadId debe ser un UUID").optional(),
    nivel: z.string().min(1, "Nivel es requerido"),
    tipoCiclo: z.enum(["Semestre", "Cuatrimestre", "Trimestre", "Otro"]),
    numCiclos: z.number().int().positive(),
    estructuraPlanId: z.string().uuid("estructuraPlanId debe ser un UUID"),
  });

const IAConfigSchema: z.ZodType<AIGeneratePlanInput["iaConfig"]> = z.object({
  descripcionEnfoqueAcademico: z.string(),
  instruccionesAdicionalesIA: z.string().optional(),
  archivosReferencia: z.array(z.string().uuid()).optional(),
  repositoriosIds: z.array(z.string().uuid()).optional(),
  usarMCP: z.boolean().optional(),
});

const SolicitudSchema = z.object({
  // Usamos el helper aquí. Zod recibe string -> parsea -> valida estructura
  datosBasicos: jsonFromString(DatosBasicosSchema),

  iaConfig: jsonFromString(IAConfigSchema),

  // Validamos directamente que sea un array de Archivos
  // z.instanceof(File) funciona en entornos Web/Deno
  archivosAdjuntos: z.array(z.instanceof(File)).optional().default([]),
});

function parseAndValidate(
  formData: FormData,
): { success: true; data: AIGeneratePlanInput } | {
  success: false;
  errors: string[];
} {
  // 1. Convertimos el FormData a un objeto plano de JS para que Zod lo lea
  const rawInput = {
    datosBasicos: formData.get("datosBasicos"),
    iaConfig: formData.get("iaConfig"),
    // getAll es clave para obtener el array de archivos
    archivosAdjuntos: formData.getAll("archivosAdjuntos"),
  };

  // 2. Dejamos que Zod haga TODO el trabajo sucio (null check, json parse, validación)
  const result = SolicitudSchema.safeParse(rawInput);

  if (!result.success) {
    // Aplanamos los errores para devolver un array de strings limpio
    const errors = result.error.errors.map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });

    return { success: false, errors };
  }

  // 3. Retorno exitoso con tipos inferidos automáticamente
  return { success: true, data: result.data };
}
