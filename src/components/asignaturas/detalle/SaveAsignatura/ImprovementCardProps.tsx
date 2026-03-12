import { Check, Loader2, BookOpen, Clock, ListChecks } from 'lucide-react'
import { useState } from 'react'

import type { IASugerencia } from '@/types/asignatura'

import { Button } from '@/components/ui/button'
import {
  useUpdateAsignatura,
  useSubject,
  useUpdateSubjectRecommendation,
} from '@/data'
import { cn } from '@/lib/utils'

interface ImprovementCardProps {
  sug: IASugerencia
  asignaturaId: string
  onApplied: (campoKey: string) => void
}

export function ImprovementCard({
  sug,
  asignaturaId,
  onApplied,
}: ImprovementCardProps) {
  const { data: asignatura } = useSubject(asignaturaId)
  const updateAsignatura = useUpdateAsignatura()
  const updateRecommendation = useUpdateSubjectRecommendation()

  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (!asignatura) return

    setIsApplying(true)
    try {
      // 1. Identificar a qué columna debe ir el guardado
      let patchData = {}

      if (sug.campoKey === 'contenido_tematico') {
        // Se guarda directamente en la columna contenido_tematico
        patchData = { contenido_tematico: sug.valorSugerido }
      } else if (sug.campoKey === 'criterios_de_evaluacion') {
        // Se guarda directamente en la columna criterios_de_evaluacion
        patchData = { criterios_de_evaluacion: sug.valorSugerido }
      } else {
        // Otros campos (ciclo, fines, etc.) se siguen guardando en el JSON de la columna 'datos'
        patchData = {
          datos: {
            ...asignatura.datos,
            [sug.campoKey]: sug.valorSugerido,
          },
        }
      }

      // 2. Ejecutar la actualización con la estructura correcta
      await updateAsignatura.mutateAsync({
        asignaturaId: asignaturaId as any,
        patch: patchData as any,
      })

      // 3. Marcar la recomendación como aplicada
      await updateRecommendation.mutateAsync({
        mensajeId: sug.messageId,
        campoAfectado: sug.campoKey,
      })
      console.log(sug.campoKey)

      onApplied(sug.campoKey)
    } catch (error) {
      console.error('Error al aplicar mejora:', error)
    } finally {
      setIsApplying(false)
    }
  }

  // --- FUNCIÓN PARA RENDERIZAR EL CONTENIDO DE FORMA SEGURA ---
  const renderContenido = (valor: any) => {
    // Si no es un array, es texto simple
    if (!Array.isArray(valor)) {
      return <p className="italic">"{String(valor)}"</p>
    }

    // --- CASO 1: CONTENIDO TEMÁTICO (Detectamos si el primer objeto tiene 'unidad') ---
    if (valor[0]?.hasOwnProperty('unidad')) {
      return (
        <div className="space-y-3">
          {valor.map((u: any, idx: number) => (
            <div
              key={idx}
              className="rounded-md border border-teal-100 bg-white p-2 shadow-sm"
            >
              <div className="mb-1 flex items-center gap-2 border-b border-slate-50 pb-1 text-[11px] font-bold text-teal-800">
                <BookOpen size={12} /> Unidad {u.unidad}: {u.titulo}
              </div>
              <ul className="space-y-1">
                {u.temas?.map((t: any, tidx: number) => (
                  <li
                    key={tidx}
                    className="flex items-start justify-between gap-2 text-[10px] text-slate-600"
                  >
                    <span className="leading-tight">• {t.nombre}</span>
                    <span className="flex shrink-0 items-center gap-0.5 font-mono text-slate-400">
                      <Clock size={10} /> {t.horasEstimadas}h
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )
    }

    // --- CASO 2: CRITERIOS DE EVALUACIÓN (Detectamos si tiene 'criterio') ---
    if (valor[0]?.hasOwnProperty('criterio')) {
      return (
        <div className="space-y-2">
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
            <ListChecks size={12} /> Desglose de evaluación
          </div>
          {valor.map((c: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-white p-2 shadow-sm"
            >
              <span className="text-[11px] leading-tight text-slate-700">
                {c.criterio}
              </span>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                {c.porcentaje}%
              </div>
            </div>
          ))}
          {/* Opcional: Suma total para verificar que de 100% */}
          <div className="pt-1 text-right text-[9px] font-medium text-slate-400">
            Total:{' '}
            {valor.reduce(
              (acc: number, curr: any) => acc + (curr.porcentaje || 0),
              0,
            )}
            %
          </div>
        </div>
      )
    }

    // Caso por defecto (Array genérico)
    return (
      <pre className="text-[10px]">
        {/* JSON.stringify(valor, null, 2)*/ 'hola'}
      </pre>
    )
  }

  // --- ESTADO APLICADO ---
  if (sug.aceptada) {
    return (
      <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-3 opacity-80 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-4">
          <span className="text-sm font-bold text-slate-800">
            {sug.campoNombre}
          </span>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
            <Check size={14} />
            Aplicado
          </div>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50/30 p-3 text-xs leading-relaxed text-slate-500">
          {renderContenido(sug.valorSugerido)}
        </div>
      </div>
    )
  }

  // --- ESTADO PENDIENTE ---
  return (
    <div className="group flex flex-col rounded-xl border border-teal-100 bg-white p-3 shadow-sm transition-all hover:border-teal-200">
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="max-w-[150px] truncate rounded-lg border border-teal-100 bg-teal-50/50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-teal-700 uppercase">
          {sug.campoNombre}
        </span>

        <Button
          size="sm"
          disabled={isApplying || !asignatura}
          className="h-8 w-auto bg-teal-600 px-4 text-xs font-semibold shadow-sm hover:bg-teal-700"
          onClick={handleApply}
        >
          {isApplying ? (
            <Loader2 size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Check size={14} className="mr-1.5" />
          )}
          {isApplying ? 'Aplicando...' : 'Aplicar mejora'}
        </Button>
      </div>

      <div
        className={cn(
          'rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600',
          !Array.isArray(sug.valorSugerido) && 'line-clamp-4 italic',
        )}
      >
        {renderContenido(sug.valorSugerido)}
      </div>
    </div>
  )
}
