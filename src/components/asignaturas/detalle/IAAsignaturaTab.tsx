import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
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
  MessageSquarePlus,
  Archive,
  History, // Agregado
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import type { IASugerencia } from '@/types/asignatura'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  useAISubjectChat,
  useConversationBySubject,
  useMessagesBySubjectChat,
  useSubject,
  useUpdateSubjectConversationStatus,
} from '@/data'
import { cn } from '@/lib/utils'

interface SelectedField {
  key: string
  label: string
  value: string
}

interface IAAsignaturaTabProps {
  asignatura?: Record<string, any>
  onAcceptSuggestion: (sugerencia: IASugerencia) => void
  onRejectSuggestion: (messageId: string) => void
}

export function IAAsignaturaTab({
  onAcceptSuggestion,
  onRejectSuggestion,
}: IAAsignaturaTabProps) {
  const queryClient = useQueryClient()
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  // --- ESTADOS ---
  const [activeChatId, setActiveChatId] = useState<string | undefined>(
    undefined,
  )
  const [showArchived, setShowArchived] = useState(false)
  const [input, setInput] = useState('')
  const [selectedFields, setSelectedFields] = useState<Array<SelectedField>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // --- DATA QUERIES ---
  const { data: datosGenerales } = useSubject(asignaturaId)
  const { data: todasConversaciones, isLoading: loadingConv } =
    useConversationBySubject(asignaturaId)
  const { data: rawMessages } = useMessagesBySubjectChat(activeChatId, {
    enabled: !!activeChatId,
  })
  const { mutateAsync: sendMessage } = useAISubjectChat()
  const { mutate: updateStatus } = useUpdateSubjectConversationStatus()
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)
  const hasInitialSelected = useRef(false)

  const isAiThinking = useMemo(() => {
    if (isSending) return true
    if (!rawMessages || rawMessages.length === 0) return false

    // Verificamos si el último mensaje está en estado de procesamiento
    const lastMessage = rawMessages[rawMessages.length - 1]
    return (
      lastMessage.estado === 'PROCESANDO' || lastMessage.estado === 'PENDIENTE'
    )
  }, [isSending, rawMessages])

  // --- AUTO-SCROLL ---
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight
    }
  }, [rawMessages, isSending])

  // --- FILTRADO DE CHATS ---
  const { activeChats, archivedChats } = useMemo(() => {
    const chats = todasConversaciones || []
    return {
      activeChats: chats.filter((c: any) => c.estado === 'ACTIVA'),
      archivedChats: chats.filter((c: any) => c.estado === 'ARCHIVADA'),
    }
  }, [todasConversaciones])

  // --- PROCESAMIENTO DE MENSAJES ---
  const messages = useMemo(() => {
    if (!rawMessages) return []
    return rawMessages.flatMap((m) => {
      const msgs = []

      // 1. Mensaje del usuario
      msgs.push({ id: `${m.id}-user`, role: 'user', content: m.mensaje })

      // 2. Respuesta de la IA
      if (m.respuesta) {
        // Mapeamos TODAS las recomendaciones del array
        const sugerencias =
          m.propuesta?.recommendations?.map((rec: any, index: number) => ({
            id: `${m.id}-sug-${index}`, // ID único por sugerencia
            messageId: m.id,
            campoKey: rec.campo_afectado,
            campoNombre: rec.campo_afectado.replace(/_/g, ' '),
            valorSugerido: rec.texto_mejora,
            aceptada: rec.aplicada,
          })) || []

        msgs.push({
          id: `${m.id}-ai`,
          role: 'assistant',
          content: m.respuesta,
          sugerencias: sugerencias, // Ahora es un plural (array)
        })
      }
      return msgs
    })
  }, [rawMessages])

  // Auto-selección inicial
  useEffect(() => {
    // Si ya hay un chat, o si el usuario ya interactuó (hasInitialSelected), abortamos.
    if (activeChatId || hasInitialSelected.current) return

    if (activeChats.length > 0 && !loadingConv) {
      setActiveChatId(activeChats[0].id)
      hasInitialSelected.current = true
    }
  }, [activeChats, loadingConv])

  const handleSend = async (promptOverride?: string) => {
    const text = promptOverride || input
    if (!text.trim() && selectedFields.length === 0) return

    setIsSending(true)
    try {
      const response = await sendMessage({
        subjectId: asignaturaId as any, // Importante: se usa para crear la conv si activeChatId es undefined
        content: text,
        campos: selectedFields.map((f) => f.key),
        conversacionId: activeChatId, // Si es undefined, la mutación crea el chat automáticamente
      })

      // IMPORTANTE: Después de la respuesta, actualizamos el ID activo con el que creó el backend
      if (response.conversacionId) {
        setActiveChatId(response.conversacionId)
      }

      setInput('')
      setSelectedFields([])

      // Invalidamos la lista de conversaciones para que el nuevo chat aparezca en el historial (panel izquierdo)
      queryClient.invalidateQueries({
        queryKey: ['conversation-by-subject', asignaturaId],
      })
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
    } finally {
      setIsSending(false)
    }
  }

  const toggleField = (field: SelectedField) => {
    setSelectedFields((prev) =>
      prev.find((f) => f.key === field.key)
        ? prev.filter((f) => f.key !== field.key)
        : [...prev, field],
    )
  }

  const availableFields = useMemo(() => {
    if (!datosGenerales?.datos) return []
    const estructuraProps =
      datosGenerales?.estructuras_asignatura?.definicion?.properties || {}
    return Object.keys(datosGenerales.datos).map((key) => ({
      key,
      label:
        estructuraProps[key]?.title || key.replace(/_/g, ' ').toUpperCase(),
      value: String(datosGenerales.datos[key] || ''),
    }))
  }, [datosGenerales])

  const createNewChat = () => {
    setActiveChatId(undefined) // Al ser undefined, el próximo mensaje creará la charla en el backend
    setInput('')
    setSelectedFields([])
    // Opcional: podrías forzar el foco al textarea aquí con una ref
  }

  const PRESETS = [
    {
      id: 'mejorar-obj',
      label: 'Mejorar objetivo',
      icon: Target,
      prompt: 'Mejora la redacción del objetivo...',
    },
    {
      id: 'sugerir-cont',
      label: 'Sugerir contenido',
      icon: BookOpen,
      prompt: 'Genera un desglose de temas...',
    },
    {
      id: 'actividades',
      label: 'Actividades',
      icon: GraduationCap,
      prompt: 'Sugiere actividades prácticas...',
    },
  ]

  return (
    <div className="flex h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* PANEL IZQUIERDO */}
      <div className="flex w-64 flex-col border-r pr-4">
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <History size={14} /> Historial
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              showArchived && 'bg-teal-50 text-teal-600',
            )}
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive size={16} />
          </Button>
        </div>

        <Button
          onClick={() => {
            // 1. Limpiamos el ID
            setActiveChatId(undefined)
            // 2. Marcamos que ya hubo una "interacción inicial" para que el useEffect no actúe
            hasInitialSelected.current = true
            // 3. Limpiamos estados visuales
            setIsCreatingNewChat(true)
            setInput('')
            setSelectedFields([])

            // 4. Opcional: Limpiar el caché de mensajes actual para que la pantalla se vea vacía al instante
            queryClient.setQueryData(['subject-messages', undefined], [])
          }}
          variant="outline"
          className="mb-4 w-full justify-start gap-2 border-dashed border-slate-300 hover:border-teal-500"
        >
          <MessageSquarePlus size={18} /> Nuevo Chat
        </Button>

        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-3">
            {(showArchived ? archivedChats : activeChats).map((chat: any) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id)
                  setIsCreatingNewChat(false) // <--- Volvemos al modo normal
                }}
                className={cn(
                  'group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                  activeChatId === chat.id
                    ? 'bg-teal-50 font-medium text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <FileText size={14} className="shrink-0 opacity-50" />
                <span className="flex-1 truncate">
                  {chat.titulo || 'Conversación'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    updateStatus(
                      {
                        id: chat.id,
                        estado: showArchived ? 'ACTIVA' : 'ARCHIVADA',
                      },
                      {
                        onSuccess: () =>
                          queryClient.invalidateQueries({
                            queryKey: ['conversation-by-subject'],
                          }),
                      },
                    )
                  }}
                  className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200"
                >
                  <Archive size={12} />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* PANEL CENTRAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="shrink-0 border-b bg-white p-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Asistente IA
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full w-full">
            <div className="mx-auto max-w-3xl space-y-8 p-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-4',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                  )}
                >
                  <Avatar
                    className={cn(
                      'h-9 w-9 shrink-0 border shadow-sm',
                      msg.role === 'assistant'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100',
                    )}
                  >
                    <AvatarFallback>
                      {msg.role === 'assistant' ? (
                        <Sparkles size={16} />
                      ) : (
                        <UserCheck size={16} />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'flex max-w-[85%] flex-col gap-3',
                      msg.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    <div
                      className={cn(
                        'relative overflow-hidden rounded-2xl border shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-tr-none border-teal-700 bg-teal-600 px-4 py-3 text-white'
                          : 'w-full rounded-tl-none border-slate-200 bg-white text-slate-800',
                      )}
                    >
                      {/* Texto del mensaje principal */}
                      <div
                        className={cn(
                          'text-sm leading-relaxed',
                          msg.role === 'assistant' && 'p-4',
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* CONTENEDOR DE SUGERENCIAS INTEGRADO */}
                      {msg.role === 'assistant' &&
                        msg.sugerencias &&
                        msg.sugerencias.length > 0 && (
                          <div className="space-y-3 border-t bg-slate-50/50 p-3">
                            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">
                              Mejoras disponibles:
                            </p>
                            {msg.sugerencias.map((sug: any) =>
                              sug.aceptada ? (
                                /* --- ESTADO: YA APLICADO (Basado en tu última imagen) --- */
                                <div
                                  key={sug.id}
                                  className="group flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all"
                                >
                                  <div className="mb-3 flex items-center justify-between gap-4">
                                    <span className="text-sm font-bold text-slate-800">
                                      {sug.campoNombre}
                                    </span>

                                    {/* Badge de Aplicado */}
                                    <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
                                      <Check size={14} />
                                      Aplicado
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-teal-100 bg-teal-50/30 p-3 text-xs leading-relaxed text-slate-500">
                                    "{sug.valorSugerido}"
                                  </div>
                                </div>
                              ) : (
                                /* --- ESTADO: PENDIENTE POR APLICAR --- */
                                <div
                                  key={sug.id}
                                  className="group flex flex-col rounded-xl border border-teal-100 bg-white p-3 shadow-sm transition-all hover:border-teal-200"
                                >
                                  <div className="mb-3 flex items-center justify-between gap-4">
                                    <span className="max-w-[150px] truncate rounded-lg border border-teal-100 bg-teal-50/50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-teal-700 uppercase">
                                      {sug.campoNombre}
                                    </span>

                                    <Button
                                      size="sm"
                                      className="h-8 w-auto bg-teal-600 px-4 text-xs font-semibold shadow-sm transition-colors hover:bg-teal-700"
                                      onClick={() => onAcceptSuggestion(sug)}
                                    >
                                      <Check size={14} className="mr-1.5" />
                                      Aplicar mejora
                                    </Button>
                                  </div>

                                  <div className="line-clamp-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-600 italic">
                                    "{sug.valorSugerido}"
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Espacio extra al final para que el scroll no tape el último mensaje */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {showSuggestions && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">
                  Campos de Asignatura
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {availableFields.map((field) => (
                    <button
                      key={field.key}
                      onClick={() => toggleField(field)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-teal-50"
                    >
                      <span className="text-slate-700">{field.label}</span>
                      {selectedFields.find((f) => f.key === field.key) && (
                        <Check size={14} className="text-teal-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {selectedFields.length > 0 && (
                <div className="flex flex-wrap gap-2 px-2 pt-1">
                  {selectedFields.map((field) => (
                    <div
                      key={field.key}
                      className="animate-in zoom-in-95 flex items-center gap-1 rounded-md border border-teal-200 bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-800"
                    >
                      {field.label}
                      <button
                        onClick={() => toggleField(field)}
                        className="ml-1 rounded-full p-0.5 hover:bg-teal-200"
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
                  onChange={(e) => {
                    setInput(e.target.value)
                    if (e.target.value.endsWith(':')) setShowSuggestions(true)
                    else if (showSuggestions && !e.target.value.includes(':'))
                      setShowSuggestions(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder='Escribe ":" para referenciar un campo...'
                  className="max-h-[120px] min-h-[40px] flex-1 resize-none border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={
                    (!input.trim() && selectedFields.length === 0) || isSending
                  }
                  size="icon"
                  className="h-9 w-9 bg-teal-600 hover:bg-teal-700"
                >
                  <Send size={16} className="text-white" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO ACCIONES */}
      <div className="flex flex-[1] flex-col gap-4 overflow-y-auto pr-2">
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb size={18} className="text-orange-500" /> Atajos
        </h4>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              className="group flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left text-sm transition-all hover:border-teal-500 hover:bg-teal-50"
            >
              <div className="rounded-lg bg-slate-100 p-2 group-hover:bg-teal-100 group-hover:text-teal-600">
                <preset.icon size={16} />
              </div>
              <span className="font-medium text-slate-700">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
