import { CircularProgress } from '@/components/CircularProgress'
import { StepWithTooltip } from '@/components/wizard/StepWithTooltip'

export function WizardResponsiveHeader({
  wizard,
  methods,
  titleOverrides,
  hiddenStepIds,
}: {
  wizard: any
  methods: any
  titleOverrides?: Record<string, string>
  hiddenStepIds?: Array<string>
}) {
  const hidden = new Set(hiddenStepIds ?? [])
  const visibleSteps = (wizard.steps as Array<any>).filter(
    (s) => s && !hidden.has(s.id),
  )

  const idx = visibleSteps.findIndex((s) => s.id === methods.current.id)
  const safeIdx = idx >= 0 ? idx : 0
  const totalSteps = visibleSteps.length
  const currentIndex = Math.min(safeIdx + 1, totalSteps)
  const hasNextStep = safeIdx < totalSteps - 1
  const nextStep = visibleSteps[safeIdx + 1]

  const resolveTitle = (step: any) => titleOverrides?.[step?.id] ?? step?.title

  return (
    <>
      <div className="block sm:hidden">
        <div className="flex items-center gap-5">
          <CircularProgress current={currentIndex} total={totalSteps} />
          <div className="flex flex-col justify-center">
            <h2 className="text-lg font-bold text-slate-900">
              <StepWithTooltip
                title={resolveTitle(methods.current)}
                desc={methods.current.description}
              />
            </h2>
            {hasNextStep && nextStep ? (
              <p className="text-sm text-slate-400">
                Siguiente: {resolveTitle(nextStep)}
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
          {visibleSteps.map((step: any, visibleIdx: number) => (
            <wizard.Stepper.Step
              key={step.id}
              of={step.id}
              icon={visibleIdx + 1}
              className="whitespace-nowrap"
            >
              <wizard.Stepper.Title>
                <StepWithTooltip
                  title={resolveTitle(step)}
                  desc={step.description}
                />
              </wizard.Stepper.Title>
            </wizard.Stepper.Step>
          ))}
        </wizard.Stepper.Navigation>
      </div>
    </>
  )
}
