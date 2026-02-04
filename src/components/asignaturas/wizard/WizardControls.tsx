import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

import { Button } from '@/components/ui/button'

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
  onCreate,
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
  onCreate: () => Promise<void> | void
}) {
  const handleCreate = async () => {
    setWizard((w) => ({
      ...w,
      isLoading: true,
      errorMessage: null,
    }))

    try {
      await onCreate()
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

      <div className="flex-1">
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
