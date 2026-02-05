import { useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'

import { useNuevaAsignaturaWizard } from './hooks/useNuevaAsignaturaWizard'

import { PasoBasicosForm } from '@/components/asignaturas/wizard/PasoBasicosForm'
import { PasoDetallesPanel } from '@/components/asignaturas/wizard/PasoDetallesPanel'
import { PasoMetodoCardGroup } from '@/components/asignaturas/wizard/PasoMetodoCardGroup'
import { PasoResumenCard } from '@/components/asignaturas/wizard/PasoResumenCard'
import { WizardControls } from '@/components/asignaturas/wizard/WizardControls'
import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { WizardResponsiveHeader } from '@/components/wizard/WizardResponsiveHeader'

const auth_get_current_user_role = (): string => 'JEFE_CARRERA'

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
    canContinueDesdeDetalles,
    simularGeneracionIA,
    crearAsignatura,
  } = useNuevaAsignaturaWizard(planId)

  const handleClose = () => {
    navigate({ to: `/planes/${planId}/asignaturas`, resetScroll: false })
  }

  if (role !== 'JEFE_CARRERA') {
    return (
      <WizardLayout title="Nueva Asignatura" onClose={handleClose}>
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Icons.ShieldAlert className="h-5 w-5" />
              Sin permisos
            </CardTitle>
            <CardDescription>
              Solo el Jefe de Carrera puede crear asignaturas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button variant="secondary" onClick={handleClose}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </WizardLayout>
    )
  }

  return (
    <Wizard.Stepper.Provider
      initialStep={Wizard.utils.getFirst().id}
      className="flex h-full flex-col"
    >
      {({ methods }) => {
        const idx = Wizard.utils.getIndex(methods.current.id)

        return (
          <WizardLayout
            title="Nueva Asignatura"
            onClose={handleClose}
            headerSlot={
              <WizardResponsiveHeader wizard={Wizard} methods={methods} />
            }
            footerSlot={
              <Wizard.Stepper.Controls>
                <WizardControls
                  errorMessage={wizard.errorMessage}
                  onPrev={() => methods.prev()}
                  onNext={() => methods.next()}
                  disablePrev={idx === 0 || wizard.isLoading}
                  disableNext={
                    wizard.isLoading ||
                    (idx === 0 && !canContinueDesdeMetodo) ||
                    (idx === 1 && !canContinueDesdeBasicos) ||
                    (idx === 2 && !canContinueDesdeDetalles)
                  }
                  disableCreate={wizard.isLoading}
                  isLastStep={idx >= Wizard.steps.length - 1}
                  wizard={wizard}
                  setWizard={setWizard}
                />
              </Wizard.Stepper.Controls>
            }
          >
            <div className="mx-auto max-w-3xl">
              {idx === 0 && (
                <Wizard.Stepper.Panel>
                  <PasoMetodoCardGroup wizard={wizard} onChange={setWizard} />
                </Wizard.Stepper.Panel>
              )}

              {idx === 1 && (
                <Wizard.Stepper.Panel>
                  <PasoBasicosForm wizard={wizard} onChange={setWizard} />
                </Wizard.Stepper.Panel>
              )}

              {idx === 2 && (
                <Wizard.Stepper.Panel>
                  <PasoDetallesPanel
                    wizard={wizard}
                    onChange={setWizard}
                    onGenerarIA={simularGeneracionIA}
                  />
                </Wizard.Stepper.Panel>
              )}

              {idx === 3 && (
                <Wizard.Stepper.Panel>
                  <PasoResumenCard wizard={wizard} />
                </Wizard.Stepper.Panel>
              )}
            </div>
          </WizardLayout>
        )
      }}
    </Wizard.Stepper.Provider>
  )
}
