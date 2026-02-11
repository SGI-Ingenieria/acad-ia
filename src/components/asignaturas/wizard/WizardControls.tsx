import { useNavigate } from '@tanstack/react-router'

import type { AIGenerateSubjectInput } from '@/data'
import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

import { Button } from '@/components/ui/button'
import { useGenerateSubjectAI } from '@/data'

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
  const generateSubjectAI = useGenerateSubjectAI()
  const handleCreate = async () => {
    setWizard((w) => ({
      ...w,
      isLoading: true,
      errorMessage: null,
    }))

    try {
      if (wizard.tipoOrigen === 'IA') {
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

        const asignatura = await generateSubjectAI.mutateAsync(aiInput)
        console.log(
          `${new Date().toISOString()} - Asignatura IA generada`,
          asignatura,
        )

        navigate({
          to: `/planes/${wizard.plan_estudio_id}/asignaturas/${asignatura.id}`,
          state: { showConfetti: true },
        })
        return
      }
    } catch (err: any) {
      setWizard((w) => ({
        ...w,
        isLoading: false,
        errorMessage: err?.message ?? 'Error creando la asignatura',
      }))
    } finally {
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
