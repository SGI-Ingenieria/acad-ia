import { useRouterState } from '@tanstack/react-router'
import {
  Sparkles,
  Send,
  Target,
  UserCheck,
  Lightbulb,
  FileText,
  GraduationCap,
  BookOpen,
  Check,
  X,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import type { IAMessage, IASugerencia, CampoEstructura } from '@/types/materia'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// Tipos importados de tu archivo de materia

const PRESETS = [
  {
    id: 'mejorar-objetivo',
    label: 'Mejorar objetivo',
    icon: Target,
    prompt: 'Mejora la redacción del objetivo de esta asignatura...',
  },
  {
    id: 'contenido-tematico',
    label: 'Sugerir contenido',
    icon: BookOpen,
    prompt: 'Genera un desglose de temas para esta materia...',
  },
  {
    id: 'actividades',
    label: 'Actividades de aprendizaje',
    icon: GraduationCap,
    prompt: 'Sugiere actividades prácticas para los temas seleccionados...',
  },
  {
    id: 'bibliografia',
    label: 'Actualizar bibliografía',
    icon: FileText,
    prompt: 'Recomienda bibliografía reciente para esta asignatura...',
  },
]

interface SelectedField {
  key: string
  label: string
  value: string
}

interface IAMateriaTabProps {
  campos: Array<CampoEstructura>
  datosGenerales: Record<string, any>
  messages: Array<IAMessage>
  onSendMessage: (message: string, campoId?: string) => void
  onAcceptSuggestion: (sugerencia: IASugerencia) => void
  onRejectSuggestion: (messageId: string) => void
}

export function IAMateriaTab({
  campos,
  datosGenerales,
  messages,
  onSendMessage,
  onAcceptSuggestion,
  onRejectSuggestion,
}: IAMateriaTabProps) {
  const routerState = useRouterState()

  // ESTADOS PRINCIPALES (Igual que en Planes)
  const [input, setInput] = useState('')
  const [selectedFields, setSelectedFields] = useState<Array<SelectedField>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Transformar datos de la materia para el menú
  const availableFields = useMemo(() => {
    // Extraemos las claves directamente del objeto datosGenerales
    // ["nombre", "descripcion", "perfil_de_egreso", "fines_de_aprendizaje_o_formacion"]
    if (!datosGenerales.datos) return []
    return Object.keys(datosGenerales.datos).map((key) => {
      // Buscamos si existe un nombre amigable en la estructura de campos
      const estructuraCampo = campos.find((c) => c.id === key)

      // Si existe en 'campos', usamos su nombre; si no, formateamos la clave (ej: perfil_de_egreso -> Perfil De Egreso)
      const labelAmigable =
        estructuraCampo?.nombre ||
        key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

      return {
        key: key,
        label: labelAmigable,
        value: String(datosGenerales[key] || ''),
      }
    })
  }, [campos, datosGenerales])

  // 2. Manejar el estado inicial si viene de "Datos de Materia" (Prefill)

  useEffect(() => {
    const state = routerState.location.state as any

    if (state?.prefillCampo && availableFields.length > 0) {
      console.log(state?.prefillCampo)
      console.log(availableFields)

      const field = availableFields.find((f) => f.key === state.prefillCampo)

      if (field && !selectedFields.find((sf) => sf.key === field.key)) {
        setSelectedFields([field])
        // Sincronizamos el texto inicial con el campo pre-seleccionado
        setInput(`Mejora el campo ${field.label}: `)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableFields])

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // 3. Lógica para el disparador ":"
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    setShowSuggestions(val.endsWith(':'))
  }

  const toggleField = (field: SelectedField) => {
    setSelectedFields((prev) => {
      const isSelected = prev.find((f) => f.key === field.key)

      // 1. Si ya está seleccionado, lo quitamos (Toggle OFF)
      if (isSelected) {
        return prev.filter((f) => f.key !== field.key)
      }

      // 2. Si no está, lo agregamos a la lista (Toggle ON)
      const newSelected = [...prev, field]

      // 3. Actualizamos el texto del input para reflejar los títulos (labels)
      setInput((prevText) => {
        // Separamos lo que el usuario escribió antes del disparador ":"
        // y lo que viene después (posibles keys/labels previos)
        const parts = prevText.split(':')
        const beforeColon = parts[0]

        // Creamos un string con los labels de todos los campos seleccionados
        const labelsPath = newSelected.map((f) => f.label).join(', ')

        return `${beforeColon.trim()}: ${labelsPath} `
      })

      return newSelected
    })

    // Opcional: mantener abierto si quieres que el usuario elija varios seguidos
    // setShowSuggestions(false)
  }

  const buildPrompt = (userInput: string) => {
    if (selectedFields.length === 0) return userInput
    const fieldsText = selectedFields
      .map((f) => `- ${f.label}: ${f.value || '(vacio)'}`)
      .join('\n')

    return `${userInput}\n\nCampos a analizar:\n${fieldsText}`.trim()
  }

  const handleSend = async (promptOverride?: string) => {
    const rawText = promptOverride || input
    if (!rawText.trim() && selectedFields.length === 0) return

    const finalPrompt = buildPrompt(rawText)

    setIsLoading(true)
    // Llamamos a la función que viene por props
    onSendMessage(finalPrompt, selectedFields[0]?.key)

    setInput('')
    setSelectedFields([])

    // Simular carga local para el feedback visual
    setTimeout(() => setIsLoading(false), 1200)
  }

  return (
    <div className="flex h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* PANEL DE CHAT PRINCIPAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        {/* Barra superior */}
        <div className="shrink-0 border-b bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              IA de Asignatura
            </span>
          </div>
        </div>

        {/* CONTENIDO DEL CHAT */}
        <div className="relative min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full w-full">
            <div className="mx-auto max-w-3xl space-y-6 p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}
                >
                  <Avatar
                    className={`h-8 w-8 shrink-0 border ${msg.role === 'assistant' ? 'bg-teal-50' : 'bg-slate-200'}`}
                  >
                    <AvatarFallback className="text-[10px]">
                      {msg.role === 'assistant' ? (
                        <Sparkles size={14} className="text-teal-600" />
                      ) : (
                        <UserCheck size={14} />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={cn(
                        'rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-teal-600 text-white'
                          : 'rounded-tl-none border bg-white text-slate-700',
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Renderizado de Sugerencias (Homologado con lógica de Materia) */}
                    {msg.sugerencia && !msg.sugerencia.aceptada && (
                      <div className="animate-in fade-in slide-in-from-top-1 mt-3 w-full">
                        <div className="rounded-xl border border-teal-100 bg-white p-4 shadow-md">
                          <p className="mb-2 text-[10px] font-bold text-slate-400 uppercase">
                            Propuesta para: {msg.sugerencia.campoNombre}
                          </p>
                          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600 italic">
                            {msg.sugerencia.valorSugerido}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                onAcceptSuggestion(msg.sugerencia!)
                              }
                              className="h-8 bg-teal-600 text-xs hover:bg-teal-700"
                            >
                              <Check size={14} className="mr-1" /> Aplicar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRejectSuggestion(msg.id)}
                              className="h-8 text-xs"
                            >
                              <X size={14} className="mr-1" /> Descartar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {msg.sugerencia?.aceptada && (
                      <Badge className="mt-2 border-teal-200 bg-teal-100 text-teal-700 hover:bg-teal-100">
                        <Check className="mr-1 h-3 w-3" /> Sugerencia aplicada
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 p-4">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.2s]" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* INPUT FIJO AL FONDO */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {/* MENÚ DE SUGERENCIAS FLOTANTE */}
            {showSuggestions && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Seleccionar campo de materia
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {availableFields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => toggleField(field)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-teal-50"
                    >
                      <span className="text-slate-700 group-hover:text-teal-700">
                        {field.label}
                      </span>
                      {selectedFields.find((f) => f.key === field.key) && (
                        <Check size={14} className="text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CONTENEDOR DEL INPUT */}
            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {/* Visualización de Tags */}
              {selectedFields.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pt-1">
                  {selectedFields.map((field) => (
                    <div
                      key={field.key}
                      className="animate-in zoom-in-95 flex items-center gap-1 rounded-md border border-teal-200 bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800"
                    >
                      <span className="opacity-70">Campo:</span> {field.label}
                      <button
                        onClick={() => toggleField(field)}
                        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-teal-200"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={
                    selectedFields.length > 0
                      ? 'Instrucciones para los campos seleccionados...'
                      : 'Escribe tu solicitud o ":" para campos...'
                  }
                  className="max-h-[120px] min-h-[40px] flex-1 resize-none border-none bg-transparent py-2 text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={
                    (!input.trim() && selectedFields.length === 0) || isLoading
                  }
                  size="icon"
                  className="mb-1 h-9 w-9 shrink-0 bg-teal-600 hover:bg-teal-700"
                >
                  <Send size={16} className="text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL (ACCIONES RÁPIDAS) */}
      <div className="flex flex-[1] flex-col gap-4 overflow-y-auto pr-2">
        <h4 className="flex items-center gap-2 text-left text-sm font-bold text-slate-800">
          <Lightbulb size={18} className="text-orange-500" /> Acciones rápidas
        </h4>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              className="group flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm shadow-sm transition-all hover:border-teal-500 hover:bg-teal-50"
            >
              <div className="rounded-lg bg-slate-100 p-2 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-600">
                <preset.icon size={16} />
              </div>
              <span className="leading-tight font-medium text-slate-700">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
