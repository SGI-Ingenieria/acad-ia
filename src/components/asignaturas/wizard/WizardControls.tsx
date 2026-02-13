import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import type { AIGenerateSubjectInput, AIGenerateSubjectJsonInput } from '@/data'
import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'
import type { TablesInsert } from '@/types/supabase'

import { Button } from '@/components/ui/button'
import {
  supabaseBrowser,
  useGenerateSubjectAI,
  qk,
  useCreateSubjectManual,
} from '@/data'

export function WizardControls({
  wizard,
  setWizard,
  errorMessage,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  disableCreate,
  isLastStep,
}: {
  wizard: NewSubjectWizardState
  setWizard: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
  errorMessage?: string | null
  onPrev: () => void
  onNext: () => void
  disablePrev: boolean
  disableNext: boolean
  disableCreate: boolean
  isLastStep: boolean
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const generateSubjectAI = useGenerateSubjectAI()
  const createSubjectManual = useCreateSubjectManual()
  const [isSpinningIA, setIsSpinningIA] = useState(false)
  const handleCreate = async () => {
    setWizard((w) => ({
      ...w,
      isLoading: true,
      errorMessage: null,
    }))

    try {
      if (wizard.tipoOrigen === 'IA_SIMPLE') {
        const aiInput: AIGenerateSubjectInput = {
          plan_estudio_id: wizard.plan_estudio_id,
          datosBasicos: {
            nombre: wizard.datosBasicos.nombre,
            codigo: wizard.datosBasicos.codigo,
            tipo: wizard.datosBasicos.tipo!,
            creditos: wizard.datosBasicos.creditos!,
            horasIndependientes: wizard.datosBasicos.horasIndependientes,
            horasAcademicas: wizard.datosBasicos.horasAcademicas,
            estructuraId: wizard.datosBasicos.estructuraId!,
          },
          iaConfig: {
            descripcionEnfoqueAcademico:
              wizard.iaConfig!.descripcionEnfoqueAcademico,
            instruccionesAdicionalesIA:
              wizard.iaConfig!.instruccionesAdicionalesIA,
            archivosReferencia: wizard.iaConfig!.archivosReferencia,
            repositoriosReferencia:
              wizard.iaConfig!.repositoriosReferencia || [],
            archivosAdjuntos: wizard.iaConfig!.archivosAdjuntos || [],
          },
        }

        console.log(
          `${new Date().toISOString()} - Enviando a generar asignatura con IA`,
        )

        setIsSpinningIA(true)
        const asignatura = await generateSubjectAI.mutateAsync(aiInput)
        // await new Promise((resolve) => setTimeout(resolve, 20000)) // debug
        setIsSpinningIA(false)
        // console.log(
        //   `${new Date().toISOString()} - Asignatura IA generada`,
        //   asignatura,
        // )

        navigate({
          to: `/planes/${wizard.plan_estudio_id}/asignaturas/${asignatura.id}`,
          state: { showConfetti: true },
        })
        return
      }

      if (wizard.tipoOrigen === 'IA_MULTIPLE') {
        const selected = wizard.sugerencias.filter((s) => s.selected)

        if (selected.length === 0) {
          throw new Error('Selecciona al menos una sugerencia.')
        }
        if (!wizard.plan_estudio_id) {
          throw new Error('Plan de estudio inválido.')
        }
        if (!wizard.estructuraId) {
          throw new Error('Selecciona una estructura para continuar.')
        }

        const supabase = supabaseBrowser()

        const placeholders: Array<TablesInsert<'asignaturas'>> = selected.map(
          (s): TablesInsert<'asignaturas'> => ({
            plan_estudio_id: wizard.plan_estudio_id,
            estructura_id: wizard.estructuraId,
            estado: 'generando',
            nombre: s.nombre,
            codigo: s.codigo ?? null,
            tipo: s.tipo ?? undefined,
            creditos: s.creditos ?? 0,
            horas_academicas: s.horasAcademicas ?? null,
            horas_independientes: s.horasIndependientes ?? null,
            linea_plan_id: s.linea_plan_id ?? null,
            numero_ciclo: s.numero_ciclo ?? null,
          }),
        )

        const { data: inserted, error: insertError } = await supabase
          .from('asignaturas')
          .insert(placeholders)
          .select('id')

        if (insertError) {
          throw new Error(insertError.message)
        }

        const insertedIds = inserted.map((r) => r.id)
        if (insertedIds.length !== selected.length) {
          throw new Error('No se pudieron crear todas las asignaturas.')
        }

        // Disparar generación en paralelo (no bloquear navegación)
        insertedIds.forEach((id, idx) => {
          const s = selected[idx]
          const payload: AIGenerateSubjectJsonInput = {
            id,
            descripcionEnfoqueAcademico: s.descripcion,
            // (opcionales) parches directos si el edge los usa
            estructura_id: wizard.estructuraId,
            linea_plan_id: s.linea_plan_id,
            numero_ciclo: s.numero_ciclo,
          }

          void generateSubjectAI.mutateAsync(payload).catch((e) => {
            console.error('Error generando asignatura IA (multiple):', e)
          })
        })

        // Invalidar la query del listado del plan (una vez) para que la lista
        // muestre el estado actualizado y recargue cuando lleguen updates.
        qc.invalidateQueries({
          queryKey: qk.planAsignaturas(wizard.plan_estudio_id),
        })

        navigate({
          to: `/planes/${wizard.plan_estudio_id}/asignaturas`,
          resetScroll: false,
        })

        return
      }

      if (wizard.tipoOrigen === 'MANUAL') {
        if (!wizard.plan_estudio_id) {
          throw new Error('Plan de estudio inválido.')
        }

        const asignatura = await createSubjectManual.mutateAsync({
          plan_estudio_id: wizard.plan_estudio_id,
          estructura_id: wizard.datosBasicos.estructuraId!,
          nombre: wizard.datosBasicos.nombre,
          codigo: wizard.datosBasicos.codigo ?? null,
          tipo: wizard.datosBasicos.tipo ?? undefined,
          creditos: wizard.datosBasicos.creditos ?? 0,
          horas_academicas: wizard.datosBasicos.horasAcademicas ?? null,
          horas_independientes: wizard.datosBasicos.horasIndependientes ?? null,
          linea_plan_id: null,
          numero_ciclo: null,
        })

        navigate({
          to: `/planes/${wizard.plan_estudio_id}/asignaturas/${asignatura.id}`,
          state: { showConfetti: true },
          resetScroll: false,
        })
      }
    } catch (err: any) {
      setIsSpinningIA(false)
      setWizard((w) => ({
        ...w,
        isLoading: false,
        errorMessage: err?.message ?? 'Error creando la asignatura',
      }))
    } finally {
      setIsSpinningIA(false)
      setWizard((w) => ({ ...w, isLoading: false }))
    }
  }

  return (
    <div className="flex grow items-center justify-between">
      <Button variant="secondary" onClick={onPrev} disabled={disablePrev}>
        Anterior
      </Button>

      <div className="mx-2 flex-1">
        {(errorMessage ?? wizard.errorMessage) && (
          <span className="text-destructive text-sm font-medium">
            {errorMessage ?? wizard.errorMessage}
          </span>
        )}
      </div>

      <div className="mx-2 flex w-5 items-center justify-center">
        <Loader2
          className={
            wizard.tipoOrigen === 'IA_SIMPLE' && isSpinningIA
              ? 'text-muted-foreground h-6 w-6 animate-spin'
              : 'h-6 w-6 opacity-0'
          }
          aria-hidden={!(wizard.tipoOrigen === 'IA_SIMPLE' && isSpinningIA)}
        />
      </div>

      {isLastStep ? (
        <Button onClick={handleCreate} disabled={disableCreate}>
          {wizard.isLoading ? 'Creando...' : 'Crear Asignatura'}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={disableNext}>
          Siguiente
        </Button>
      )}
    </div>
  )
}
