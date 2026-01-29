import { useNavigate } from '@tanstack/react-router'

import { useNuevaAsignaturaWizard } from './hooks/useNuevaAsignaturaWizard'

import { PasoBasicosForm } from '@/components/asignaturas/wizard/PasoBasicosForm'
import { PasoConfiguracionPanel } from '@/components/asignaturas/wizard/PasoConfiguracionPanel'
import { PasoMetodoCardGroup } from '@/components/asignaturas/wizard/PasoMetodoCardGroup'
import { PasoResumenCard } from '@/components/asignaturas/wizard/PasoResumenCard'
import { VistaSinPermisos } from '@/components/asignaturas/wizard/VistaSinPermisos'
import { WizardControls } from '@/components/asignaturas/wizard/WizardControls'
import { WizardHeader } from '@/components/asignaturas/wizard/WizardHeader'
import { defineStepper } from '@/components/stepper'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const auth_get_current_user_role = () => 'JEFE_CARRERA' as const

const Wizard = defineStepper(
  {
    id: 'metodo',
    title: 'Método',
    description: 'Manual, IA o Clonado',
  },
  {
    id: 'basicos',
    title: 'Datos básicos',
    description: 'Nombre y estructura',
  },
  {
    id: 'detalles',
    title: 'Detalles',
    description: 'Detalles según modo',
  },
  {
    id: 'resumen',
    title: 'Resumen',
    description: 'Confirmar creación',
  },
)

export function NuevaAsignaturaModalContainer({ planId }: { planId: string }) {
  const navigate = useNavigate()
  const role = auth_get_current_user_role()

  const {
    wizard,
    setWizard,
    canContinueDesdeMetodo,
    canContinueDesdeBasicos,
    canContinueDesdeConfig,
    simularGeneracionIA,
    crearAsignatura,
  } = useNuevaAsignaturaWizard(planId)

  const handleClose = () => {
    navigate({ to: `/planes/${planId}/asignaturas`, resetScroll: false })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="flex h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {role !== 'JEFE_CARRERA' ? (
          <VistaSinPermisos onClose={handleClose} />
        ) : (
          <Wizard.Stepper.Provider
            initialStep={Wizard.utils.getFirst().id}
            className="flex h-full flex-col"
          >
            {({ methods }) => {
              const currentIndex = Wizard.utils.getIndex(methods.current.id) + 1
              const totalSteps = Wizard.steps.length
              const nextStep = Wizard.steps[currentIndex] ?? {
                title: '',
                description: '',
              }

              return (
                <>
                  <WizardHeader
                    title="Nueva Asignatura"
                    Wizard={Wizard}
                    methods={{ ...methods, onClose: handleClose }}
                  />

                  <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    <div className="mx-auto max-w-3xl">
                      {Wizard.utils.getIndex(methods.current.id) === 0 && (
                        <Wizard.Stepper.Panel>
                          <PasoMetodoCardGroup
                            wizard={wizard}
                            onChange={setWizard}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 1 && (
                        <Wizard.Stepper.Panel>
                          <PasoBasicosForm
                            wizard={wizard}
                            onChange={setWizard}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 2 && (
                        <Wizard.Stepper.Panel>
                          <PasoConfiguracionPanel
                            wizard={wizard}
                            onChange={setWizard}
                            onGenerarIA={simularGeneracionIA}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 3 && (
                        <Wizard.Stepper.Panel>
                          <PasoResumenCard wizard={wizard} />
                        </Wizard.Stepper.Panel>
                      )}
                    </div>
                  </div>

                  <WizardControls
                    Wizard={Wizard}
                    methods={methods}
                    wizard={wizard}
                    canContinueDesdeMetodo={canContinueDesdeMetodo}
                    canContinueDesdeBasicos={canContinueDesdeBasicos}
                    canContinueDesdeConfig={canContinueDesdeConfig}
                    onCreate={() => crearAsignatura(handleClose)}
                  />
                </>
              )
            }}
          </Wizard.Stepper.Provider>
        )}
      </DialogContent>
    </Dialog>
  )
}
