import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useUpdatePlanFields } from '@/data' // Tu hook existente

export const ImprovementCard = ({
  suggestions,
  onApply,
  planId, // Necesitamos el ID
  currentDatos, // Necesitamos los datos actuales para no sobrescribir todo el JSON
}: {
  suggestions: Array<any>
  onApply?: (key: string, value: string) => void
  planId: string
  currentDatos: any
}) => {
  const [appliedFields, setAppliedFields] = useState<Array<string>>([])
  const updatePlan = useUpdatePlanFields()

  const handleApply = (key: string, newValue: string) => {
    if (!currentDatos) return

    // 1. Lógica para preparar el valor (idéntica a tu handleSave original)
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

    // 2. Construir el nuevo objeto 'datos' manteniendo lo que ya existía
    const datosActualizados = {
      ...currentDatos,
      [key]: finalValue,
    }

    // 3. Ejecutar la mutación directamente aquí
    updatePlan.mutate(
      {
        planId: planId as any,
        patch: { datos: datosActualizados },
      },
      {
        onSuccess: () => {
          setAppliedFields((prev) => [...prev, key])
          if (onApply) onApply(key, newValue)
          console.log(`Campo ${key} guardado exitosamente`)
        },
      },
    )
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-4">
      {suggestions.map((sug) => {
        const isApplied = appliedFields.includes(sug.key)
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
