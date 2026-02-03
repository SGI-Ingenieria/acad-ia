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

const EDGE = {
  subjects_create_manual: 'subjects_create_manual',
  ai_generate_subject: 'ai_generate_subject',
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
      id,plan_estudio_id,estructura_id,codigo,nombre,tipo,creditos,numero_ciclo,linea_plan_id,orden_celda,datos,contenido_tematico,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,
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

/** Wizard: crear asignatura manual (Edge Function) */
export type SubjectsCreateManualInput = {
  planId: UUID
  datosBasicos: {
    nombre: string
    clave?: string
    tipo: TipoAsignatura
    creditos: number
    horasSemana?: number
    estructuraId: UUID
  }
}

export async function subjects_create_manual(
  payload: SubjectsCreateManualInput,
): Promise<Asignatura> {
  return invokeEdge<Asignatura>(EDGE.subjects_create_manual, payload)
}

export async function ai_generate_subject(payload: {
  planId: UUID
  datosBasicos: {
    nombre: string
    clave?: string
    tipo: TipoAsignatura
    creditos: number
    horasSemana?: number
    estructuraId: UUID
  }
  iaConfig: {
    descripcionEnfoque: string
    notasAdicionales?: string
    archivosExistentesIds?: Array<UUID>
    repositoriosIds?: Array<UUID>
    archivosAdhocIds?: Array<UUID>
    usarMCP?: boolean
  }
}): Promise<any> {
  return invokeEdge<any>(EDGE.ai_generate_subject, payload)
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
