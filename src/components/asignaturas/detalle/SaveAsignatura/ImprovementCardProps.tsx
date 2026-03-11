import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'

import type { IASugerencia } from '@/types/asignatura'

import { Button } from '@/components/ui/button'
import {
  useUpdateAsignatura,
  useSubject,
  useUpdateSubjectRecommendation, // Importamos tu nuevo hook
} from '@/data'

interface ImprovementCardProps {
  sug: IASugerencia
  asignaturaId: string
}

export function ImprovementCard({ sug, asignaturaId }: ImprovementCardProps) {
  const { data: asignatura } = useSubject(asignaturaId)
  const updateAsignatura = useUpdateAsignatura()

  // Hook para marcar en la base de datos que la sugerencia fue aceptada
  const updateRecommendation = useUpdateSubjectRecommendation()

  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (!asignatura?.datos) return

    setIsApplying(true)
    try {
      // 1. Actualizar el contenido real de la asignatura (JSON datos)
      const nuevosDatos = {
        ...asignatura.datos,
        [sug.campoKey]: sug.valorSugerido,
      }

      await updateAsignatura.mutateAsync({
        asignaturaId: asignaturaId as any,
        patch: {
          datos: nuevosDatos,
        } as any,
      })

      // 2. Marcar la sugerencia como "aplicada: true" en la tabla de mensajes
      // Usamos los datos que vienen en el objeto 'sug'
      await updateRecommendation.mutateAsync({
        mensajeId: sug.messageId,
        campoAfectado: sug.campoKey,
      })

      // Al terminar, React Query invalidará 'subject-messages'
      // y la card pasará automáticamente al estado "Aplicado" (gris)
    } catch (error) {
      console.error('Error al aplicar mejora:', error)
    } finally {
      setIsApplying(false)
    }
  }

  // --- ESTADO APLICADO ---
  if (sug.aceptada) {
    return (
      <div className="flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
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
          "{sug.valorSugerido}"
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

      <div className="line-clamp-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600 italic">
        "{sug.valorSugerido}"
      </div>
    </div>
  )
}
