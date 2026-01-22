import { useNavigate } from '@tanstack/react-router'

import type { NewPlanWizardState } from '@/features/planes/nuevo/types'

import { Button } from '@/components/ui/button'
import { useGeneratePlanAI } from '@/data/hooks/usePlans'

export function WizardControls({
  errorMessage,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  disableCreate,
  isLastStep,
  wizard,
  setWizard,
}: {
  errorMessage?: string | null
  onPrev: () => void
  onNext: () => void
  disablePrev: boolean
  disableNext: boolean
  disableCreate: boolean
  isLastStep: boolean
  wizard: NewPlanWizardState
  setWizard: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
}) {
  const navigate = useNavigate()
  const generatePlanAI = useGeneratePlanAI()
  // const persistPlanFromAI = usePersistPlanFromAI()

  const handleCreate = async () => {
    // Start loading
    setWizard(
      (w: NewPlanWizardState): NewPlanWizardState => ({
        ...w,
        isLoading: true,
        errorMessage: null,
      }),
    )

    try {
      if (wizard.tipoOrigen === 'IA') {
        const tipoCicloSafe = (wizard.datosBasicos.tipoCiclo ||
          'Semestre') as any
        const numCiclosSafe =
          typeof wizard.datosBasicos.numCiclos === 'number'
            ? wizard.datosBasicos.numCiclos
            : 1

        const aiInput = {
          datosBasicos: {
            nombrePlan: wizard.datosBasicos.nombrePlan,
            carreraId: wizard.datosBasicos.carreraId,
            facultadId: wizard.datosBasicos.facultadId || undefined,
            nivel: wizard.datosBasicos.nivel as string,
            tipoCiclo: tipoCicloSafe,
            numCiclos: numCiclosSafe,
            estructuraPlanId: wizard.datosBasicos.estructuraPlanId as string,
          },
          iaConfig: {
            descripcionEnfoque: wizard.iaConfig?.descripcionEnfoque || '',
            notasAdicionales: wizard.iaConfig?.notasAdicionales || '',
            archivosReferencia: wizard.iaConfig?.archivosReferencia || [],
            repositoriosIds: wizard.iaConfig?.repositoriosReferencia || [],
            archivosAdjuntos: wizard.iaConfig?.archivosAdjuntos || [],
          },
        }

        console.log(`${new Date().toISOString()} - Enviando a generar plan IA`)

        const data = await generatePlanAI.mutateAsync(aiInput as any)
        console.log(`${new Date().toISOString()} - Plan IA generado`, data)

        navigate({ to: `/planes/${data.plan.id}` })
        return
      }

      // Fallback mocks for non-IA origins
      await new Promise((r) => setTimeout(r, 900))
      const nuevoId = (() => {
        if (wizard.tipoOrigen === 'MANUAL') return 'plan_new_manual_001'
        if (
          wizard.tipoOrigen === 'CLONADO_INTERNO' ||
          wizard.tipoOrigen === 'CLONADO_TRADICIONAL'
        )
          return 'plan_new_clone_001'
        return 'plan_new_import_001'
      })()
      navigate({ to: `/planes/${nuevoId}` })
    } catch (err: any) {
      setWizard((w) => ({
        ...w,
        isLoading: false,
        errorMessage: err?.message ?? 'Error generando el plan',
      }))
    } finally {
      setWizard((w) => ({ ...w, isLoading: false }))
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {errorMessage && (
          <span className="text-destructive text-sm font-medium">
            {errorMessage}
          </span>
        )}
      </div>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={onPrev} disabled={disablePrev}>
          Anterior
        </Button>
        {isLastStep ? (
          <Button onClick={handleCreate} disabled={disableCreate}>
            Crear plan
          </Button>
        ) : (
          <Button onClick={onNext} disabled={disableNext}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  )
}
