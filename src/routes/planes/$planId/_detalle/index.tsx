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
import { usePlan, useUpdatePlanFields } from '@/data'

// import { toast } from 'sonner' // Asegúrate de tener sonner instalado o quita la línea
export const Route = createFileRoute('/planes/$planId/_detalle/')({
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
  const updatePlan = useUpdatePlanFields()
  // Confetti al llegar desde creación
  useEffect(() => {
    if (location.state.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title) // Limpiar el estado para que no se repita
    }
  }, [location.state])

  // Efecto para transformar data?.datos en el arreglo de campos
  useEffect(() => {
    const definicion = data?.estructuras_plan?.definicion as any
    const properties = definicion?.properties
    const requiredOrder = definicion?.required as Array<string> | undefined

    const valores = (data?.datos as Record<string, unknown>) || {}

    if (properties && typeof properties === 'object') {
      let keys = Object.keys(properties)

      // Ordenar llaves basado en la lista "required" si existe
      if (Array.isArray(requiredOrder)) {
        keys = keys.sort((a, b) => {
          const indexA = requiredOrder.indexOf(a)
          const indexB = requiredOrder.indexOf(b)
          // Si 'a' está en la lista y 'b' no -> 'a' primero (-1)
          if (indexA !== -1 && indexB === -1) return -1
          // Si 'b' está en la lista y 'a' no -> 'b' primero (1)
          if (indexA === -1 && indexB !== -1) return 1
          // Si ambos están, comparar índices
          if (indexA !== -1 && indexB !== -1) return indexA - indexB
          // Ninguno en la lista, mantener orden relativo
          return 0
        })
      }

      const datosTransformados: Array<DatosGeneralesField> = keys.map(
        (key, index) => {
          const schema = properties[key]
          const rawValue = valores[key]

          return {
            clave: key,
            id: (index + 1).toString(),
            label: schema?.title || formatLabel(key),
            helperText: schema?.description || '',
            holder: schema?.examples || '',
            value:
              rawValue !== undefined && rawValue !== null
                ? String(rawValue)
                : '',

            requerido: true,

            // 👇 TIPO DE CAMPO
            tipo: Array.isArray(schema?.enum)
              ? 'select'
              : schema?.type === 'number'
                ? 'number'
                : 'texto',

            opciones: schema?.enum || [],
          }
        },
      )

      setCampos(datosTransformados)
    }
  }, [data])

  // 3. Manejadores de acciones (Ahora como funciones locales)
  const handleEdit = (nuevoCampo: DatosGeneralesField) => {
    // 1. SI YA ESTÁBAMOS EDITANDO OTRO CAMPO, GUARDAMOS EL ANTERIOR PRIMERO
    if (editingId && editingId !== nuevoCampo.id) {
      const campoAnterior = campos.find((c) => c.id === editingId)
      if (campoAnterior && editValue !== campoAnterior.value) {
        // Solo guardamos si el valor realmente cambió
        ejecutarGuardadoSilencioso(campoAnterior, editValue)
      }
    }

    // 2. ABRIMOS EL NUEVO CAMPO
    setEditingId(nuevoCampo.id)
    setEditValue(nuevoCampo.value)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }
  // Función auxiliar para procesar los datos (fuera o dentro del componente)
  const prepararDatosActualizados = (
    data: any,
    campo: DatosGeneralesField,
    valor: string,
  ) => {
    const currentValue = data.datos[campo.clave]
    let newValue: any

    if (
      typeof currentValue === 'object' &&
      currentValue !== null &&
      'description' in currentValue
    ) {
      newValue = { ...currentValue, description: valor }
    } else {
      newValue = valor
    }

    return {
      ...data.datos,
      [campo.clave]: newValue,
    }
  }

  const ejecutarGuardadoSilencioso = (
    campo: DatosGeneralesField,
    valor: string,
  ) => {
    if (!data?.datos) return

    const datosActualizados = prepararDatosActualizados(data, campo, valor)

    updatePlan.mutate({
      planId,
      patch: { datos: datosActualizados },
    })

    // Actualizar UI localmente
    setCampos((prev) =>
      prev.map((c) => (c.id === campo.id ? { ...c, value: valor } : c)),
    )
  }

  const handleSave = (campo: DatosGeneralesField) => {
    if (!data?.datos) return

    const currentValue = (data.datos as any)[campo.clave]

    let newValue: any

    if (
      typeof currentValue === 'object' &&
      currentValue !== null &&
      'description' in currentValue
    ) {
      // Caso 1: objeto con description
      newValue = {
        ...currentValue,
        description: editValue,
      }
    } else {
      // Caso 2: valor plano (string, number, etc)
      newValue = editValue
    }

    const datosActualizados = {
      ...data.datos,
      [campo.clave]: newValue,
    }

    updatePlan.mutate({
      planId,
      patch: {
        datos: datosActualizados,
      },
    })

    // UI optimista
    setCampos((prev) =>
      prev.map((c) => (c.id === campo.id ? { ...c, value: editValue } : c)),
    )

    ejecutarGuardadoSilencioso(campo, editValue)
    setEditingId(null)
    setEditValue('')
  }

  const handleIARequest = (clave: string) => {
    navigate({
      to: '/planes/$planId/iaplan',
      params: {
        planId: planId, // o dinámico
      },
      state: {
        campo_edit: clave,
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
                            onClick={() => handleIARequest(campo)}
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
                      className="placeholder:text-muted-foreground/70 min-h-30 not-italic placeholder:italic"
                      placeholder={`Ej. ${campo.holder[0]}`}
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
                        onClick={() => handleSave(campo)}
                      >
                        <Check size={14} className="mr-1" /> Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-25">
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
