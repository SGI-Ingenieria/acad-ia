import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  ai_generate_subject,
  asignaturas_update,
  subjects_bibliografia_list,
  subjects_clone_from_existing,
  subjects_create_manual,
  subjects_generate_document,
  subjects_get,
  subjects_get_document,
  subjects_history,
  subjects_import_from_file,
  subjects_persist_from_ai,
  subjects_update_bibliografia,
  subjects_update_contenido,
  subjects_update_fields,
} from '../api/subjects.api'
import { qk } from '../query/keys'

import type {
  BibliografiaUpsertInput,
  SubjectsCreateManualInput,
  SubjectsUpdateFieldsPatch,
} from '../api/subjects.api'
import type { UUID } from '../types/domain'

export function useSubject(subjectId: UUID | null | undefined) {
  return useQuery({
    queryKey: subjectId
      ? qk.asignatura(subjectId)
      : ['asignaturas', 'detail', null],
    queryFn: () => subjects_get(subjectId as UUID),
    enabled: Boolean(subjectId),
  })
}

export function useSubjectBibliografia(subjectId: UUID | null | undefined) {
  return useQuery({
    queryKey: subjectId
      ? qk.asignaturaBibliografia(subjectId)
      : ['asignaturas', 'bibliografia', null],
    queryFn: () => subjects_bibliografia_list(subjectId as UUID),
    enabled: Boolean(subjectId),
  })
}

export function useSubjectHistorial(subjectId: UUID | null | undefined) {
  return useQuery({
    queryKey: subjectId
      ? qk.asignaturaHistorial(subjectId)
      : ['asignaturas', 'historial', null],
    queryFn: () => subjects_history(subjectId as UUID),
    enabled: Boolean(subjectId),
  })
}

export function useSubjectDocumento(subjectId: UUID | null | undefined) {
  return useQuery({
    queryKey: subjectId
      ? qk.asignaturaDocumento(subjectId)
      : ['asignaturas', 'documento', null],
    queryFn: () => subjects_get_document(subjectId as UUID),
    enabled: Boolean(subjectId),
    staleTime: 30_000,
  })
}

/* ------------------ Mutations ------------------ */

export function useCreateSubjectManual() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubjectsCreateManualInput) =>
      subjects_create_manual(payload),
    onSuccess: (subject) => {
      qc.setQueryData(qk.asignatura(subject.id), subject)
      qc.invalidateQueries({
        queryKey: qk.planAsignaturas(subject.plan_estudio_id),
      })
      qc.invalidateQueries({
        queryKey: qk.planHistorial(subject.plan_estudio_id),
      })
    },
  })
}

export function useGenerateSubjectAI() {
  return useMutation({ mutationFn: ai_generate_subject })
}

export function usePersistSubjectFromAI() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: { planId: UUID; jsonAsignatura: any }) =>
      subjects_persist_from_ai(payload),
    onSuccess: (subject) => {
      qc.setQueryData(qk.asignatura(subject.id), subject)
      qc.invalidateQueries({
        queryKey: qk.planAsignaturas(subject.plan_estudio_id),
      })
      qc.invalidateQueries({
        queryKey: qk.planHistorial(subject.plan_estudio_id),
      })
    },
  })
}

export function useCloneSubject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: subjects_clone_from_existing,
    onSuccess: (subject) => {
      qc.setQueryData(qk.asignatura(subject.id), subject)
      qc.invalidateQueries({
        queryKey: qk.planAsignaturas(subject.plan_estudio_id),
      })
      qc.invalidateQueries({
        queryKey: qk.planHistorial(subject.plan_estudio_id),
      })
    },
  })
}

export function useImportSubjectFromFile() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: subjects_import_from_file,
    onSuccess: (subject) => {
      qc.setQueryData(qk.asignatura(subject.id), subject)
      qc.invalidateQueries({
        queryKey: qk.planAsignaturas(subject.plan_estudio_id),
      })
      qc.invalidateQueries({
        queryKey: qk.planHistorial(subject.plan_estudio_id),
      })
    },
  })
}

export function useUpdateSubjectFields() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { subjectId: UUID; patch: SubjectsUpdateFieldsPatch }) =>
      subjects_update_fields(vars.subjectId, vars.patch),
    onSuccess: (updated) => {
      qc.setQueryData(qk.asignatura(updated.id), updated)
      qc.invalidateQueries({
        queryKey: qk.planAsignaturas(updated.plan_estudio_id),
      })
      qc.invalidateQueries({ queryKey: qk.asignaturaHistorial(updated.id) })
    },
  })
}

export function useUpdateSubjectContenido() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { subjectId: UUID; unidades: Array<any> }) =>
      subjects_update_contenido(vars.subjectId, vars.unidades),
    onSuccess: (updated) => {
      qc.setQueryData(qk.asignatura(updated.id), updated)
      qc.invalidateQueries({ queryKey: qk.asignaturaHistorial(updated.id) })
    },
  })
}

export function useUpdateSubjectBibliografia() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { subjectId: UUID; entries: BibliografiaUpsertInput }) =>
      subjects_update_bibliografia(vars.subjectId, vars.entries),
    onSuccess: (_ok, vars) => {
      qc.invalidateQueries({
        queryKey: qk.asignaturaBibliografia(vars.subjectId),
      })
      qc.invalidateQueries({ queryKey: qk.asignaturaHistorial(vars.subjectId) })
    },
  })
}

export function useGenerateSubjectDocumento() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (subjectId: UUID) => subjects_generate_document(subjectId),
    onSuccess: (_doc, subjectId) => {
      qc.invalidateQueries({ queryKey: qk.asignaturaDocumento(subjectId) })
      qc.invalidateQueries({ queryKey: qk.asignaturaHistorial(subjectId) })
    },
  })
}

export function useUpdateAsignatura() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: {
      asignaturaId: UUID
      patch: Partial<SubjectsUpdateFieldsPatch>
    }) => asignaturas_update(vars.asignaturaId, vars.patch),

    onSuccess: (updated) => {
      // 1. Actualizamos la materia específica en la caché si tienes un query de "detalle"
      qc.setQueryData(['asignatura', updated.id], updated)

      // 2. IMPORTANTÍSIMO: Invalidamos la lista de materias del plan
      // para que el mapa curricular vea los cambios (créditos, horas, nombre, etc.)
      qc.invalidateQueries({
        queryKey: ['plan_asignaturas', updated.plan_estudio_id],
      })

      // 3. Si tienes una lista general de asignaturas, también la invalidamos
      qc.invalidateQueries({ queryKey: ['asignaturas', 'list'] })
    },
  })
}
