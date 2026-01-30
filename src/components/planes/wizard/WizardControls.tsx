import { useNavigate } from '@tanstack/react-router'

import type { NivelPlanEstudio, TipoCiclo } from '@/data/types/domain'
import type { NewPlanWizardState } from '@/features/planes/nuevo/types'
// import type { Database } from '@/types/supabase'

import { Button } from '@/components/ui/button'
// import { supabaseBrowser } from '@/data'
import { useCreatePlanManual, useGeneratePlanAI } from '@/data/hooks/usePlans'

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
  const createPlanManual = useCreatePlanManual()
  // const supabaseClient = supabaseBrowser()
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
            descripcionEnfoqueAcademico:
              wizard.iaConfig?.descripcionEnfoqueAcademico || '',
            instruccionesAdicionalesIA:
              wizard.iaConfig?.instruccionesAdicionalesIA || '',
            archivosReferencia: wizard.iaConfig?.archivosReferencia || [],
            repositoriosIds: wizard.iaConfig?.repositoriosReferencia || [],
            archivosAdjuntos: wizard.iaConfig?.archivosAdjuntos || [],
          },
        }

        console.log(`${new Date().toISOString()} - Enviando a generar plan IA`)

        const data = await generatePlanAI.mutateAsync(aiInput as any)
        console.log(`${new Date().toISOString()} - Plan IA generado`, data)

        navigate({
          to: `/planes/${data.plan.id}`,
          state: { showConfetti: true },
        })
        return
      }

      if (wizard.tipoOrigen === 'MANUAL') {
        // Crear plan vacío manualmente usando el hook
        const plan = await createPlanManual.mutateAsync({
          carreraId: wizard.datosBasicos.carreraId,
          estructuraId: wizard.datosBasicos.estructuraPlanId as string,
          nombre: wizard.datosBasicos.nombrePlan,
          nivel: wizard.datosBasicos.nivel as NivelPlanEstudio,
          tipoCiclo: wizard.datosBasicos.tipoCiclo as TipoCiclo,
          numCiclos: (wizard.datosBasicos.numCiclos as number) || 1,
          datos: {},
        })

        // Navegar al nuevo plan
        navigate({
          to: `/planes/${plan.id}`,
          state: { showConfetti: true },
        })
        return
      }
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
    <div className="flex grow items-center justify-between">
      <Button variant="secondary" onClick={onPrev} disabled={disablePrev}>
        Anterior
      </Button>
      <div className="flex-1">
        {errorMessage && (
          <span className="text-destructive text-sm font-medium">
            {errorMessage}
          </span>
        )}
      </div>
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
  )
}
