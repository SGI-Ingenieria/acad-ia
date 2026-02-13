import { Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export const ImprovementCard = ({
  suggestions,
  onApply,
}: {
  suggestions: Array<any>
  onApply: (key: string, value: string) => void
}) => {
  // Estado para rastrear qué campos han sido aplicados
  const [appliedFields, setAppliedFields] = useState<Array<string>>([])

  const handleApply = (key: string, value: string) => {
    onApply(key, value)
    setAppliedFields((prev) => [...prev, key])
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-4">
      {suggestions.map((sug) => {
        const isApplied = appliedFields.includes(sug.key)

        return (
          <div
            key={sug.key}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{sug.label}</h3>
              <Button
                size="sm"
                onClick={() => handleApply(sug.key, sug.newValue)}
                disabled={isApplied}
                className={`h-8 rounded-full px-4 text-xs transition-all ${
                  isApplied
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-[#00a189] text-white hover:bg-[#008f7a]'
                }`}
              >
                {isApplied ? (
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
                  ? 'border-[#ccfbf1] bg-[#f0fdfa] text-slate-700'
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
