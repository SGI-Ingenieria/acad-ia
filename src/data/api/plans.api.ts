import { supabaseBrowser } from '../supabase/client'
import { invokeEdge } from '../supabase/invokeEdge'

import { buildRange, requireData, throwIfError } from './_helpers'

import type {
  Asignatura,
  CambioPlan,
  LineaPlan,
  NivelPlanEstudio,
  Paged,
  PlanDatosSep,
  PlanEstudio,
  TipoCiclo,
  UUID,
} from '../types/domain'
import type { UploadedFile } from '@/components/planes/wizard/PasoDetallesPanel/FileDropZone'

const EDGE = {
  plans_create_manual: 'plans_create_manual',
  ai_generate_plan: 'ai-generate-plan',
  plans_persist_from_ai: 'plans_persist_from_ai',
  plans_clone_from_existing: 'plans_clone_from_existing',

  plans_import_from_files: 'plans_import_from_files',

  plans_update_fields: 'plans_update_fields',
  plans_update_map: 'plans_update_map',
  plans_transition_state: 'plans_transition_state',

  plans_generate_document: 'plans_generate_document',
  plans_get_document: 'plans_get_document',
} as const

export type PlanListFilters = {
  search?: string
  carreraId?: UUID
  facultadId?: UUID // filtra por carreras.facultad_id
  estadoId?: UUID
  activo?: boolean

  limit?: number
  offset?: number
}

// Helper para limpiar texto (lo movemos fuera para reutilizar o lo dejas en un utils)
const cleanText = (text: string) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export async function plans_list(
  filters: PlanListFilters = {},
): Promise<Paged<PlanEstudio>> {
  const supabase = supabaseBrowser()

  // 1. Construimos la query base
  // NOTA IMPORTANTE: Para filtrar planes basados en facultad (que está en carreras),
  // necesitamos hacer un INNER JOIN. En Supabase se usa "!inner".
  // Si filters.facultadId existe, forzamos el inner join, si no, lo dejamos normal.

  const carreraModifier =
    filters.facultadId && filters.facultadId !== 'todas' ? '!inner' : ''

  let q = supabase
    .from('planes_estudio')
    .select(
      `
      *,
      carreras${carreraModifier} (
        *,
        facultades (*)
      ),
      estructuras_plan (*),
      estados_plan (*)
      `,
      { count: 'exact' },
    )
    .order('actualizado_en', { ascending: false })

  // 2. Aplicamos filtros dinámicos

  // SOLUCIÓN SEARCH: Limpiamos el input y buscamos en la columna generada
  if (filters.search?.trim()) {
    const cleanTerm = cleanText(filters.search.trim())
    // Usamos la columna nueva creada en el Paso 1
    q = q.ilike('nombre_search', `%${cleanTerm}%`)
  }

  if (filters.carreraId && filters.carreraId !== 'todas') {
    q = q.eq('carrera_id', filters.carreraId)
  }

  if (filters.estadoId && filters.estadoId !== 'todos') {
    q = q.eq('estado_actual_id', filters.estadoId)
  }

  if (typeof filters.activo === 'boolean') {
    q = q.eq('activo', filters.activo)
  }

  // Filtro por facultad (gracias al !inner arriba, esto filtrará los planes)
  if (filters.facultadId && filters.facultadId !== 'todas') {
    q = q.eq('carreras.facultad_id', filters.facultadId)
  }

  // 3. Paginación
  const { from, to } = buildRange(filters.limit, filters.offset)
  if (from !== undefined && to !== undefined) q = q.range(from, to)

  const { data, error, count } = await q
  throwIfError(error)

  return {
    // 1. Si data es null, usa [].
    // 2. Luego dile a TS que el resultado es tu Array tipado.
    data: (data ?? []) as unknown as Array<PlanEstudio>,
    count: count ?? 0,
  }
}

export async function plans_get(planId: UUID): Promise<PlanEstudio> {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('planes_estudio')
    .select(
      `
      *,
      carreras (*, facultades(*)),
      estructuras_plan (*),
      estados_plan (*)
    `,
    )
    .eq('id', planId)
    .single()

  throwIfError(error)
  return requireData(data, 'Plan no encontrado.')
}

export async function plan_lineas_list(
  planId: UUID,
): Promise<Array<LineaPlan>> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('lineas_plan')
    .select('id,plan_estudio_id,nombre,orden,area,creado_en,actualizado_en')
    .eq('plan_estudio_id', planId)
    .order('orden', { ascending: true })

  throwIfError(error)
  return data ?? []
}

export async function plan_asignaturas_list(
  planId: UUID,
): Promise<Array<Asignatura>> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('asignaturas')
    .select(
      'id,plan_estudio_id,estructura_id,facultad_propietaria_id,codigo,nombre,tipo,creditos,horas_semana,numero_ciclo,linea_plan_id,orden_celda,datos,contenido_tematico,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en',
    )
    .eq('plan_estudio_id', planId)
    .order('numero_ciclo', { ascending: true, nullsFirst: false })
    .order('orden_celda', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true })

  throwIfError(error)
  return data ?? []
}

export async function plans_history(planId: UUID): Promise<Array<CambioPlan>> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase
    .from('cambios_plan')
    .select(
      'id,plan_estudio_id,cambiado_por,cambiado_en,tipo,campo,valor_anterior,valor_nuevo',
    )
    .eq('plan_estudio_id', planId)
    .order('cambiado_en', { ascending: false })

  throwIfError(error)
  return data ?? []
}

/** Wizard: crear plan manual (Edge Function) */
export type PlansCreateManualInput = {
  carreraId: UUID
  estructuraId: UUID
  nombre: string
  nivel: NivelPlanEstudio
  tipoCiclo: TipoCiclo
  numCiclos: number
  datos?: Partial<PlanDatosSep> & Record<string, any>
}

export async function plans_create_manual(
  input: PlansCreateManualInput,
): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_create_manual, input)
}

/** Wizard: IA genera preview JSON (Edge Function) */
export type AIGeneratePlanInput = {
  datosBasicos: {
    nombrePlan: string
    carreraId: UUID
    facultadId?: UUID
    nivel: string
    tipoCiclo: TipoCiclo
    numCiclos: number
    estructuraPlanId: UUID
  }
  iaConfig: {
    descripcionEnfoque: string
    notasAdicionales?: string
    archivosReferencia?: Array<UUID>
    repositoriosIds?: Array<UUID>
    archivosAdjuntos: Array<UploadedFile>
    usarMCP?: boolean
  }
}

export async function ai_generate_plan(
  input: AIGeneratePlanInput,
): Promise<any> {
  console.log('input ai generate', input)

  const edgeFunctionBody = new FormData()
  edgeFunctionBody.append('datosBasicos', JSON.stringify(input.datosBasicos))
  edgeFunctionBody.append(
    'iaConfig',
    JSON.stringify({
      ...input.iaConfig,
      archivosAdjuntos: undefined, // los manejamos aparte
    }),
  )
  input.iaConfig.archivosAdjuntos.forEach((file, index) => {
    edgeFunctionBody.append(`archivosAdjuntos`, file.file)
  })

  return invokeEdge<any>(
    EDGE.ai_generate_plan,
    edgeFunctionBody,
    undefined,
    supabaseBrowser(),
  )
}

export async function plans_persist_from_ai(payload: {
  jsonPlan: any
}): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_persist_from_ai, payload)
}

export async function plans_clone_from_existing(payload: {
  planOrigenId: UUID
  overrides: Partial<
    Pick<PlanEstudio, 'nombre' | 'nivel' | 'tipo_ciclo' | 'numero_ciclos'>
  > & {
    carrera_id?: UUID
    estructura_id?: UUID
    datos?: Partial<PlanDatosSep> & Record<string, any>
  }
}): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_clone_from_existing, payload)
}

export async function plans_import_from_files(payload: {
  datosBasicos: {
    nombrePlan: string
    carreraId: UUID
    estructuraId: UUID
    nivel: string
    tipoCiclo: TipoCiclo
    numCiclos: number
  }
  archivoWordPlanId: UUID
  archivoMapaExcelId?: UUID | null
  archivoMateriasExcelId?: UUID | null
}): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_import_from_files, payload)
}

/** Update de tarjetas/fields del plan (Edge Function: merge server-side) */
export type PlansUpdateFieldsPatch = {
  nombre?: string
  nivel?: NivelPlanEstudio
  tipo_ciclo?: TipoCiclo
  numero_ciclos?: number
  datos?: Partial<PlanDatosSep> & Record<string, any>
}

export async function plans_update_fields(
  planId: UUID,
  patch: PlansUpdateFieldsPatch,
): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_update_fields, { planId, patch })
}

/** Operaciones del mapa curricular (mover/reordenar) */
export type PlanMapOperation =
  | {
      op: 'MOVE_ASIGNATURA'
      asignaturaId: UUID
      numero_ciclo: number | null
      linea_plan_id: UUID | null
      orden_celda?: number | null
    }
  | {
      op: 'REORDER_CELDA'
      linea_plan_id: UUID
      numero_ciclo: number
      asignaturaIdsOrdenados: Array<UUID>
    }

export async function plans_update_map(
  planId: UUID,
  ops: Array<PlanMapOperation>,
): Promise<{ ok: true }> {
  return invokeEdge<{ ok: true }>(EDGE.plans_update_map, { planId, ops })
}

export async function plans_transition_state(payload: {
  planId: UUID
  haciaEstadoId: UUID
  comentario?: string
}): Promise<{ ok: true }> {
  return invokeEdge<{ ok: true }>(EDGE.plans_transition_state, payload)
}

/** Documento (Edge Function: genera y devuelve URL firmada o metadata) */
export type DocumentoResult = {
  archivoId: UUID
  signedUrl: string
  mimeType?: string
  nombre?: string
}

export async function plans_generate_document(
  planId: UUID,
): Promise<DocumentoResult> {
  return invokeEdge<DocumentoResult>(EDGE.plans_generate_document, { planId })
}

export async function plans_get_document(
  planId: UUID,
): Promise<DocumentoResult | null> {
  return invokeEdge<DocumentoResult | null>(EDGE.plans_get_document, {
    planId,
  })
}

export async function getCatalogos() {
  const supabase = supabaseBrowser()

  const [facultadesRes, carrerasRes, estadosRes, estructurasPlanRes] =
    await Promise.all([
      supabase.from('facultades').select('*').order('nombre'),
      supabase.from('carreras').select('*').order('nombre'),
      supabase.from('estados_plan').select('*').order('orden'),
      supabase.from('estructuras_plan').select('*').order('creado_en', {
        ascending: true,
      }),
    ])

  return {
    facultades: facultadesRes.data ?? [],
    carreras: carrerasRes.data ?? [],
    estados: estadosRes.data ?? [],
    estructurasPlan: estructurasPlanRes.data ?? [],
  }
}
