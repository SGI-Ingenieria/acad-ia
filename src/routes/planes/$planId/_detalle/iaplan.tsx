import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Paperclip,
  Target,
  UserCheck,
  Lightbulb,
  FileText,
  Users,
  GraduationCap,
  BookOpen,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

export const Route = createFileRoute('/planes/$planId/_detalle/iaplan')({
  component: RouteComponent,
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function RouteComponent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<{
    field: string
    text: string
  } | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Función de scroll corregida para Radix
  const scrollToBottom = () => {
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, isLoading])

  const handleSend = async (prompt?: string) => {
    const messageText = prompt || input
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    setTimeout(() => {
      const mockText =
        'He analizado tu solicitud. Basado en los estándares actuales, sugiero fortalecer las competencias técnicas...'
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `He analizado tu solicitud. Aquí está mi sugerencia:\n\n"${mockText}"\n\n¿Te gustaría aplicar este texto al plan?`,
      }
      setMessages((prev) => [...prev, aiResponse])
      setPendingSuggestion({ field: 'seccion-plan', text: mockText })
      setIsLoading(false)
    }, 1200)
  }

  return (
    /* CAMBIO CLAVE 1: 
      Aseguramos que el contenedor padre ocupe el espacio disponible pero NO MÁS.
      'max-h-full' y 'flex-1' evitan que el chat empuje el layout hacia abajo.
    */
    <div className="flex h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* PANEL DE CHAT */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        {/* Header Fijo (shrink-0 es vital para que no se aplaste) */}
        <div className="flex shrink-0 items-center justify-between border-b bg-white p-4">
          <div className="flex flex-col">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <Sparkles className="h-4 w-4 text-teal-600" />
              Asistente de Diseño Curricular
            </h3>
            <p className="text-left text-[11px] text-slate-500">
              Optimizado con IA
            </p>
          </div>
        </div>

        {/* CAMBIO CLAVE 2: 
          El ScrollArea debe tener 'flex-1' y 'h-full'. 
          Esto obliga al componente a colapsar su altura y activar el scroll.
        */}
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
                    {msg.role === 'assistant' && (
                      <span className="mb-1 ml-1 text-[9px] font-bold text-teal-700 uppercase">
                        Asistente IA
                      </span>
                    )}
                    <div
                      className={`rounded-2xl p-3 text-left text-sm whitespace-pre-wrap shadow-sm ${
                        msg.role === 'user'
                          ? 'rounded-tr-none bg-teal-600 text-white'
                          : 'rounded-tl-none border border-slate-200 bg-white text-slate-700'
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

          {/* Barra de aplicación flotante (dentro del contenedor relativo del scroll) */}
          {pendingSuggestion && !isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border bg-white p-1.5 shadow-2xl">
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
                onClick={() => {}}
                className="h-8 rounded-full bg-teal-600 text-xs text-white hover:bg-teal-700"
              >
                <Check className="mr-1 h-3 w-3" /> Aplicar cambios
              </Button>
            </div>
          )}
        </div>

        {/* INPUT FIJO AL FONDO */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            <div className="flex items-end gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Escribe tu solicitud aquí..."
                className="max-h-[120px] min-h-[40px] flex-1 resize-none border-none bg-transparent py-2 text-left text-sm focus-visible:ring-0"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 shrink-0 bg-teal-600 hover:bg-teal-700"
              >
                <Send size={16} className="text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL */}
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

function generateMockResponse(prompt: string) {
  return 'Mock response content...'
}
