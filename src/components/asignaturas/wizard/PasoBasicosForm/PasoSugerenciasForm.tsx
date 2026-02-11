import { RefreshCw, Sparkles } from 'lucide-react'

import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'
import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generate_subject_suggestions, usePlan } from '@/data'
import { cn } from '@/lib/utils'

export default function PasoSugerenciasForm({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: Dispatch<SetStateAction<NewSubjectWizardState>>
}) {
  const ciclo = wizard.iaMultiple?.ciclo ?? ''
  const enfoque = wizard.iaMultiple?.enfoque ?? ''
  const cantidadDeSugerencias = wizard.iaMultiple?.cantidadDeSugerencias ?? 10

  const setIaMultiple = (
    patch: Partial<NonNullable<NewSubjectWizardState['iaMultiple']>>,
  ) =>
    onChange(
      (w): NewSubjectWizardState => ({
        ...w,
        iaMultiple: {
          ciclo: w.iaMultiple?.ciclo ?? null,
          enfoque: w.iaMultiple?.enfoque ?? '',
          cantidadDeSugerencias: w.iaMultiple?.cantidadDeSugerencias ?? 10,
          ...patch,
        },
      }),
    )

  const { data: plan } = usePlan(wizard.plan_estudio_id)

  const toggleAsignatura = (id: string, checked: boolean) => {
    onChange((w) => ({
      ...w,
      sugerencias: w.sugerencias.map((s) =>
        s.id === id ? { ...s, selected: checked } : s,
      ),
    }))
  }

  const onGenerarSugerencias = async () => {
    const sugerenciasConservadas = wizard.sugerencias.filter((s) => s.selected)

    onChange((w) => ({
      ...w,
      isLoading: true,
      errorMessage: null,
      sugerencias: sugerenciasConservadas,
    }))

    try {
      const numeroCiclo = wizard.iaMultiple?.ciclo
      if (!numeroCiclo || !Number.isFinite(numeroCiclo) || numeroCiclo <= 0) {
        onChange((w) => ({
          ...w,
          isLoading: false,
          errorMessage: 'Ingresa un número de ciclo válido.',
        }))
        return
      }

      const cantidad = wizard.iaMultiple?.cantidadDeSugerencias ?? 10
      if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 50) {
        onChange((w) => ({
          ...w,
          isLoading: false,
          errorMessage: 'La cantidad de sugerencias debe ser entre 1 y 50.',
        }))
        return
      }

      const enfoqueTrim = wizard.iaMultiple?.enfoque.trim() ?? ''

      const nuevasSugerencias = await generate_subject_suggestions({
        plan_estudio_id: wizard.plan_estudio_id,
        numero_de_ciclo: numeroCiclo,
        enfoque: enfoqueTrim ? enfoqueTrim : undefined,
        cantidad_de_sugerencias: cantidad,
        sugerencias_conservadas: sugerenciasConservadas.map((s) => ({
          nombre: s.nombre,
          descripcion: s.descripcion,
        })),
      })

      onChange(
        (w): NewSubjectWizardState => ({
          ...w,
          isLoading: false,
          sugerencias: [...nuevasSugerencias, ...sugerenciasConservadas],
        }),
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error generando sugerencias.'
      onChange(
        (w): NewSubjectWizardState => ({
          ...w,
          isLoading: false,
          errorMessage: message,
        }),
      )
    }
  }

  return (
    <>
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
              min={1}
              max={999}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  setIaMultiple({ ciclo: null })
                  return
                }
                const asNumber = Number(raw)
                if (!Number.isFinite(asNumber)) return
                const n = Math.floor(Math.abs(asNumber))
                const capped = Math.min(n >= 1 ? n : 1, 999)
                setIaMultiple({ ciclo: capped })
              }}
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
        </div>

        <div className="mt-3 flex w-full flex-col items-end gap-3 md:flex-row">
          <div className="w-full md:w-44">
            <Label className="text-muted-foreground mb-1 block text-xs">
              Cantidad de sugerencias
            </Label>
            <Input
              placeholder="Ej. 10"
              value={cantidadDeSugerencias}
              type="number"
              min={1}
              max={50}
              step={1}
              inputMode="numeric"
              onKeyDown={(e) => {
                if (['.', ',', '-', 'e', 'E', '+'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') return
                const asNumber = Number(raw)
                if (!Number.isFinite(asNumber)) return
                const n = Math.floor(Math.abs(asNumber))
                const capped = Math.min(n >= 1 ? n : 1, 50)
                setIaMultiple({ cantidadDeSugerencias: capped })
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={onGenerarSugerencias}
            disabled={wizard.isLoading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generar sugerencias
          </Button>
        </div>

        <p className="text-muted-foreground mt-2 text-xs">
          Al generar más sugerencias, solo se conservarán las asignaturas que
          hayas seleccionado.
        </p>
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
          {wizard.sugerencias.filter((s) => s.selected).length} seleccionadas
        </div>
      </div>

      {/* --- LISTA DE ASIGNATURAS --- */}
      <div className="max-h-100 space-y-1 overflow-y-auto pr-1">
        {wizard.sugerencias.map((asignatura) => {
          const isSelected = asignatura.selected

          return (
            <Label
              key={asignatura.id}
              aria-checked={isSelected}
              className={cn(
                'border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950',
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  toggleAsignatura(asignatura.id, !!checked)
                }
                className={cn(
                  'peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring mt-0.5 h-5 w-5 shrink-0 border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  // isSelected ? '' : 'invisible',
                )}
              />

              {/* Contenido de la tarjeta */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground text-sm font-medium">
                    {asignatura.nombre}
                  </span>

                  {/* Badges de Tipo */}
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                      asignatura.tipo === 'OBLIGATORIA'
                        ? 'border-blue-200 bg-transparent text-blue-700 dark:border-blue-800 dark:text-blue-300'
                        : 'border-yellow-200 bg-transparent text-yellow-700 dark:border-yellow-800 dark:text-yellow-300',
                    )}
                  >
                    {asignatura.tipo}
                  </span>

                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {asignatura.creditos} cred. · {asignatura.horasAcademicas}h
                    acad. · {asignatura.horasIndependientes}h indep.
                  </span>
                </div>

                <p className="text-muted-foreground mt-1 text-sm">
                  {asignatura.descripcion}
                </p>
              </div>
            </Label>
          )
        })}
      </div>
    </>
  )
}
