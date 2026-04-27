import '@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { corsHeaders } from '../_shared/cors.ts'
import { definicionesDeEstructurasDeColumnas } from '../_shared/estructuras.ts'
import { OpenAIService } from '../_shared/openai-service.ts'
import { HttpError, sendError, sendSuccess } from '../_shared/utils.ts'

import type { Database, Json } from '../_shared/database.types.ts'
import type { StructuredResponseOptions } from '../_shared/openai-service.ts'

type BeforeUnloadWithDetail = Event & { detail?: { reason?: unknown } }

addEventListener('beforeunload', (ev: BeforeUnloadWithDetail) => {
  console.error('ALERTA: La función se va a apagar. Razón:', ev.detail?.reason)
})

const DatosUpdateSchema = z
  .object({
    id: z.string().uuid('id debe ser un UUID').optional(),

    // campos de asignatura (nombres coinciden con columnas DB)
    plan_estudio_id: z.string().uuid('plan_estudio_id debe ser un UUID'),
    estructura_id: z.string().uuid('estructura_id debe ser un UUID').optional(),
    nombre: z.string().min(1).optional(),
    codigo: z.union([z.string().min(1), z.literal(''), z.null()]).optional(),
    tipo: z.union([z.string().min(1), z.null()]).optional(),
    creditos: z.number().positive().optional(),
    horas_academicas: z.number().int().nonnegative().nullable().optional(),
    horas_independientes: z.number().int().nonnegative().nullable().optional(),
    numero_ciclo: z.number().int().positive().nullable().optional(),
    linea_plan_id: z.string().uuid().nullable().optional(),
    orden_celda: z.number().int().nonnegative().nullable().optional(),
  })
  .strict()

const IAConfigSchema = z
  .object({
    descripcionEnfoqueAcademico: z.string().optional(),
    instruccionesAdicionalesIA: z.string().optional(),
    // Se reciben directamente IDs de OpenAI Files (no UUIDs de `archivos`).
    archivosReferencia: z.array(z.string().min(1)).optional().default([]),
    // IDs de vector stores de OpenAI (no UUID de Supabase).
    repositoriosIds: z.array(z.string().min(1)).optional().default([]),
  })
  .strict()
  .default({ archivosReferencia: [], repositoriosIds: [] })

const UnifiedJsonSchema = z
  .object({
    datosUpdate: DatosUpdateSchema,
    iaConfig: IAConfigSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    // Si no hay id, es un insert => necesitamos campos mínimos
    if (!val.datosUpdate.id) {
      if (!val.datosUpdate.estructura_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['datosUpdate', 'estructura_id'],
          message: 'estructura_id es requerido para crear',
        })
      }
      if (!val.datosUpdate.nombre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['datosUpdate', 'nombre'],
          message: 'nombre es requerido para crear',
        })
      }
      if (val.datosUpdate.creditos === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['datosUpdate', 'creditos'],
          message: 'creditos es requerido para crear',
        })
      }
    }
  })

type EdgeAIGenerateSubjectUnifiedInput = z.infer<typeof UnifiedJsonSchema>

type AsignaturaBaseSeleccionada = {
  id: string
  plan_estudio_id: string
  estructura_id: string | null
  nombre: string
  codigo: string | null
  tipo: Database['public']['Tables']['asignaturas']['Row']['tipo']
  creditos: number
  horas_academicas: number | null
  horas_independientes: number | null
  numero_ciclo: number | null
  linea_plan_id: string | null
  orden_celda: number | null
  estado: Database['public']['Enums']['estado_asignatura']
}

function withColumnDefsAndRefs(
  schemaDef: Record<string, unknown>,
): Record<string, unknown> {
  const nextSchema: Record<string, unknown> = {
    ...schemaDef,
    $defs: definicionesDeEstructurasDeColumnas,
  }

  const props = nextSchema['properties']
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return nextSchema
  }

  const nextProps: Record<string, unknown> = {
    ...(props as Record<string, unknown>),
  }
  for (const [key, value] of Object.entries(nextProps)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const xColumn = (value as Record<string, unknown>)['x-column']
    if (typeof xColumn !== 'string' || !xColumn.length) continue
    nextProps[key] = { $ref: `#/$defs/${xColumn}` }
  }

  nextSchema['properties'] = nextProps
  return nextSchema
}

function formatZodIssues(issues: Array<z.ZodIssue>): string {
  return issues
    .map((issue, i) => {
      const path = issue.path.length ? issue.path.join('.') : '(root)'
      return `${i + 1}. ${path}: ${issue.message}`
    })
    .join('\n')
}

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url)
  const functionName = url.pathname.split('/').pop()
  console.log(
    `[${new Date().toISOString()}][${functionName}]: Request received`,
  )

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const method = req.method
    if (method !== 'POST') {
      console.error(
        `[${new Date().toISOString()}][${functionName}]: Invalid method: ${method}`,
      )
      throw new HttpError(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED', {
        method,
      })
    }

    const authHeaderRaw =
      req.headers.get('Authorization') ?? req.headers.get('authorization')
    if (!authHeaderRaw) {
      console.error(
        `[${new Date().toISOString()}][${functionName}]: Missing Authorization header`,
      )
      throw new HttpError(401, 'No autorizado.', 'UNAUTHORIZED', {
        reason: 'missing_authorization_header',
      })
    }

    const contentType = (req.headers.get('content-type') || '').toLowerCase()
    const isJson = contentType.includes('application/json')
    if (!isJson) {
      console.error(
        `[${new Date().toISOString()}][${functionName}]: Unsupported content type: ${contentType}`,
      )
      throw new HttpError(
        415,
        'Content-Type no soportado.',
        'UNSUPPORTED_MEDIA_TYPE',
        { contentType, expected: 'application/json' },
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new HttpError(
        500,
        'Configuración del servidor incompleta.',
        'MISSING_ENV',
        {
          missing: [
            !SUPABASE_URL ? 'SUPABASE_URL' : null,
            !SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : null,
          ].filter(Boolean),
        },
      )
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

    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SERVICE_ROLE_KEY) {
      throw new HttpError(
        500,
        'Configuración del servidor incompleta.',
        'MISSING_ENV',
        { missing: ['SUPABASE_SERVICE_ROLE_KEY'] },
      )
    }

    const supabaseService = createClient<Database>(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
    )

    // Model names (override via environment variables)
    const AI_GENERATE_SUBJECT_UPDATE_MODELO =
      Deno.env.get('AI_GENERATE_SUBJECT_UPDATE_MODELO') ?? 'gpt-5-nano'
    const AI_GENERATE_SUBJECT_INSERT_MODELO =
      Deno.env.get('AI_GENERATE_SUBJECT_INSERT_MODELO') ?? 'gpt-5-nano'

    // -----------------------------
    // Unified JSON create/update flow (background)
    // -----------------------------
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch (e) {
      throw new HttpError(400, 'Body JSON inválido.', 'INVALID_JSON', {
        cause: e,
      })
    }

    const parsedBody = UnifiedJsonSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      throw new HttpError(
        422,
        formatZodIssues(parsedBody.error.issues),
        'VALIDATION_ERROR',
        parsedBody.error,
      )
    }

    const payload: EdgeAIGenerateSubjectUnifiedInput = parsedBody.data
    const { datosUpdate, iaConfig } = payload
    const isUpdate = Boolean(datosUpdate.id)

    const svc = OpenAIService.fromEnv()
    if (!(svc instanceof OpenAIService)) {
      throw new HttpError(
        500,
        'Configuración del servidor incompleta.',
        'OPENAI_MISCONFIGURED',
        svc,
      )
    }

    // Resolve fields (merge for update)
    const selectCols =
      'id,plan_estudio_id,estructura_id,nombre,codigo,tipo,creditos,horas_academicas,horas_independientes,numero_ciclo,linea_plan_id,orden_celda,estado'

    let asignaturaBase: AsignaturaBaseSeleccionada | null = null

    if (isUpdate) {
      const { data, error } = await supabaseService
        .from('asignaturas')
        .select(selectCols)
        .eq('id', datosUpdate.id as string)
        .single()
      if (error) {
        const maybeCode = (error as { code?: string }).code
        if (maybeCode === 'PGRST116') {
          throw new HttpError(
            404,
            'No se encontró la asignatura.',
            'NOT_FOUND',
            { table: 'asignaturas', id: datosUpdate.id },
          )
        }
        throw new HttpError(
          500,
          'No se pudo obtener la asignatura.',
          'SUPABASE_QUERY_FAILED',
          error,
        )
      }
      asignaturaBase = data as unknown as AsignaturaBaseSeleccionada
    }

    const resolved = {
      id: datosUpdate.id ?? asignaturaBase?.id ?? null,
      plan_estudio_id: datosUpdate.plan_estudio_id,
      estructura_id:
        datosUpdate.estructura_id ?? asignaturaBase?.estructura_id ?? null,
      nombre: datosUpdate.nombre ?? asignaturaBase?.nombre ?? null,
      codigo: datosUpdate.codigo ?? asignaturaBase?.codigo ?? null,
      tipo: datosUpdate.tipo ?? asignaturaBase?.tipo ?? null,
      creditos: datosUpdate.creditos ?? asignaturaBase?.creditos ?? null,
      horas_academicas:
        datosUpdate.horas_academicas ??
        asignaturaBase?.horas_academicas ??
        null,
      horas_independientes:
        datosUpdate.horas_independientes ??
        asignaturaBase?.horas_independientes ??
        null,
      numero_ciclo:
        datosUpdate.numero_ciclo ?? asignaturaBase?.numero_ciclo ?? null,
      linea_plan_id:
        datosUpdate.linea_plan_id ?? asignaturaBase?.linea_plan_id ?? null,
      orden_celda:
        datosUpdate.orden_celda ?? asignaturaBase?.orden_celda ?? null,
    }

    if (!resolved.estructura_id) {
      throw new HttpError(
        422,
        'estructura_id es requerido.',
        'VALIDATION_ERROR',
        { estructura_id: resolved.estructura_id },
      )
    }
    if (!resolved.nombre) {
      throw new HttpError(422, 'nombre es requerido.', 'VALIDATION_ERROR', {
        nombre: resolved.nombre,
      })
    }
    if (resolved.creditos == null) {
      throw new HttpError(422, 'creditos es requerido.', 'VALIDATION_ERROR', {
        creditos: resolved.creditos,
      })
    }

    // ---------------------------------
    // Referencias: OpenAI file IDs ya subidos.
    // ---------------------------------
    const openaiFileIds = iaConfig.archivosReferencia.filter((x) => Boolean(x))

    const vectorStoreIds = iaConfig.repositoriosIds.filter((x) => Boolean(x))

    // Crear/actualizar stub en estado 'generando'
    let asignaturaId: string
    if (isUpdate) {
      const updatePatch: Database['public']['Tables']['asignaturas']['Update'] =
        {
          estado: 'generando',
          tipo_origen: 'IA',
          plan_estudio_id: resolved.plan_estudio_id,
          estructura_id: resolved.estructura_id,
          nombre: resolved.nombre,
          codigo: resolved.codigo,
          creditos: resolved.creditos,
          horas_academicas: resolved.horas_academicas,
          horas_independientes: resolved.horas_independientes,
          numero_ciclo: resolved.numero_ciclo,
          linea_plan_id: resolved.linea_plan_id,
          orden_celda: resolved.orden_celda,
          tipo: resolved.tipo as Database['public']['Tables']['asignaturas']['Update']['tipo'],
          meta_origen: {
            generado_por: 'ai_generate_subject_unified',
            iaConfig: {
              descripcionEnfoqueAcademico:
                iaConfig.descripcionEnfoqueAcademico ?? null,
              instruccionesAdicionalesIA:
                iaConfig.instruccionesAdicionalesIA ?? null,
              archivosReferencia: iaConfig.archivosReferencia,
              repositoriosIds: iaConfig.repositoriosIds,
            },
          } as unknown as Json,
        }

      const { data, error } = await supabaseService
        .from('asignaturas')
        .update(updatePatch)
        .eq('id', resolved.id as string)
        .select('id')
        .single()
      if (error) {
        throw new HttpError(
          500,
          'No se pudo actualizar la asignatura (stub).',
          'SUPABASE_UPDATE_FAILED',
          error,
        )
      }
      asignaturaId = data.id
    } else {
      const insertPatch: Database['public']['Tables']['asignaturas']['Insert'] =
        {
          plan_estudio_id: resolved.plan_estudio_id,
          estructura_id: resolved.estructura_id,
          nombre: resolved.nombre,
          codigo: resolved.codigo ?? null,
          tipo: (resolved.tipo ??
            undefined) as Database['public']['Tables']['asignaturas']['Insert']['tipo'],
          creditos: resolved.creditos,
          horas_academicas: resolved.horas_academicas ?? null,
          horas_independientes: resolved.horas_independientes ?? null,
          numero_ciclo: resolved.numero_ciclo ?? null,
          linea_plan_id: resolved.linea_plan_id ?? null,
          orden_celda: resolved.orden_celda ?? null,
          estado: 'generando',
          tipo_origen: 'IA',
          meta_origen: {
            generado_por: 'ai_generate_subject_unified',
            iaConfig: {
              descripcionEnfoqueAcademico:
                iaConfig.descripcionEnfoqueAcademico ?? null,
              instruccionesAdicionalesIA:
                iaConfig.instruccionesAdicionalesIA ?? null,
              archivosReferencia: iaConfig.archivosReferencia,
              repositoriosIds: iaConfig.repositoriosIds,
            },
          } as unknown as Json,
        }

      const { data, error } = await supabaseService
        .from('asignaturas')
        .insert(insertPatch)
        .select('id')
        .single()
      if (error) {
        const maybeCode = (error as { code?: string }).code
        const status = maybeCode ? 409 : 500
        throw new HttpError(
          status,
          'No se pudo crear la asignatura (stub).',
          'SUPABASE_INSERT_FAILED',
          { ...error, code: maybeCode },
        )
      }
      asignaturaId = data.id
    }

    const { data: estructura, error: estructuraError } = await supabaseService
      .from('estructuras_asignatura')
      .select('id,nombre,definicion')
      .eq('id', resolved.estructura_id)
      .single()
    if (estructuraError) {
      const maybeCode = (estructuraError as { code?: string }).code
      if (maybeCode === 'PGRST116') {
        throw new HttpError(
          404,
          'No se encontró la estructura de la asignatura.',
          'NOT_FOUND',
          { table: 'estructuras_asignatura', id: resolved.estructura_id },
        )
      }
      throw new HttpError(
        500,
        'No se pudo obtener la estructura de la asignatura.',
        'SUPABASE_QUERY_FAILED',
        estructuraError,
      )
    }

    const systemPrompt = `Eres un asistente experto en diseño curricular. Responde únicamente con JSON válido que cumpla estrictamente el JSON Schema proporcionado.`

    const archivosReferenciaTexto = openaiFileIds.length
      ? `\n- Archivos de referencia: ${openaiFileIds.length}`
      : ''

    const userPrompt =
      `Genera un borrador completo completo de una ASIGNATURA con base en lo siguiente:\n` +
      `- Nombre de la asignatura: ${resolved.nombre}\n` +
      `- Código (clave de la asignatura): ${
        resolved.codigo ?? '(no especificado)'
      }\n` +
      `- Tipo: ${resolved.tipo ?? '(no especificado)'}\n` +
      `- Número de créditos: ${resolved.creditos}\n` +
      `- Horas académicas: ${
        resolved.horas_academicas ?? '(no especificado)'
      }\n` +
      `- Horas independientes: ${
        resolved.horas_independientes ?? '(no especificado)'
      }\n` +
      `- Descripción del enfoque académico (sobre el contenido de la respuesta generada): ${
        iaConfig.descripcionEnfoqueAcademico ?? '(ninguna)'
      }\n` +
      `- Instrucciones adicionales (sobre el formato de la respuesta generada): ${
        iaConfig.instruccionesAdicionalesIA ?? '(ninguna)'
      }` +
      archivosReferenciaTexto +
      `\n\nREGLAS ESTRICTAS MATEMÁTICAS:\n` +
      `- Si generas el 'contenido_tematico', la suma total de las 'horasEstimadas' de todos los temas en todas las unidades DEBE coincidir exactamente con el total de Horas académicas indicadas arriba (${
        resolved.horas_academicas ?? 0
      }). No te pases ni te falten horas.\n` +
      `- Si generas los 'criterios_de_evaluacion', la suma total de los 'porcentajes' de todos los criterios DEBE ser exactamente 100%. No te pases ni te falten porcentajes.`

    const schemaDef: Record<string, unknown> =
      typeof estructura.definicion === 'object' &&
      estructura.definicion !== null
        ? (estructura.definicion as Record<string, unknown>)
        : {}

    const schemaForAI = withColumnDefsAndRefs(schemaDef)

    // Formatear el contenido del usuario permitiendo texto y archivos
    const userContent =
      openaiFileIds.length > 0
        ? [
            ...openaiFileIds.map((id) => ({
              type: 'input_file' as const,
              file_id: id,
            })),
            {
              type: 'input_text' as const,
              text: `Usa estos archivos como referencia.\n\n${userPrompt}`,
            },
          ]
        : userPrompt

    const aiStructuredPayload: StructuredResponseOptions = {
      model: isUpdate
        ? AI_GENERATE_SUBJECT_UPDATE_MODELO
        : AI_GENERATE_SUBJECT_INSERT_MODELO,
      background: true,
      metadata: {
        tabla: 'asignaturas',
        accion: isUpdate ? 'actualizar' : 'crear',
        id: asignaturaId,
      },
      tools: vectorStoreIds.length
        ? [
            {
              type: 'file_search',
              vector_store_ids: vectorStoreIds,
            },
          ]
        : undefined,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }, // Se inyecta el array o el string aquí
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'asignatura_contenido_tematico',
          schema: schemaForAI,
          strict: true,
        },
      },
    }

    // Se elimina el segundo parámetro
    const aiResult = await svc.createStructuredResponse(aiStructuredPayload)
    if (!aiResult.ok) {
      const status = aiResult.code === 'MissingEnv' ? 500 : 502
      throw new HttpError(
        status,
        'No se pudo iniciar la generación de la asignatura con IA.',
        'OPENAI_REQUEST_FAILED',
        aiResult,
      )
    }

    console.log(
      `[${new Date().toISOString()}][${functionName}]: Subject generation started in background`,
    )
    return sendSuccess({
      id: asignaturaId,
      estado: 'generando',
      openai: { responseId: aiResult.responseId },
    })
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(
        `[${new Date().toISOString()}][${functionName}] ⚠️ Handled Error:`,
        {
          message: error.message,
          code: error.code,
          internalDetails: error.internalDetails || 'N/A',
        },
      )

      return sendError(error.status, error.message, error.code)
    }

    const unexpectedError =
      error instanceof Error ? error : new Error(String(error))

    console.error(
      `[${new Date().toISOString()}][${functionName}] 💥 CRITICAL UNHANDLED ERROR:`,
      unexpectedError.stack || unexpectedError.message,
    )

    return sendError(
      500,
      'Ocurrió un error inesperado en el servidor.',
      'INTERNAL_SERVER_ERROR',
    )
  }
})
