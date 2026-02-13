import { supabaseBrowser } from '../supabase/client'
import { invokeEdge } from '../supabase/invokeEdge'

import { throwIfError, requireData } from './_helpers'

import type { DocumentoResult } from './plans.api'
import type {
  Asignatura,
  BibliografiaAsignatura,
  CambioAsignatura,
  TipoAsignatura,
  UUID,
} from '../types/domain'
import type { UploadedFile } from '@/components/planes/wizard/PasoDetallesPanel/FileDropZone'
import type {
  AsignaturaSugerida,
  DataAsignaturaSugerida,
} from '@/features/asignaturas/nueva/types'
import type { Database, TablesInsert } from '@/types/supabase'

const EDGE = {
  generate_subject_suggestions: 'generate-subject-suggestions',
  subjects_create_manual: 'subjects_create_manual',
  ai_generate_subject: 'ai-generate-subject',
  subjects_persist_from_ai: 'subjects_persist_from_ai',
  subjects_clone_from_existing: 'subjects_clone_from_existing',
  subjects_import_from_file: 'subjects_import_from_file',

  subjects_update_fields: 'subjects_update_fields',
  subjects_update_contenido: 'subjects_update_contenido',
  subjects_update_bibliografia: 'subjects_update_bibliografia',

  subjects_generate_document: 'subjects_generate_document',
  subjects_get_document: 'subjects_get_document',
} as const

export async function subjects_get(subjectId: UUID): Promise<Asignatura> {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('asignaturas')
    .select(
      `
      id,plan_estudio_id,estructura_id,codigo,nombre,tipo,creditos,numero_ciclo,linea_plan_id,orden_celda,estado,datos,contenido_tematico,horas_academicas,horas_independientes,asignatura_hash,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,
      planes_estudio(
        id,carrera_id,estructura_id,nombre,nivel,tipo_ciclo,numero_ciclos,datos,estado_actual_id,activo,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,
        carreras(id,facultad_id,nombre,nombre_corto,clave_sep,activa, facultades(id,nombre,nombre_corto,color,icono))
      ),
      estructuras_asignatura(id,nombre,version,definicion)
    `,
    )
    .eq('id', subjectId)
    .single()

  throwIfError(error)
  return requireData(data, 'Asignatura no encontrada.')
}

export async function subjects_history(
  subjectId: UUID,
): Promise<Array<CambioAsignatura>> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('cambios_asignatura')
    .select(
      'id,asignatura_id,cambiado_por,cambiado_en,tipo,campo,valor_anterior,valor_nuevo,fuente,interaccion_ia_id',
    )
    .eq('asignatura_id', subjectId)
    .order('cambiado_en', { ascending: false })

  throwIfError(error)
  return data ?? []
}

export async function subjects_bibliografia_list(
  subjectId: UUID,
): Promise<Array<BibliografiaAsignatura>> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('bibliografia_asignatura')
    .select(
      'id,asignatura_id,tipo,cita,tipo_fuente,biblioteca_item_id,creado_por,creado_en,actualizado_en',
    )
    .eq('asignatura_id', subjectId)
    .order('tipo', { ascending: true })
    .order('creado_en', { ascending: true })

  throwIfError(error)
  return data ?? []
}

export async function subjects_create_manual(
  payload: TablesInsert<'asignaturas'>,
): Promise<Asignatura> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('asignaturas')
    .insert(payload)
    .select()
    .single()

  throwIfError(error)
  return requireData(data, 'No se pudo crear la asignatura.')
}

export type AIGenerateSubjectInput = {
  plan_estudio_id: Asignatura['plan_estudio_id']
  datosBasicos: {
    nombre: Asignatura['nombre']
    codigo?: Asignatura['codigo']
    tipo: Asignatura['tipo'] | null
    creditos: Asignatura['creditos'] | null
    horasAcademicas?: Asignatura['horas_academicas'] | null
    horasIndependientes?: Asignatura['horas_independientes'] | null
    estructuraId: Asignatura['estructura_id'] | null
  }
  // clonInterno?: {
  //   facultadId?: string
  //   carreraId?: string
  //   planOrigenId?: string
  //   asignaturaOrigenId?: string | null
  // }
  // clonTradicional?: {
  //   archivoWordAsignaturaId: string | null
  //   archivosAdicionalesIds: Array<string>
  // }
  iaConfig?: {
    descripcionEnfoqueAcademico: string
    instruccionesAdicionalesIA: string
    archivosReferencia: Array<string>
    repositoriosReferencia?: Array<string>
    archivosAdjuntos?: Array<UploadedFile>
  }
}

/**
 * Edge (JSON): actualizar/llenar una asignatura existente por id.
 * Nota: este flujo NO acepta `instruccionesAdicionalesIA` (solo FormData lo usa).
 */
export type AIGenerateSubjectJsonInput = Partial<{
  plan_estudio_id: Asignatura['plan_estudio_id']
  nombre: Asignatura['nombre']
  codigo: Asignatura['codigo']
  tipo: Asignatura['tipo'] | null
  creditos: Asignatura['creditos']
  horas_academicas: Asignatura['horas_academicas'] | null
  horas_independientes: Asignatura['horas_independientes'] | null
  estructura_id: Asignatura['estructura_id'] | null
  linea_plan_id: Asignatura['linea_plan_id'] | null
  numero_ciclo: Asignatura['numero_ciclo'] | null
  descripcionEnfoqueAcademico: string
}> & {
  id: Asignatura['id']
}

export type GenerateSubjectSuggestionsInput = {
  plan_estudio_id: UUID
  enfoque?: string
  cantidad_de_sugerencias: number
  sugerencias_conservadas: Array<{ nombre: string; descripcion: string }>
}

export async function generate_subject_suggestions(
  input: GenerateSubjectSuggestionsInput,
): Promise<Array<AsignaturaSugerida>> {
  const raw = await invokeEdge<Array<DataAsignaturaSugerida>>(
    EDGE.generate_subject_suggestions,
    input,
    { headers: { 'Content-Type': 'application/json' } },
  )

  return raw.map(
    (s): AsignaturaSugerida => ({
      id: crypto.randomUUID(),
      selected: false,
      source: 'IA',
      nombre: s.nombre,
      codigo: s.codigo,
      tipo: s.tipo ?? null,
      creditos: s.creditos ?? null,
      horasAcademicas: s.horasAcademicas ?? null,
      horasIndependientes: s.horasIndependientes ?? null,
      descripcion: s.descripcion,
      linea_plan_id: null,
      numero_ciclo: null,
    }),
  )
}

export async function ai_generate_subject(
  input: AIGenerateSubjectInput | AIGenerateSubjectJsonInput,
): Promise<any> {
  if ('datosBasicos' in input) {
    const edgeFunctionBody = new FormData()
    edgeFunctionBody.append('plan_estudio_id', input.plan_estudio_id)
    edgeFunctionBody.append('datosBasicos', JSON.stringify(input.datosBasicos))
    edgeFunctionBody.append(
      'iaConfig',
      JSON.stringify({
        ...input.iaConfig,
        archivosAdjuntos: undefined, // los manejamos aparte
      }),
    )
    input.iaConfig?.archivosAdjuntos?.forEach((file) => {
      edgeFunctionBody.append(`archivosAdjuntos`, file.file)
    })
    return invokeEdge<any>(
      EDGE.ai_generate_subject,
      edgeFunctionBody,
      undefined,
      supabaseBrowser(),
    )
  }

  return invokeEdge<any>(EDGE.ai_generate_subject, input, {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function subjects_persist_from_ai(payload: {
  planId: UUID
  jsonAsignatura: any
}): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_persist_from_ai, payload)
}

export async function subjects_clone_from_existing(payload: {
  asignaturaOrigenId: UUID
  planDestinoId: UUID
  overrides?: Partial<{
    nombre: string
    codigo: string
    tipo: TipoAsignatura
    creditos: number
    horas_semana: number
  }>
}): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_clone_from_existing, payload)
}

export async function subjects_import_from_file(payload: {
  planId: UUID
  archivoWordAsignaturaId: UUID
  archivosAdicionalesIds?: Array<UUID>
}): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_import_from_file, payload)
}

/** Guardado de tarjetas/fields (Edge: merge server-side en asignaturas.datos y columnas) */
export type SubjectsUpdateFieldsPatch = Partial<{
  codigo: string | null
  nombre: string
  tipo: TipoAsignatura
  creditos: number
  horas_semana: number | null
  numero_ciclo: number | null
  linea_plan_id: UUID | null

  datos: Record<string, any>
}>

export async function subjects_update_fields(
  subjectId: UUID,
  patch: SubjectsUpdateFieldsPatch,
): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_update_fields, {
    subjectId,
    patch,
  })
}

export async function subjects_update_contenido(
  subjectId: UUID,
  unidades: Array<any>,
): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_update_contenido, {
    subjectId,
    unidades,
  })
}

export type BibliografiaUpsertInput = Array<{
  id?: UUID
  tipo: 'BASICA' | 'COMPLEMENTARIA'
  cita: string
  tipo_fuente?: 'MANUAL' | 'BIBLIOTECA'
  biblioteca_item_id?: string | null
}>

export async function subjects_update_bibliografia(
  subjectId: UUID,
  entries: BibliografiaUpsertInput,
): Promise<{ ok: true }> {
  return invokeEdge<{ ok: true }>(EDGE.subjects_update_bibliografia, {
    subjectId,
    entries,
  })
}

/** Documento SEP asignatura */
/* export type DocumentoResult = {
  archivoId: UUID;
  signedUrl: string;
  mimeType?: string;
  nombre?: string;
}; */

export async function subjects_generate_document(
  subjectId: UUID,
): Promise<DocumentoResult> {
  return invokeEdge<DocumentoResult>(EDGE.subjects_generate_document, {
    subjectId,
  })
}

export async function subjects_get_document(
  subjectId: UUID,
): Promise<DocumentoResult | null> {
  return invokeEdge<DocumentoResult | null>(EDGE.subjects_get_document, {
    subjectId,
  })
}

export async function subjects_get_structure_catalog(): Promise<
  Array<Database['public']['Tables']['estructuras_asignatura']['Row']>
> {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('estructuras_asignatura')
    .select('*')
    .order('nombre', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export async function asignaturas_update(
  asignaturaId: UUID,
  patch: Partial<Asignatura>, // O tu tipo específico para el Patch de materias
): Promise<Asignatura> {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('asignaturas')
    .update(patch)
    .eq('id', asignaturaId)
    .select() // Trae la materia actualizada
    .single()

  throwIfError(error)
  return requireData(data, 'No se pudo actualizar la asignatura.')
}

// Insertar una nueva línea
export async function lineas_insert(linea: {
  nombre: string
  plan_estudio_id: string
  orden: number
  area?: string
}) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('lineas_plan') // Asegúrate que el nombre de la tabla sea correcto
    .insert([linea])
    .select()
    .single()

  if (error) throw error
  return data
}

// Actualizar una línea existente
export async function lineas_update(
  lineaId: string,
  patch: { nombre?: string; orden?: number; area?: string },
) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('lineas_plan')
    .update(patch)
    .eq('id', lineaId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function lineas_delete(lineaId: string) {
  const supabase = supabaseBrowser()

  // Nota: Si configuraste "ON DELETE SET NULL" en tu base de datos,
  // las asignaturas se desvincularán solas. Si no, Supabase podría dar error.
  const { error } = await supabase
    .from('lineas_plan')
    .delete()
    .eq('id', lineaId)

  if (error) throw error
  return lineaId
}
