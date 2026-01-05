import type { NewSubjectWizardState } from '@/features/asignaturas/new/types'

import { Button } from '@/components/ui/button'

export function WizardControls({
  Wizard,
  methods,
  wizard,
  canContinueDesdeMetodo,
  canContinueDesdeBasicos,
  canContinueDesdeConfig,
  onCreate,
}: {
  Wizard: any
  methods: any
  wizard: NewSubjectWizardState
  canContinueDesdeMetodo: boolean
  canContinueDesdeBasicos: boolean
  canContinueDesdeConfig: boolean
  onCreate: () => void
}) {
  const idx = Wizard.utils.getIndex(methods.current.id)
  const isLast = idx >= Wizard.steps.length - 1

  return (
    <div className="flex-none border-t bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {wizard.errorMessage && (
            <span className="text-destructive text-sm font-medium">
              {wizard.errorMessage}
            </span>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => methods.prev()}
            disabled={idx === 0 || wizard.isLoading}
          >
            Anterior
          </Button>

          {!isLast ? (
            <Button
              onClick={() => methods.next()}
              disabled={
                wizard.isLoading ||
                (idx === 0 && !canContinueDesdeMetodo) ||
                (idx === 1 && !canContinueDesdeBasicos) ||
                (idx === 2 && !canContinueDesdeConfig)
              }
            >
              Siguiente
            </Button>
          ) : (
            <Button onClick={onCreate} disabled={wizard.isLoading}>
              {wizard.isLoading ? 'Creando...' : 'Crear Asignatura'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
