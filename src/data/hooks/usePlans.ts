import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  ai_generate_plan,
  getCatalogos,
  plan_asignaturas_list,
  plan_lineas_list,
  plans_clone_from_existing,
  plans_create_manual,
  plans_generate_document,
  plans_get,
  plans_get_document,
  plans_history,
  plans_import_from_files,
  plans_list,
  plans_persist_from_ai,
  plans_transition_state,
  plans_update_fields,
  plans_update_map,
} from '../api/plans.api'
import { qk } from '../query/keys'

import type {
  PlanListFilters,
  PlanMapOperation,
  PlansCreateManualInput,
  PlansUpdateFieldsPatch,
} from '../api/plans.api'
import type { UUID } from '../types/domain'

export function usePlanes(filters: PlanListFilters) {
  // 🧠 Tip: memoiza "filters" (useMemo) para que queryKey sea estable.
  return useQuery({
    // Usamos la factory de keys para consistencia
    queryKey: qk.planesList(filters),

    // La función fetch
    queryFn: () => plans_list(filters),

    // UX: Mantiene los datos viejos mientras carga la paginación nueva
    placeholderData: keepPreviousData,

    // Opcional: Tiempo que la data se considera fresca
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function usePlan(planId: UUID | null | undefined) {
  return useQuery({
    queryKey: planId ? qk.plan(planId) : ['planes', 'detail', null],
    queryFn: () => plans_get(planId as UUID),
    enabled: Boolean(planId),
  })
}

export function usePlanLineas(planId: UUID | null | undefined) {
  return useQuery({
    queryKey: planId ? qk.planLineas(planId) : ['planes', 'lineas', null],
    queryFn: () => plan_lineas_list(planId as UUID),
    enabled: Boolean(planId),
  })
}

export function usePlanAsignaturas(planId: UUID | null | undefined) {
  return useQuery({
    queryKey: planId
      ? qk.planAsignaturas(planId)
      : ['planes', 'asignaturas', null],
    queryFn: () => plan_asignaturas_list(planId as UUID),
    enabled: Boolean(planId),
  })
}

export function usePlanHistorial(planId: UUID | null | undefined) {
  return useQuery({
    queryKey: planId ? qk.planHistorial(planId) : ['planes', 'historial', null],
    queryFn: () => plans_history(planId as UUID),
    enabled: Boolean(planId),
  })
}

export function usePlanDocumento(planId: UUID | null | undefined) {
  return useQuery({
    queryKey: planId ? qk.planDocumento(planId) : ['planes', 'documento', null],
    queryFn: () => plans_get_document(planId as UUID),
    enabled: Boolean(planId),
    staleTime: 30_000,
  })
}

export function useCatalogosPlanes() {
  return useQuery({
    queryKey: ['catalogos_planes'],
    queryFn: getCatalogos,
    staleTime: 1000 * 60 * 60, // 1 hora de caché (estos datos casi no cambian)
  })
}

/* ------------------ Mutations ------------------ */

export function useCreatePlanManual() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: PlansCreateManualInput) => plans_create_manual(input),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
      qc.setQueryData(qk.plan(plan.id), plan)
    },
  })
}

export function useGeneratePlanAI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ai_generate_plan,
    onSuccess: (data) => {
      // Asumiendo que la Edge Function devuelve { ok: true, plan: { id: ... } }
      console.log('success de ai_generate_plan')

      const newPlan = data.plan

      if (newPlan) {
        // 1. Invalidar la lista para que aparezca el nuevo plan
        qc.invalidateQueries({ queryKey: ['planes', 'list'] })

        // 2. (Opcional) Pre-cargar el dato individual para que la navegación sea instantánea
        // qc.setQueryData(["planes", "detail", newPlan.id], newPlan);
      }
    },
  })
}

// Funcion obsoleta porque ahora el plan se persiste directamente en useGeneratePlanAI
export function usePersistPlanFromAI() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: { jsonPlan: any }) => plans_persist_from_ai(payload),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
      qc.setQueryData(qk.plan(plan.id), plan)
    },
  })
}

export function useClonePlan() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: plans_clone_from_existing,
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
      qc.setQueryData(qk.plan(plan.id), plan)
    },
  })
}

export function useImportPlanFromFiles() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: plans_import_from_files,
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
      qc.setQueryData(qk.plan(plan.id), plan)
    },
  })
}

export function useUpdatePlanFields() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { planId: UUID; patch: PlansUpdateFieldsPatch }) =>
      plans_update_fields(vars.planId, vars.patch),
    onSuccess: (updated) => {
      qc.setQueryData(qk.plan(updated.id), updated)
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
      qc.invalidateQueries({ queryKey: qk.planHistorial(updated.id) })
    },
  })
}

export function useUpdatePlanMapa() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { planId: UUID; ops: Array<PlanMapOperation> }) =>
      plans_update_map(vars.planId, vars.ops),

    // ✅ Optimista (rápida) para el caso MOVE_ASIGNATURA
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: qk.planAsignaturas(vars.planId) })
      const prev = qc.getQueryData<any>(qk.planAsignaturas(vars.planId))

      // solo optimizamos MOVEs simples
      const moves = vars.ops.filter((x) => x.op === 'MOVE_ASIGNATURA')

      if (prev && Array.isArray(prev) && moves.length) {
        const next = prev.map((a: any) => {
          const m = moves.find((x) => x.asignaturaId === a.id)
          if (!m) return a
          return {
            ...a,
            numero_ciclo: m.numero_ciclo,
            linea_plan_id: m.linea_plan_id,
            orden_celda: m.orden_celda ?? a.orden_celda,
          }
        })
        qc.setQueryData(qk.planAsignaturas(vars.planId), next)
      }

      return { prev }
    },

    onError: (_err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.planAsignaturas(vars.planId), ctx.prev)
    },

    onSuccess: (_ok, vars) => {
      qc.invalidateQueries({ queryKey: qk.planAsignaturas(vars.planId) })
      qc.invalidateQueries({ queryKey: qk.planHistorial(vars.planId) })
    },
  })
}

export function useTransitionPlanEstado() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: plans_transition_state,
    onSuccess: (_ok, vars) => {
      qc.invalidateQueries({ queryKey: qk.plan(vars.planId) })
      qc.invalidateQueries({ queryKey: qk.planHistorial(vars.planId) })
      qc.invalidateQueries({ queryKey: ['planes', 'list'] })
    },
  })
}

export function useGeneratePlanDocumento() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (planId: UUID) => plans_generate_document(planId),
    onSuccess: (_doc, planId) => {
      qc.invalidateQueries({ queryKey: qk.planDocumento(planId) })
      qc.invalidateQueries({ queryKey: qk.planHistorial(planId) })
    },
  })
}
