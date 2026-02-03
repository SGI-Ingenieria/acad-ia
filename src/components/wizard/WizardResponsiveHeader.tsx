import { CircularProgress } from '@/components/CircularProgress'
import { StepWithTooltip } from '@/components/wizard/StepWithTooltip'

export function WizardResponsiveHeader({
  wizard,
  methods,
}: {
  wizard: any
  methods: any
}) {
  const idx = wizard.utils.getIndex(methods.current.id)
  const totalSteps = wizard.steps.length
  const currentIndex = idx + 1
  const hasNextStep = idx < totalSteps - 1
  const nextStep = wizard.steps[currentIndex]

  return (
    <>
      <div className="block sm:hidden">
        <div className="flex items-center gap-5">
          <CircularProgress current={currentIndex} total={totalSteps} />
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-slate-900">
              <StepWithTooltip
                title={methods.current.title}
                desc={methods.current.description}
              />
            </h2>
            {hasNextStep && nextStep ? (
              <p className="text-sm text-slate-400">
                Siguiente: {nextStep.title}
              </p>
            ) : (
              <p className="text-sm font-medium text-green-500">
                ¡Último paso!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <wizard.Stepper.Navigation className="border-border/60 rounded-xl border bg-slate-50 p-2">
          {wizard.steps.map((step: any) => (
            <wizard.Stepper.Step
              key={step.id}
              of={step.id}
              className="whitespace-nowrap"
            >
              <wizard.Stepper.Title>
                <StepWithTooltip title={step.title} desc={step.description} />
              </wizard.Stepper.Title>
            </wizard.Stepper.Step>
          ))}
        </wizard.Stepper.Navigation>
      </div>
    </>
  )
}
