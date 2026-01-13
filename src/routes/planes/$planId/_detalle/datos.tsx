import { usePlan } from '@/data'
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { DatosGeneralesField } from '@/types/plan'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Check, X, Sparkles, AlertCircle } from 'lucide-react'
//import { toast } from 'sonner' // Asegúrate de tener sonner instalado o quita la línea

export const Route = createFileRoute('/planes/$planId/_detalle/datos')({
  component: DatosGeneralesPage,
})

const formatLabel = (key: string) => {
  const result = key.replace(/_/g, ' ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

function DatosGeneralesPage() {
  const { data } = usePlan('0e0aea4d-b8b4-4e75-8279-6224c3ac769f')

  // Inicializamos campos como un arreglo vacío
  const [campos, setCampos] = useState<DatosGeneralesField[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Efecto para transformar data?.datos en el arreglo de campos
  useEffect(() => {
    // 2. Validación de seguridad para sourceData
    const sourceData = data?.datos

    if (sourceData && typeof sourceData === 'object') {
      const datosTransformados: DatosGeneralesField[] = Object.entries(
        sourceData,
      ).map(([key, value], index) => ({
        id: (index + 1).toString(),
        label: formatLabel(key),
        // Forzamos el valor a string de forma segura
        value: typeof value === 'string' ? value : value?.toString() || '',
        requerido: true,
        tipo: 'texto',
      }))

      setCampos(datosTransformados)
    }
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
    //toast.success('Cambios guardados localmente')
  }

  const handleIARequest = (id: string) => {
    //toast.info('La IA está analizando el campo ' + id)
    // Aquí conectarías con tu endpoint de IA
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
              <div className="flex items-center justify-between border-b bg-slate-50/50 px-5 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-slate-700">
                    {campo.label}
                  </h3>
                  {campo.requerido && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-teal-600"
                      onClick={() => handleIARequest(campo.id)}
                    >
                      <Sparkles size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(campo)}
                    >
                      <Pencil size={14} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Contenido de la Card */}
              <div className="p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[120px]"
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
