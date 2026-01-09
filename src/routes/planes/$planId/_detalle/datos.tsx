import { usePlan } from '@/data';
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { DatosGeneralesField } from '@/types/plan'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Pencil, 
  Check, 
  X, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react'
//import { toast } from 'sonner' // Asegúrate de tener sonner instalado o quita la línea

export const Route = createFileRoute('/planes/$planId/_detalle/datos')({
  component: DatosGeneralesPage,
})

function DatosGeneralesPage() {
  // 1. Definimos los DATOS iniciales (Lo que antes venía por props)
  const [campos, setCampos] = useState<DatosGeneralesField[]>([
    { id: '1', label: 'Objetivo General', value: 'Formar profesionales...', requerido: true, tipo: 'texto' },
    { id: '2', label: 'Perfil de Ingreso', value: 'Interés por la tecnología...', requerido: true, tipo: 'lista' },
    { id: '3', label: 'Perfil de Egreso', value: '', requerido: true, tipo: 'texto' },
  ])

  // 2. Estados de edición
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

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
    setCampos(prev => prev.map(c => 
      c.id === id ? { ...c, value: editValue } : c
    ))
    setEditingId(null)
    setEditValue('')
    //toast.success('Cambios guardados localmente')
  }

  const handleIARequest = (id: string) => {
    //toast.info('La IA está analizando el campo ' + id)
    // Aquí conectarías con tu endpoint de IA
  }

  return (
    <div className="container mx-auto px-6 py-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          Datos Generales del Plan
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Información estructural y descriptiva del plan de estudios
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campos.map((campo) => {
          const isEditing = editingId === campo.id

          return (
            <div
              key={campo.id}
              className={`border rounded-xl transition-all ${
                isEditing ? 'border-teal-500 ring-2 ring-teal-50 shadow-lg' : 'bg-white hover:shadow-md'
              }`}
            >
              {/* Header de la Card */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm text-slate-700">{campo.label}</h3>
                  {campo.requerido && <span className="text-red-500 text-xs">*</span>}
                </div>

                {!isEditing && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600" onClick={() => handleIARequest(campo.id)}>
                      <Sparkles size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(campo)}>
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
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X size={14} className="mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleSave(campo.id)}>
                        <Check size={14} className="mr-1" /> Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[100px]">
                    {campo.value ? (
                      <div className="text-sm text-slate-600 leading-relaxed">
                        {campo.tipo === 'lista' ? (
                          <ul className="space-y-1">
                            {campo.value.split('\n').map((item, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="whitespace-pre-wrap">{campo.value}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
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