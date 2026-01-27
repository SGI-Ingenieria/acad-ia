import {
  createFileRoute,
  useNavigate,
  useLocation,
} from '@tanstack/react-router'
// import confetti from 'canvas-confetti'
import { Pencil, Check, X, Sparkles, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

import type { DatosGeneralesField } from '@/types/plan'

import { Button } from '@/components/ui/button'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePlan } from '@/data'

// import { toast } from 'sonner' // Asegúrate de tener sonner instalado o quita la línea
export const Route = createFileRoute('/planes/$planId/_detalle/datos')({
  component: DatosGeneralesPage,
})

const formatLabel = (key: string) => {
  const result = key.replace(/_/g, ' ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

function DatosGeneralesPage() {
  const { planId } = Route.useParams()
  const { data, isLoading } = usePlan(planId)
  const navigate = useNavigate()
  // Inicializamos campos como un arreglo vacío
  const [campos, setCampos] = useState<Array<DatosGeneralesField>>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const location = useLocation()

  // Confetti al llegar desde creación
  useEffect(() => {
    if (location.state.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title) // Limpiar el estado para que no se repita
    }
  }, [location.state])

  // Efecto para transformar data?.datos en el arreglo de campos
  useEffect(() => {
    const properties = data?.estructuras_plan?.definicion?.properties

    const valores = data?.datos as Record<string, unknown>

    if (properties && typeof properties === 'object') {
      const datosTransformados: Array<DatosGeneralesField> = Object.entries(
        properties,
      ).map(([key, schema], index) => {
        const rawValue = valores[key]

        return {
          id: (index + 1).toString(),
          label: schema?.title || formatLabel(key),
          helperText: schema?.description || '',
          holder: schema?.examples || '',
          value:
            rawValue !== undefined && rawValue !== null ? String(rawValue) : '',

          requerido: true,

          // 👇 TIPO DE CAMPO
          tipo: Array.isArray(schema?.enum)
            ? 'select'
            : schema?.type === 'number'
              ? 'number'
              : 'texto',

          opciones: schema?.enum || [],
        }
      })

      setCampos(datosTransformados)
    }

    console.log(properties)
  }, [data])

  // 3. Manejadores de acciones (Ahora como funciones locales)
  const handleEdit = (campo: DatosGeneralesField) => {
    setEditingId(campo.id)
    setEditValue(campo.value)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = (id: string) => {
    // Actualizamos el estado local de la lista
    setCampos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: editValue } : c)),
    )
    setEditingId(null)
    setEditValue('')
    // toast.success('Cambios guardados localmente')
  }

  const handleIARequest = (descripcion: string) => {
    navigate({
      to: '/planes/$planId/iaplan',
      params: {
        planId: planId, // o dinámico
      },
      state: {
        prefill: descripcion,
      } as any,
    })
  }
  return (
    <div className="animate-in fade-in container mx-auto px-6 py-6 duration-500">
      <div className="mb-6">
        <h2 className="text-foreground text-lg font-semibold">
          Datos Generales del Plan
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Información estructural y descriptiva del plan de estudios
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {campos.map((campo) => {
          const isEditing = editingId === campo.id

          return (
            <div
              key={campo.id}
              className={`rounded-xl border transition-all ${
                isEditing
                  ? 'border-teal-500 shadow-lg ring-2 ring-teal-50'
                  : 'bg-white hover:shadow-md'
              }`}
            >
              {/* Header de la Card */}
              <TooltipProvider>
                <div className="flex items-center justify-between border-b bg-slate-50/50 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="cursor-help text-sm font-medium text-slate-700">
                          {campo.label}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        {campo.helperText || 'Información del campo'}
                      </TooltipContent>
                    </Tooltip>

                    {campo.requerido && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-teal-600"
                            onClick={() => handleIARequest(campo.value)}
                          >
                            <Sparkles size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Generar con IA</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(campo)}
                          >
                            <Pencil size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar campo</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </TooltipProvider>

              {/* Contenido de la Card */}
              <div className="p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[120px]"
                      placeholder={campo.holder}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X size={14} className="mr-1" /> Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={() => handleSave(campo.id)}
                      >
                        <Check size={14} className="mr-1" /> Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[100px]">
                    {campo.value ? (
                      <div className="text-sm leading-relaxed text-slate-600">
                        {campo.tipo === 'lista' ? (
                          <ul className="space-y-1">
                            {campo.value.split('\n').map((item, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">{campo.value}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <AlertCircle size={14} />
                        <span>Sin contenido.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
