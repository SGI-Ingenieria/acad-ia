import { useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'

import { useNuevoPlanWizard } from './hooks/useNuevoPlanWizard'

import { PasoBasicosForm } from '@/components/planes/wizard/PasoBasicosForm/PasoBasicosForm'
import { PasoDetallesPanel } from '@/components/planes/wizard/PasoDetallesPanel/PasoDetallesPanel'
import { PasoModoCardGroup } from '@/components/planes/wizard/PasoModoCardGroup'
import { PasoResumenCard } from '@/components/planes/wizard/PasoResumenCard'
import { WizardControls } from '@/components/planes/wizard/WizardControls'
import { WizardHeader } from '@/components/planes/wizard/WizardHeader'
import { defineStepper } from '@/components/stepper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Mock de permisos/rol
const auth_get_current_user_role = () => 'JEFE_CARRERA' as const

const Wizard = defineStepper(
  {
    id: 'modo',
    title: 'Método',
    description: 'Selecciona cómo crearás el plan',
  },
  {
    id: 'basicos',
    title: 'Datos básicos',
    description: 'Nombre, carrera, nivel y ciclos',
  },
  { id: 'detalles', title: 'Detalles', description: 'IA, clonado o archivos' },
  { id: 'resumen', title: 'Resumen', description: 'Confirma y crea el plan' },
)

export default function NuevoPlanModalContainer() {
  const navigate = useNavigate()
  const role = auth_get_current_user_role()

  const {
    wizard,
    setWizard,
    carrerasFiltradas,
    canContinueDesdeModo,
    canContinueDesdeBasicos,
    canContinueDesdeDetalles,
    generarPreviewIA,
  } = useNuevoPlanWizard()

  const handleClose = () => {
    navigate({ to: '/planes', resetScroll: false })
  }

  const crearPlan = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }))
    await new Promise((r) => setTimeout(r, 900))
    const nuevoId = (() => {
      if (wizard.modoCreacion === 'MANUAL') return 'plan_new_manual_001'
      if (wizard.modoCreacion === 'IA') return 'plan_new_ai_001'
      if (wizard.subModoClonado === 'INTERNO') return 'plan_new_clone_001'
      return 'plan_new_import_001'
    })()
    navigate({ to: `/planes/${nuevoId}` })
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="flex h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        {role !== 'JEFE_CARRERA' ? (
          <>
            <DialogHeader className="flex-none border-b p-6">
              <DialogTitle>Nuevo plan de estudios</DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-6">
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.ShieldAlert className="text-destructive h-5 w-5" />
                    Sin permisos
                  </CardTitle>
                  <CardDescription>
                    No tienes permisos para crear planes de estudio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <button
                    className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-md border px-3 py-2 text-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    onClick={handleClose}
                  >
                    Volver
                  </button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Wizard.Stepper.Provider
            initialStep={Wizard.utils.getFirst().id}
            className="flex h-full flex-col"
          >
            {({ methods }) => {
              const currentIndex = Wizard.utils.getIndex(methods.current.id) + 1
              const totalSteps = Wizard.steps.length
              const nextStep = Wizard.steps[currentIndex]

              return (
                <>
                  <WizardHeader
                    currentIndex={currentIndex}
                    totalSteps={totalSteps}
                    currentTitle={methods.current.title}
                    currentDescription={methods.current.description}
                    nextTitle={nextStep?.title}
                    onClose={handleClose}
                    Wizard={Wizard}
                  />

                  <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    <div className="mx-auto max-w-3xl">
                      {Wizard.utils.getIndex(methods.current.id) === 0 && (
                        <Wizard.Stepper.Panel>
                          <PasoModoCardGroup
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
                            carrerasFiltradas={carrerasFiltradas}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 2 && (
                        <Wizard.Stepper.Panel>
                          <PasoDetallesPanel
                            wizard={wizard}
                            onChange={setWizard}
                            onGenerarIA={generarPreviewIA}
                            isLoading={wizard.isLoading}
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

                  <div className="flex-none border-t bg-white p-6">
                    <Wizard.Stepper.Controls>
                      <WizardControls
                        errorMessage={wizard.errorMessage}
                        onPrev={() => methods.prev()}
                        onNext={() => methods.next()}
                        onCreate={crearPlan}
                        disablePrev={
                          Wizard.utils.getIndex(methods.current.id) === 0 ||
                          wizard.isLoading
                        }
                        disableNext={
                          wizard.isLoading ||
                          (Wizard.utils.getIndex(methods.current.id) === 0 &&
                            !canContinueDesdeModo) ||
                          (Wizard.utils.getIndex(methods.current.id) === 1 &&
                            !canContinueDesdeBasicos) ||
                          (Wizard.utils.getIndex(methods.current.id) === 2 &&
                            !canContinueDesdeDetalles)
                        }
                        disableCreate={wizard.isLoading}
                        isLastStep={
                          Wizard.utils.getIndex(methods.current.id) >=
                          Wizard.steps.length - 1
                        }
                      />
                    </Wizard.Stepper.Controls>
                  </div>
                </>
              )
            }}
          </Wizard.Stepper.Provider>
        )}
      </DialogContent>
    </Dialog>
  )
}
