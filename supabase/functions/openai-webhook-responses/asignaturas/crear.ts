import { supabase } from '../supabase.ts'

import type { Json } from '../../_shared/database.types.ts'
import type { ResponseMetadata } from '../../_shared/utils.ts'
import type { OpenAI } from 'openai'

function extractOutputText(response: OpenAI.Responses.Response): string {
  const direct = (response as unknown as { output_text?: unknown }).output_text
  if (typeof direct === 'string') return direct

  const output = (response as unknown as { output?: unknown }).output
  if (!Array.isArray(output)) return ''

  try {
    return output
      .filter((item) => (item as { type?: unknown }).type === 'message')
      .flatMap((item) => (item as { content?: unknown }).content ?? [])
      .filter((c) => (c as { type?: unknown }).type === 'output_text')
      .map((c) => String((c as { text?: unknown }).text ?? ''))
      .join('')
  } catch {
    return ''
  }
}

function splitAiOutputScalarsAndColumns(aiOutput: unknown): {
  aiOutputJson: Json
  columnasGeneradas: Record<string, unknown>
} {
  if (!aiOutput || typeof aiOutput !== 'object' || Array.isArray(aiOutput)) {
    return { aiOutputJson: aiOutput as Json, columnasGeneradas: {} }
  }

  const record = aiOutput as Record<string, unknown>
  const scalarsOnly: Record<string, unknown> = {}
  const columnasGeneradas: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    const isScalar =
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'

    if (isScalar) {
      scalarsOnly[key] = value
      continue
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      columnasGeneradas[key] = value
      continue
    }
  }

  return { aiOutputJson: scalarsOnly as unknown as Json, columnasGeneradas }
}

async function marcarFalloAsignatura(
  asignaturaId: string,
  reason: string,
  extra?: unknown,
): Promise<void> {
  try {
    const { data: existing, error: existingError } = await supabase
      .from('asignaturas')
      .select('meta_origen')
      .eq('id', asignaturaId)
      .maybeSingle()
    if (existingError) {
      console.warn('No se pudo leer meta_origen para marcar fallo', {
        asignaturaId,
        existingError,
      })
    }

    const baseMeta =
      existing?.meta_origen &&
      typeof existing.meta_origen === 'object' &&
      !Array.isArray(existing.meta_origen)
        ? (existing.meta_origen as Record<string, unknown>)
        : {}

    const nextMeta: Record<string, unknown> = {
      ...baseMeta,
      error: {
        code: reason,
        message: 'La generación de la asignatura falló.',
        extra: extra ?? null,
        at: new Date().toISOString(),
      },
    }

    const { error } = await supabase
      .from('asignaturas')
      .update({ estado: 'fallida', meta_origen: nextMeta as unknown as Json })
      .eq('id', asignaturaId)
    if (error) {
      console.warn('No se pudo marcar fallo en asignatura', {
        asignaturaId,
        error,
      })
    }
  } catch (e) {
    console.warn('Fallo inesperado marcando fallo en asignatura', {
      asignaturaId,
      e,
    })
  }
}

export async function handleCrearAsignaturaResponse(
  response: OpenAI.Responses.Response,
): Promise<void> {
  const metadata = response.metadata as ResponseMetadata | null
  const asignaturaId = metadata?.id
  if (!asignaturaId) {
    console.warn('No se recibió metadata.id para actualizar la asignatura')
    return
  }

  try {
    const outputText = extractOutputText(response)
    if (!outputText) {
      console.warn('La respuesta no contiene output_text')
      await marcarFalloAsignatura(asignaturaId, 'MISSING_OUTPUT_TEXT', {
        responseId: response.id,
      })
      return
    }

    let aiOutput: unknown
    try {
      aiOutput = JSON.parse(outputText)
    } catch (e) {
      console.warn('No se pudo parsear JSON de la respuesta', e)
      await marcarFalloAsignatura(asignaturaId, 'INVALID_JSON', {
        responseId: response.id,
        outputText,
      })
      return
    }

    const { aiOutputJson, columnasGeneradas } =
      splitAiOutputScalarsAndColumns(aiOutput)

    const scalarRecord =
      aiOutputJson &&
      typeof aiOutputJson === 'object' &&
      !Array.isArray(aiOutputJson)
        ? (aiOutputJson as unknown as Record<string, unknown>)
        : {}

    const analisisDocumento =
      typeof scalarRecord.analisis_documento === 'string'
        ? scalarRecord.analisis_documento
        : ''
    const refusal =
      typeof scalarRecord.refusal === 'string' ? scalarRecord.refusal : ''
    if (refusal.trim().length > 0) {
      await marcarFalloAsignatura(asignaturaId, 'REFUSAL', {
        analisis_documento: analisisDocumento,
        refusal,
      })
      return
    }

    const columnasEscalares: Record<string, unknown> = {}
    const datosScalars: Record<string, unknown> = { ...scalarRecord }

    const moveScalar = (key: string) => {
      if (!(key in datosScalars)) return
      columnasEscalares[key] = datosScalars[key]
      delete datosScalars[key]
    }

    // columnas DB escalares (si vienen en el JSON)
    // Nota: `analisis_documento` y `refusal` se usan como gatekeeper y NO se persisten.
    delete datosScalars.analisis_documento
    delete datosScalars.refusal
    moveScalar('codigo')
    moveScalar('nombre')
    moveScalar('tipo')
    moveScalar('creditos')
    moveScalar('numero_ciclo')
    moveScalar('horas_academicas')
    moveScalar('horas_independientes')

    const { data: existing, error: existingError } = await supabase
      .from('asignaturas')
      .select('meta_origen')
      .eq('id', asignaturaId)
      .maybeSingle()

    if (existingError) {
      console.warn('No se pudo leer meta_origen existente', {
        asignaturaId,
        existingError,
      })
    }

    const baseMeta =
      existing?.meta_origen &&
      typeof existing.meta_origen === 'object' &&
      !Array.isArray(existing.meta_origen)
        ? (existing.meta_origen as Record<string, unknown>)
        : {}

    const nextMeta: Record<string, unknown> = {
      ...baseMeta,
      ai: {
        ...(typeof baseMeta.ai === 'object' &&
        baseMeta.ai &&
        !Array.isArray(baseMeta.ai)
          ? (baseMeta.ai as Record<string, unknown>)
          : {}),
        responseId: response.id,
        model: response.model,
      },
    }

    const updatePatch: Record<string, unknown> = {
      datos: datosScalars as unknown as Json,
      estado: 'borrador',
      meta_origen: nextMeta as unknown as Json,
    }

    // Aplicar columnas escalares si tienen tipos válidos
    if (
      typeof columnasEscalares.codigo === 'string' &&
      columnasEscalares.codigo.trim().length
    ) {
      updatePatch.codigo = columnasEscalares.codigo as unknown
    }
    if (
      typeof columnasEscalares.nombre === 'string' &&
      columnasEscalares.nombre.trim().length
    ) {
      updatePatch.nombre = columnasEscalares.nombre as unknown
    }
    if (
      typeof columnasEscalares.tipo === 'string' &&
      columnasEscalares.tipo.trim().length
    ) {
      updatePatch.tipo = columnasEscalares.tipo as unknown
    }
    if (
      typeof columnasEscalares.creditos === 'number' &&
      Number.isFinite(columnasEscalares.creditos) &&
      columnasEscalares.creditos > 0
    ) {
      updatePatch.creditos = columnasEscalares.creditos as unknown
    }
    if (
      typeof columnasEscalares.numero_ciclo === 'number' &&
      Number.isFinite(columnasEscalares.numero_ciclo) &&
      columnasEscalares.numero_ciclo > 0
    ) {
      updatePatch.numero_ciclo = columnasEscalares.numero_ciclo as unknown
    }
    if (
      typeof columnasEscalares.horas_academicas === 'number' &&
      Number.isFinite(columnasEscalares.horas_academicas) &&
      columnasEscalares.horas_academicas >= 0
    ) {
      updatePatch.horas_academicas =
        columnasEscalares.horas_academicas as unknown
    }
    if (
      typeof columnasEscalares.horas_independientes === 'number' &&
      Number.isFinite(columnasEscalares.horas_independientes) &&
      columnasEscalares.horas_independientes >= 0
    ) {
      updatePatch.horas_independientes =
        columnasEscalares.horas_independientes as unknown
    }

    for (const value of Object.values(columnasGeneradas)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        continue
      }
      const xColumn = (value as Record<string, unknown>)['x-column']
      const xDef = (value as Record<string, unknown>)['x-definicion']
      if (typeof xColumn !== 'string' || !xColumn.length) continue
      updatePatch[xColumn] = xDef
    }

    const { error: updateError } = await supabase
      .from('asignaturas')
      .update(
        updatePatch as unknown as {
          [k: string]: unknown
        },
      )
      .eq('id', asignaturaId)

    if (updateError) {
      console.warn('No se pudo actualizar asignatura con datos', {
        asignaturaId,
        updateError,
      })
      await marcarFalloAsignatura(asignaturaId, 'SUPABASE_UPDATE_FAILED', {
        updateError,
      })
      return
    }
  } catch (e) {
    console.warn('Fallo inesperado procesando asignatura', {
      asignaturaId,
      e,
    })
    await marcarFalloAsignatura(asignaturaId, 'UNEXPECTED', { e })
    return
  }
}
