import { RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

import type {
  AsignaturaSugerida,
  NewSubjectWizardState,
} from '@/features/asignaturas/nueva/types'
import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePlan } from '@/data'
import { cn } from '@/lib/utils'

export default function PasoSugerenciasForm({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: Dispatch<SetStateAction<NewSubjectWizardState>>
}) {
  const selectedIds = wizard.sugerencias
    .filter((s) => s.selected)
    .map((s) => s.id)
  const ciclo = wizard.iaMultiple?.ciclo ?? ''
  const enfoque = wizard.iaMultiple?.enfoque ?? ''
  const [suggestions, setSuggestions] = useState<Array<AsignaturaSugerida>>([])

  const setIaMultiple = (
    patch: Partial<NonNullable<NewSubjectWizardState['iaMultiple']>>,
  ) =>
    onChange(
      (w): NewSubjectWizardState => ({
        ...w,
        iaMultiple: {
          ciclo: w.iaMultiple?.ciclo ?? null,
          enfoque: w.iaMultiple?.enfoque ?? '',
          ...patch,
        },
      }),
    )

  const { data: plan } = usePlan(wizard.plan_estudio_id)

  const toggleAsignatura = (id: string, checked: boolean) => {
    const prev = selectedIds
    const next = checked ? [...prev, id] : prev.filter((x) => x !== id)
    setIaMultiple({ selectedIds: next })
  }

  return (
    <div className="p-6">
      {/* --- BLOQUE SUPERIOR: PARÁMETROS --- */}
      <div className="border-border/60 bg-muted/30 mb-4 rounded-xl border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-primary h-4 w-4" />
          <span className="text-sm font-semibold">
            Parámetros de sugerencia
          </span>
        </div>

        <div className="flex flex-col items-end gap-3 md:flex-row">
          {/* Input Ciclo */}
          <div className="w-full md:w-36">
            <Label className="text-muted-foreground mb-1 block text-xs">
              Número de ciclo
            </Label>
            <Input
              placeholder="Ej. 3"
              value={ciclo}
              type="number"
              onChange={(e) => setIaMultiple({ ciclo: Number(e.target.value) })}
            />
          </div>

          {/* Input Enfoque */}
          <div className="w-full flex-1">
            <Label className="text-muted-foreground mb-1 block text-xs">
              Enfoque (opcional)
            </Label>
            <Input
              placeholder="Ej. Enfocado en normativa mexicana y tecnología"
              value={enfoque}
              onChange={(e) => setIaMultiple({ enfoque: e.target.value })}
            />
          </div>

          {/* Botón Refrescar */}
          <Button type="button" variant="outline" className="h-9 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Más sugerencias
          </Button>
        </div>
      </div>

      {/* --- HEADER LISTA --- */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-base font-semibold">
            Asignaturas sugeridas
          </h3>
          <p className="text-muted-foreground text-xs">
            Basadas en el plan{' '}
            {plan ? `${plan.nivel} en ${plan.nombre}` : '...'}
          </p>
        </div>
        <div className="bg-muted text-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-semibold">
          {selectedIds.length} seleccionadas
        </div>
      </div>

      {/* --- LISTA DE ASIGNATURAS (CON EL ESTILO PEDIDO) --- */}
      <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {suggestions.map((asignatura) => {
          const isSelected = selectedIds.includes(asignatura.id)

          return (
            <Label
              key={asignatura.id}
              // Para que funcione el selector css `has-aria-checked` que tenías en tu snippet
              aria-checked={isSelected}
              className={cn(
                // Igual al patrón de ReferenciasParaIA
                'border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950',
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  toggleAsignatura(asignatura.id, !!checked)
                }
                className={cn(
                  // Igual al patrón de ReferenciasParaIA: invisible si no está seleccionado
                  'peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring mt-0.5 h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected ? '' : 'invisible',
                )}
              />

              {/* Contenido de la tarjeta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-medium">
                    {asignatura.data.nombre}
                  </span>

                  {/* Badges de Tipo */}
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                      asignatura.data.tipo === 'OBLIGATORIA'
                        ? 'border-blue-200 bg-transparent text-blue-700 dark:border-blue-800 dark:text-blue-300'
                        : 'border-yellow-200 bg-transparent text-yellow-700 dark:border-yellow-800 dark:text-yellow-300',
                    )}
                  >
                    {asignatura.data.tipo}
                  </span>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {asignatura.data.creditos} cred. ·{' '}
                    {asignatura.data.horasAcademicas}h acad. ·{' '}
                    {asignatura.data.horasIndependientes}h indep.
                  </span>
                </div>

                <p className="text-muted-foreground mt-1 text-xs">
                  {asignatura.data.descripcion}
                </p>
              </div>
            </Label>
          )
        })}
      </div>
    </div>
  )
}
