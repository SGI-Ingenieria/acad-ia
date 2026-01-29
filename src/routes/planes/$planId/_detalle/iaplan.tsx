import { createFileRoute, useRouterState } from '@tanstack/react-router'
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

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { usePlan } from '@/data/hooks/usePlans'

const PRESETS = [
  {
    id: 'objetivo',
    label: 'Mejorar objetivo general',
    icon: Target,
    prompt: 'Mejora la redacción del objetivo general...',
  },
  {
    id: 'perfil-egreso',
    label: 'Redactar perfil de egreso',
    icon: GraduationCap,
    prompt: 'Genera un perfil de egreso detallado...',
  },
  {
    id: 'competencias',
    label: 'Sugerir competencias',
    icon: BookOpen,
    prompt: 'Genera una lista de competencias...',
  },
  {
    id: 'pertinencia',
    label: 'Justificar pertinencia',
    icon: FileText,
    prompt: 'Redacta una justificación de pertinencia...',
  },
]

// --- Tipado y Helpers ---
interface SelectedField {
  key: string
  label: string
  value: string
}

const formatLabel = (key: string) => {
  const result = key.replace(/_/g, ' ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export const Route = createFileRoute('/planes/$planId/_detalle/iaplan')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  // Usamos el ID dinámico del plan o el hardcoded según tu necesidad
  const { data } = usePlan('0e0aea4d-b8b4-4e75-8279-6224c3ac769f')
  const routerState = useRouterState()

  // ESTADOS PRINCIPALES
  const [messages, setMessages] = useState<Array<any>>([
    {
      id: '1',
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente de IA. ¿Qué campos deseas mejorar? Puedes escribir ":" para seleccionar uno.',
    },
  ])
  const [input, setInput] = useState('')
  const [selectedFields, setSelectedFields] = useState<Array<SelectedField>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Transformar datos de la API para el menú de selección
  const availableFields = useMemo(() => {
    if (!data?.estructuras_plan?.definicion?.properties) return []
    return Object.entries(data.estructuras_plan.definicion.properties).map(
      ([key, value]) => ({
        key,
        label: value.title,
        value: String(value.description || ''),
      }),
    )
  }, [data])

  // 2. Manejar el estado inicial si viene de "Datos Generales"
  useEffect(() => {
    const state = routerState.location.state as any
    if (!state?.campo_edit || availableFields.length === 0) return

    const field = availableFields.find(
      (f) =>
        f.value === state.campo_edit.label || f.key === state.campo_edit.clave,
    )

    if (field && !selectedFields.some((sf) => sf.key === field.key)) {
      setSelectedFields([field])
    }

    setInput((prev) =>
      injectFieldsIntoInput(prev || 'Mejora este campo:', field ? [field] : []),
    )
  }, [availableFields])

  // 3. Lógica para el disparador ":"
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    if (val.endsWith(':')) {
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const injectFieldsIntoInput = (
    input: string,
    fields: Array<SelectedField>,
  ) => {
    const baseText = input.replace(/\[[^\]]+]/g, '').trim()

    const tags = fields.map((f) => `${f.label}`).join(' ')

    return `${baseText} ${tags}`.trim()
  }
  const toggleField = (field: SelectedField) => {
    setSelectedFields((prev) => {
      let nextFields

      if (prev.find((f) => f.key === field.key)) {
        nextFields = prev.filter((f) => f.key !== field.key)
      } else {
        nextFields = [...prev, field]
      }

      setInput((prevInput) =>
        injectFieldsIntoInput(prevInput || 'Mejora este campo:', nextFields),
      )

      return nextFields
    })

    setShowSuggestions(false)
  }
  const buildPrompt = (userInput: string) => {
    if (selectedFields.length === 0) return userInput

    const fieldsText = selectedFields
      .map((f) => `- ${f.label}: ${f.value || '(sin contenido)'}`)
      .join('\n')

    return `
${userInput || 'Mejora los siguientes campos:'}

Campos a analizar:
${fieldsText}
`.trim()
  }

  const handleSend = async (promptOverride?: string) => {
    const rawText = promptOverride || input
    if (!rawText.trim() && selectedFields.length === 0) return

    const finalPrompt = buildPrompt(rawText)

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: finalPrompt,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const mockText =
        'Sugerencia generada basada en los campos seleccionados...'

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `He analizado ${selectedFields
            .map((f) => f.label)
            .join(', ')}. Aquí tienes una propuesta:\n\n${mockText}`,
        },
      ])

      setPendingSuggestion({ text: mockText })
      setIsLoading(false)
    }, 1200)
  }
  return (
    <div className="flex h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* PANEL DE CHAT PRINCIPAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        {/* NUEVO: Barra superior de campos seleccionados */}
        <div className="shrink-0 border-b bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Mejorar con IA
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
                      className={`rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-teal-600 text-white'
                          : 'rounded-tl-none border bg-white text-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
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

          {/* Botones flotantes de aplicación */}
          {pendingSuggestion && !isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full border bg-white p-1.5 shadow-2xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingSuggestion(null)}
                className="h-8 rounded-full text-xs"
              >
                <X className="mr-1 h-3 w-3" /> Descartar
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-full bg-teal-600 text-xs text-white hover:bg-teal-700"
              >
                <Check className="mr-1 h-3 w-3" /> Aplicar cambios
              </Button>
            </div>
          )}
        </div>

        {/* INPUT FIJO AL FONDO CON SUGERENCIAS : */}
        {/* INPUT FIJO AL FONDO CON SUGERENCIAS : */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {/* MENÚ DE SUGERENCIAS FLOTANTE (Se mantiene igual) */}
            {showSuggestions && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Seleccionar campo para IA
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

            {/* CONTENEDOR DEL INPUT TRANSFORMADO */}
            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {/* 1. Visualización de campos dentro del input (Tags) */}
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

              {/* 2. Área de escritura */}
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
                      ? 'Escribe instrucciones adicionales...'
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

      {/* PANEL LATERAL (PRESETS) - SE MANTIENE COMO LO TENÍAS */}
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
