import { Button } from '@/components/ui/button'

export function WizardControls({
  errorMessage,
  onPrev,
  onNext,
  onCreate,
  disablePrev,
  disableNext,
  disableCreate,
  isLastStep,
}: {
  errorMessage?: string | null
  onPrev: () => void
  onNext: () => void
  onCreate: () => void
  disablePrev: boolean
  disableNext: boolean
  disableCreate: boolean
  isLastStep: boolean
}) {
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
          <Button onClick={onCreate} disabled={disableCreate}>
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
