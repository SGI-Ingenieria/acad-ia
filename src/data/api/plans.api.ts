import { supabaseBrowser } from "../supabase/client";
import { invokeEdge } from "../supabase/invokeEdge";
import { buildRange, throwIfError, requireData } from "./_helpers";
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
} from "../types/domain";

const EDGE = {
  plans_create_manual: "plans_create_manual",
  ai_generate_plan: "ai_generate_plan",
  plans_persist_from_ai: "plans_persist_from_ai",
  plans_clone_from_existing: "plans_clone_from_existing",
  plans_import_from_files: "plans_import_from_files",

  plans_update_fields: "plans_update_fields",
  plans_update_map: "plans_update_map",
  plans_transition_state: "plans_transition_state",

  plans_generate_document: "plans_generate_document",
  plans_get_document: "plans_get_document",
} as const;

export type PlanListFilters = {
  search?: string;
  carreraId?: UUID;
  facultadId?: UUID; // filtra por carreras.facultad_id
  estadoId?: UUID;
  activo?: boolean;

  limit?: number;
  offset?: number;
};

export async function plans_list(filters: PlanListFilters = {}): Promise<Paged<PlanEstudio>> {
  const supabase = supabaseBrowser();

  let q = supabase
    .from("planes_estudio")
    .select(
      `
      id,carrera_id,estructura_id,nombre,nivel,tipo_ciclo,numero_ciclos,datos,estado_actual_id,activo,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,
      carreras(id,facultad_id,nombre,nombre_corto,clave_sep,activa, facultades(id,nombre,nombre_corto,color,icono)),
      estructuras_plan(id,nombre,tipo,version,definicion),
      estados_plan(id,clave,etiqueta,orden,es_final)
    `,
      { count: "exact" }
    )
    .order("actualizado_en", { ascending: false });

  if (filters.search?.trim()) q = q.ilike("nombre", `%${filters.search.trim()}%`);
  if (filters.carreraId) q = q.eq("carrera_id", filters.carreraId);
  if (filters.estadoId) q = q.eq("estado_actual_id", filters.estadoId);
  if (typeof filters.activo === "boolean") q = q.eq("activo", filters.activo);

  // filtro por FK “hacia arriba” (PostgREST soporta filtros en recursos embebidos)
  if (filters.facultadId) q = q.eq("carreras.facultad_id", filters.facultadId);

  const { from, to } = buildRange(filters.limit, filters.offset);
  if (typeof from === "number" && typeof to === "number") q = q.range(from, to);

  const { data, error, count } = await q;
  throwIfError(error);

  return { data: data ?? [], count: count ?? null };
}

export async function plans_get(planId: UUID): Promise<PlanEstudio> {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from("planes_estudio")
    .select(
      `
      id,carrera_id,estructura_id,nombre,nivel,tipo_ciclo,numero_ciclos,datos,estado_actual_id,activo,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en,
      carreras(id,facultad_id,nombre,nombre_corto,clave_sep,activa, facultades(id,nombre,nombre_corto,color,icono)),
      estructuras_plan(id,nombre,tipo,version,definicion),
      estados_plan(id,clave,etiqueta,orden,es_final)
    `
    )
    .eq("id", planId)
    .single();

  throwIfError(error);
  return requireData(data, "Plan no encontrado.");
}

export async function plan_lineas_list(planId: UUID): Promise<LineaPlan[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("lineas_plan")
    .select("id,plan_estudio_id,nombre,orden,area,creado_en,actualizado_en")
    .eq("plan_estudio_id", planId)
    .order("orden", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function plan_asignaturas_list(planId: UUID): Promise<Asignatura[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("asignaturas")
    .select(
      "id,plan_estudio_id,estructura_id,facultad_propietaria_id,codigo,nombre,tipo,creditos,horas_semana,numero_ciclo,linea_plan_id,orden_celda,datos,contenido_tematico,tipo_origen,meta_origen,creado_por,actualizado_por,creado_en,actualizado_en"
    )
    .eq("plan_estudio_id", planId)
    .order("numero_ciclo", { ascending: true, nullsFirst: false })
    .order("orden_celda", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function plans_history(planId: UUID): Promise<CambioPlan[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("cambios_plan")
    .select("id,plan_estudio_id,cambiado_por,cambiado_en,tipo,campo,valor_anterior,valor_nuevo,interaccion_ia_id")
    .eq("plan_estudio_id", planId)
    .order("cambiado_en", { ascending: false });

  throwIfError(error);
  return data ?? [];
}

/** Wizard: crear plan manual (Edge Function) */
export type PlansCreateManualInput = {
  carreraId: UUID;
  estructuraId: UUID;
  nombre: string;
  nivel: NivelPlanEstudio;
  tipoCiclo: TipoCiclo;
  numCiclos: number;
  datos?: Partial<PlanDatosSep> & Record<string, any>;
};

export async function plans_create_manual(input: PlansCreateManualInput): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_create_manual, input);
}

/** Wizard: IA genera preview JSON (Edge Function) */
export type AIGeneratePlanInput = {
  datosBasicos: {
    nombrePlan: string;
    carreraId: UUID;
    facultadId?: UUID;
    nivel: string;
    tipoCiclo: TipoCiclo;
    numCiclos: number;
  };
  iaConfig: {
    descripcionEnfoque: string;
    poblacionObjetivo?: string;
    notasAdicionales?: string;
    archivosReferencia?: UUID[];
    repositoriosIds?: UUID[];
    usarMCP?: boolean;
  };
};

export async function ai_generate_plan(input: AIGeneratePlanInput): Promise<any> {
  return invokeEdge<any>(EDGE.ai_generate_plan, input);
}

export async function plans_persist_from_ai(payload: { jsonPlan: any }): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_persist_from_ai, payload);
}

export async function plans_clone_from_existing(payload: {
  planOrigenId: UUID;
  overrides: Partial<Pick<PlanEstudio, "nombre" | "nivel" | "tipo_ciclo" | "numero_ciclos">> & {
    carrera_id?: UUID;
    estructura_id?: UUID;
    datos?: Partial<PlanDatosSep> & Record<string, any>;
  };
}): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_clone_from_existing, payload);
}

export async function plans_import_from_files(payload: {
  datosBasicos: {
    nombrePlan: string;
    carreraId: UUID;
    estructuraId: UUID;
    nivel: string;
    tipoCiclo: TipoCiclo;
    numCiclos: number;
  };
  archivoWordPlanId: UUID;
  archivoMapaExcelId?: UUID | null;
  archivoMateriasExcelId?: UUID | null;
}): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_import_from_files, payload);
}

/** Update de tarjetas/fields del plan (Edge Function: merge server-side) */
export type PlansUpdateFieldsPatch = {
  nombre?: string;
  nivel?: NivelPlanEstudio;
  tipo_ciclo?: TipoCiclo;
  numero_ciclos?: number;
  datos?: Partial<PlanDatosSep> & Record<string, any>;
};

export async function plans_update_fields(planId: UUID, patch: PlansUpdateFieldsPatch): Promise<PlanEstudio> {
  return invokeEdge<PlanEstudio>(EDGE.plans_update_fields, { planId, patch });
}

/** Operaciones del mapa curricular (mover/reordenar) */
export type PlanMapOperation =
  | {
      op: "MOVE_ASIGNATURA";
      asignaturaId: UUID;
      numero_ciclo: number | null;
      linea_plan_id: UUID | null;
      orden_celda?: number | null;
    }
  | {
      op: "REORDER_CELDA";
      linea_plan_id: UUID;
      numero_ciclo: number;
      asignaturaIdsOrdenados: UUID[];
    };

export async function plans_update_map(planId: UUID, ops: PlanMapOperation[]): Promise<{ ok: true }> {
  return invokeEdge<{ ok: true }>(EDGE.plans_update_map, { planId, ops });
}

export async function plans_transition_state(payload: {
  planId: UUID;
  haciaEstadoId: UUID;
  comentario?: string;
}): Promise<{ ok: true }> {
  return invokeEdge<{ ok: true }>(EDGE.plans_transition_state, payload);
}

/** Documento (Edge Function: genera y devuelve URL firmada o metadata) */
export type DocumentoResult = {
  archivoId: UUID;
  signedUrl: string;
  mimeType?: string;
  nombre?: string;
};

export async function plans_generate_document(planId: UUID): Promise<DocumentoResult> {
  return invokeEdge<DocumentoResult>(EDGE.plans_generate_document, { planId });
}

export async function plans_get_document(planId: UUID): Promise<DocumentoResult | null> {
  return invokeEdge<DocumentoResult | null>(EDGE.plans_get_document, { planId });
}
