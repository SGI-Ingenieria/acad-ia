import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import type { AIGeneratePlanInput } from '@/data'
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
  const [isSpinningIA, setIsSpinningIA] = useState(false)
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

        const aiInput: AIGeneratePlanInput = {
          datosBasicos: {
            nombrePlan: wizard.datosBasicos.nombrePlan,
            carreraId: wizard.datosBasicos.carrera.id,
            facultadId: wizard.datosBasicos.facultad.id,
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

        setIsSpinningIA(true)
        const plan = await generatePlanAI.mutateAsync(aiInput as any)
        setIsSpinningIA(false)
        console.log(`${new Date().toISOString()} - Plan IA generado`, plan)

        navigate({
          to: `/planes/${plan.id}`,
          state: { showConfetti: true },
        })
        return
      }

      if (wizard.tipoOrigen === 'MANUAL') {
        // Crear plan vacío manualmente usando el hook
        const plan = await createPlanManual.mutateAsync({
          carreraId: wizard.datosBasicos.carrera.id,
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
      setIsSpinningIA(false)
      setWizard((w) => ({
        ...w,
        isLoading: false,
        errorMessage: err?.message ?? 'Error generando el plan',
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
        {errorMessage && (
          <span className="text-destructive text-sm font-medium">
            {errorMessage}
          </span>
        )}
      </div>

      <div className="mx-2 flex w-5 items-center justify-center">
        <Loader2
          className={
            wizard.tipoOrigen === 'IA' && isSpinningIA
              ? 'text-muted-foreground h-6 w-6 animate-spin'
              : 'h-6 w-6 opacity-0'
          }
          aria-hidden={!(wizard.tipoOrigen === 'IA' && isSpinningIA)}
        />
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
