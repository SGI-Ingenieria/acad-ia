import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useUpdatePlanFields, useUpdateRecommendationApplied } from '@/data'

export const ImprovementCard = ({
  suggestions,
  onApply,
  planId,
  currentDatos,
  activeChatId,
  onApplySuccess,
}: {
  suggestions: Array<any>
  onApply?: (key: string, value: string) => void
  planId: string
  currentDatos: any
  activeChatId: any
  onApplySuccess?: (key: string) => void
}) => {
  const [localApplied, setLocalApplied] = useState<Array<string>>([])
  const updatePlan = useUpdatePlanFields()
  const updateAppliedStatus = useUpdateRecommendationApplied()

  const handleApply = (key: string, newValue: string) => {
    if (!currentDatos) return
    const currentValue = currentDatos[key]
    let finalValue: any

    if (
      typeof currentValue === 'object' &&
      currentValue !== null &&
      'description' in currentValue
    ) {
      finalValue = { ...currentValue, description: newValue }
    } else {
      finalValue = newValue
    }

    const datosActualizados = {
      ...currentDatos,
      [key]: finalValue,
    }

    updatePlan.mutate(
      {
        planId: planId as any,
        patch: { datos: datosActualizados },
      },
      {
        onSuccess: () => {
          setLocalApplied((prev) => [...prev, key])

          if (onApplySuccess) onApplySuccess(key)
          if (activeChatId) {
            updateAppliedStatus.mutate({
              conversacionId: activeChatId,
              campoAfectado: key,
            })
          }

          if (onApply) onApply(key, newValue)
        },
      },
    )
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-4">
      {suggestions.map((sug) => {
        const isApplied = sug.applied === true || localApplied.includes(sug.key)
        const isUpdating =
          updatePlan.isPending &&
          updatePlan.variables.patch.datos?.[sug.key] !== undefined

        return (
          <div
            key={sug.key}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
              isApplied ? 'border-teal-200 bg-teal-50/20' : 'border-slate-100'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{sug.label}</h3>
              <Button
                size="sm"
                onClick={() => handleApply(sug.key, sug.newValue)}
                disabled={isApplied || !!isUpdating}
                className={`h-8 rounded-full px-4 text-xs transition-all ${
                  isApplied
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-[#00a189] text-white hover:bg-[#008f7a]'
                }`}
              >
                {isUpdating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : isApplied ? (
                  <span className="flex items-center gap-1">
                    <Check size={12} /> Aplicado
                  </span>
                ) : (
                  'Aplicar mejora'
                )}
              </Button>
            </div>

            <div
              className={`rounded-xl border p-3 text-sm transition-colors duration-300 ${
                isApplied
                  ? 'border-teal-100 bg-teal-50/50 text-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {sug.newValue}
            </div>
          </div>
        )
      })}
    </div>
  )
}
