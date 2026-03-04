/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouterState } from '@tanstack/react-router'
import {
  Send,
  Target,
  Lightbulb,
  FileText,
  GraduationCap,
  BookOpen,
  Check,
  X,
  MessageSquarePlus,
  Archive,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import type { UploadedFile } from '@/components/planes/wizard/PasoDetallesPanel/FileDropZone'

import { ImprovementCard } from '@/components/planes/detalle/Ia/ImprovementCard'
import ReferenciasParaIA from '@/components/planes/wizard/PasoDetallesPanel/ReferenciasParaIA'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  useAIPlanChat,
  useConversationByPlan,
  useMessagesByChat,
  useUpdateConversationStatus,
  useUpdateConversationTitle,
} from '@/data'
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
interface EstructuraDefinicion {
  properties?: {
    [key: string]: {
      title: string
      description?: string
    }
  }
}
interface ChatMessageJSON {
  user: 'user' | 'assistant'
  message?: string
  prompt?: string
  refusal?: boolean
  recommendations?: Array<{
    campo_afectado: string
    texto_mejora: string
    aplicada: boolean
  }>
}
export const Route = createFileRoute('/planes/$planId/_detalle/iaplan')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  const { data } = usePlan(planId)
  const routerState = useRouterState()
  const [openIA, setOpenIA] = useState(false)
  const { mutateAsync: sendChat, isPending: isLoading } = useAIPlanChat()
  const { mutate: updateStatusMutation } = useUpdateConversationStatus()

  const [activeChatId, setActiveChatId] = useState<string | undefined>(
    undefined,
  )
  const { data: lastConversation, isLoading: isLoadingConv } =
    useConversationByPlan(planId)
  const { data: mensajesDelChat, isLoading: isLoadingMessages } =
    useMessagesByChat(activeChatId)
  const [selectedArchivoIds, setSelectedArchivoIds] = useState<Array<string>>(
    [],
  )
  const [selectedRepositorioIds, setSelectedRepositorioIds] = useState<
    Array<string>
  >([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<UploadedFile>>([])

  const [messages, setMessages] = useState<Array<any>>([])
  const [input, setInput] = useState('')
  const [selectedFields, setSelectedFields] = useState<Array<SelectedField>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null)
  const queryClient = useQueryClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const editableRef = useRef<HTMLSpanElement>(null)
  const { mutate: updateTitleMutation } = useUpdateConversationTitle()
  const [isSending, setIsSending] = useState(false)
  const [optimisticMessage, setOptimisticMessage] = useState<string | null>(
    null,
  )
  const [filterQuery, setFilterQuery] = useState('')
  const availableFields = useMemo(() => {
    const definicion = data?.estructuras_plan
      ?.definicion as EstructuraDefinicion

    // Encadenamiento opcional para evitar errores si data es null
    if (!definicion.properties) return []

    return Object.entries(definicion.properties).map(([key, value]) => ({
      key,
      label: value.title,
      value: String(value.description || ''),
    }))
  }, [data])

  const filteredFields = useMemo(() => {
    return availableFields.filter(
      (field) =>
        field.label.toLowerCase().includes(filterQuery.toLowerCase()) &&
        !selectedFields.some((s) => s.key === field.key), // No mostrar ya seleccionados
    )
  }, [availableFields, filterQuery, selectedFields])

  const activeChatData = useMemo(() => {
    return lastConversation?.find((chat: any) => chat.id === activeChatId)
  }, [lastConversation, activeChatId])

  const chatMessages = useMemo(() => {
    if (!activeChatId || !mensajesDelChat) return []

    // flatMap nos permite devolver 2 elementos (pregunta y respuesta) por cada registro de la BD
    return mensajesDelChat.flatMap((msg: any) => {
      const messages = []

      // 1. Mensaje del Usuario
      messages.push({
        id: `${msg.id}-user`,
        role: 'user',
        content: msg.mensaje,
        selectedFields: msg.campos || [], // Aquí están tus campos
      })

      // 2. Mensaje del Asistente (si hay respuesta)
      if (msg.respuesta) {
        // Extraemos las recomendaciones de la nueva estructura: msg.propuesta.recommendations
        const rawRecommendations = msg.propuesta?.recommendations || []

        messages.push({
          id: `${msg.id}-ai`,
          dbMessageId: msg.id,
          role: 'assistant',
          content: msg.respuesta,
          isRefusal: msg.is_refusal,
          suggestions: rawRecommendations.map((rec: any) => {
            const fieldConfig = availableFields.find(
              (f) => f.key === rec.campo_afectado,
            )
            return {
              key: rec.campo_afectado,
              label: fieldConfig
                ? fieldConfig.label
                : rec.campo_afectado.replace(/_/g, ' '),
              newValue: rec.texto_mejora,
              applied: rec.aplicada,
            }
          }),
        })
      }

      return messages
    })
  }, [mensajesDelChat, activeChatId, availableFields])
  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Buscamos el viewport interno del ScrollArea de Radix
      const scrollContainer = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      )
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        })
      }
    }
  }
  const { activeChats, archivedChats } = useMemo(() => {
    const allChats = lastConversation || []
    return {
      activeChats: allChats.filter((chat: any) => chat.estado === 'ACTIVA'),
      archivedChats: allChats.filter(
        (chat: any) => chat.estado === 'ARCHIVADA',
      ),
    }
  }, [lastConversation])

  useEffect(() => {
    console.log(mensajesDelChat)

    scrollToBottom()
  }, [chatMessages, isLoading])

  useEffect(() => {
    // Verificamos cuáles campos de la lista "selectedFields" ya no están presentes en el texto del input
    const camposActualizados = selectedFields.filter((field) =>
      input.includes(field.label),
    )

    // Solo actualizamos el estado si hubo un cambio real (para evitar bucles infinitos)
    if (camposActualizados.length !== selectedFields.length) {
      setSelectedFields(camposActualizados)
    }
  }, [input, selectedFields])

  useEffect(() => {
    if (isLoadingConv || isSending) return

    const currentChatExists = activeChats.some(
      (chat) => chat.id === activeChatId,
    )
    const isCreationMode = messages.length === 1 && messages[0].id === 'welcome'

    // 1. Si el chat que teníamos seleccionado ya no existe (ej. se archivó)
    if (activeChatId && !currentChatExists && !isCreationMode) {
      setActiveChatId(undefined)
      setMessages([])
      return
    }

    // 2. Auto-selección inicial: Solo si no hay ID, no estamos creando y hay chats
    if (
      !activeChatId &&
      activeChats.length > 0 &&
      !isCreationMode &&
      chatMessages.length === 0
    ) {
      setActiveChatId(activeChats[0].id)
    }
  }, [
    activeChats,
    activeChatId,
    isLoadingConv,
    isSending,
    messages.length,
    chatMessages.length,
  ])

  useEffect(() => {
    const state = routerState.location.state as any
    if (!state?.campo_edit || availableFields.length === 0) return
    const field = availableFields.find(
      (f) =>
        f.value === state.campo_edit.label || f.key === state.campo_edit.clave,
    )
    if (!field) return
    setSelectedFields([field])
    setInput((prev) =>
      injectFieldsIntoInput(prev || 'Mejora este campo:', [field]),
    )
  }, [availableFields])

  const createNewChat = () => {
    setActiveChatId(undefined) // Al ser undefined, el próximo handleSend creará uno nuevo
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Iniciando una nueva conversación. ¿En qué puedo ayudarte?',
      },
    ])
    setInput('')
    setSelectedFields([])
  }

  const archiveChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    updateStatusMutation(
      { id, estado: 'ARCHIVADA' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['conversation-by-plan', planId],
          })

          if (activeChatId === id) {
            setActiveChatId(undefined)
            setMessages([])
            setOptimisticMessage(null)
            setInput('')
            setSelectedFields([])
          }
        },
      },
    )
  }
  const unarchiveChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    updateStatusMutation(
      { id, estado: 'ACTIVA' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['conversation-by-plan', planId],
          })
        },
      },
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    const cursorPosition = e.target.selectionStart // Dónde está escribiendo el usuario
    setInput(val)

    // Busca un ":" seguido de letras justo antes del cursor
    const textBeforeCursor = val.slice(0, cursorPosition)
    const match = textBeforeCursor.match(/:(\w*)$/)

    if (match) {
      setShowSuggestions(true)
      setFilterQuery(match[1]) // Esto es lo que se usa para el filtrado
    } else {
      setShowSuggestions(false)
      setFilterQuery('')
    }
  }

  const injectFieldsIntoInput = (
    input: string,
    fields: Array<SelectedField>,
  ) => {
    // 1. Limpiamos cualquier rastro anterior de la etiqueta (por si acaso)
    // Esta regex ahora también limpia si el texto termina de forma natural
    const cleaned = input.replace(/[:\s]+[^:]*$/, '').trim()

    if (fields.length === 0) return cleaned

    const fieldLabels = fields.map((f) => f.label).join(', ')

    // 2. Devolvemos un formato natural: "Mejora este campo: Nombre del Campo"
    return `${cleaned}: ${fieldLabels}`
  }

  const toggleField = (field: SelectedField) => {
    // 1. Lo agregamos a la lista de "SelectedFields" (para que la IA sepa qué procesar)
    setSelectedFields((prev) => {
      const isSelected = prev.find((f) => f.key === field.key)
      return isSelected ? prev : [...prev, field]
    })

    // 2. Insertamos el nombre del campo en el texto exactamente donde estaba el ":"
    setInput((prev) => {
      // Reemplaza el último ":" y cualquier texto de filtro por el label del campo
      const nuevoTexto = prev.replace(/:(\w*)$/, field.label)
      return nuevoTexto + ' ' // Añadimos un espacio para que el usuario siga escribiendo
    })

    // 3. Limpiamos estados de búsqueda
    setShowSuggestions(false)
    setFilterQuery('')
  }

  const buildPrompt = (userInput: string, fields: Array<SelectedField>) => {
    if (fields.length === 0) return userInput

    return ` ${userInput}`
  }

  const handleSend = async (promptOverride?: string) => {
    const rawText = promptOverride || input
    if (isSending || (!rawText.trim() && selectedFields.length === 0)) return

    const currentFields = [...selectedFields]
    setIsSending(true)
    setOptimisticMessage(rawText)

    // Limpiar input inmediatamente para feedback visual
    setInput('')
    setSelectedFields([])

    try {
      const payload = {
        planId,
        content: buildPrompt(rawText, currentFields),
        conversacionId: activeChatId,
        campos:
          currentFields.length > 0
            ? currentFields.map((f) => f.key)
            : undefined,
      }

      const response = await sendChat(payload)

      // IMPORTANTE: Si es un chat nuevo, actualizar el ID antes de invalidar
      if (response.conversacionId && response.conversacionId !== activeChatId) {
        setActiveChatId(response.conversacionId)
      }

      // Invalidar ambas para asegurar que la lista de la izquierda y los mensajes se
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['conversation-by-plan', planId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['conversation-messages', response.conversacionId],
        }),
      ])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsSending(false)
      setOptimisticMessage(null)
    }
  }

  const totalReferencias = useMemo(() => {
    return (
      selectedArchivoIds.length +
      selectedRepositorioIds.length +
      uploadedFiles.length
    )
  }, [selectedArchivoIds, selectedRepositorioIds, uploadedFiles])

  const removeSelectedField = (fieldKey: string) => {
    setSelectedFields((prev) => prev.filter((f) => f.key !== fieldKey))
  }

  return (
    <div className="flex h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] w-full gap-6 overflow-hidden p-4">
      {/* --- PANEL IZQUIERDO: HISTORIAL --- */}
      <div className="flex w-64 flex-col border-r pr-4">
        <div className="mb-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Chats
            </h2>
            {/* Botón de toggle archivados movido aquí arriba */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`rounded-md p-1.5 transition-colors ${
                showArchived
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={showArchived ? 'Ver chats activos' : 'Ver archivados'}
            >
              <Archive size={16} />
            </button>
          </div>

          <Button
            onClick={createNewChat}
            variant="outline"
            className="mb-4 w-full justify-start gap-2 border-slate-200 hover:bg-teal-50 hover:text-teal-700"
          >
            <MessageSquarePlus size={18} /> Nuevo chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {!showArchived ? (
              activeChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                    activeChatId === chat.id
                      ? 'bg-slate-100 font-medium text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText size={16} className="shrink-0 opacity-40" />

                  <span
                    ref={editingChatId === chat.id ? editableRef : null}
                    contentEditable={editingChatId === chat.id}
                    suppressContentEditableWarning={true}
                    className={`truncate pr-14 transition-all outline-none ${
                      editingChatId === chat.id
                        ? 'min-w-[50px] cursor-text rounded bg-white px-1 ring-1 ring-teal-500'
                        : 'cursor-pointer'
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingChatId(chat.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const newTitle = e.currentTarget.textContent || ''
                        updateTitleMutation(
                          { id: chat.id, nombre: newTitle },
                          {
                            onSuccess: () => setEditingChatId(null),
                          },
                        )
                      }
                      if (e.key === 'Escape') {
                        setEditingChatId(null)

                        e.currentTarget.textContent = chat.nombre || ''
                      }
                    }}
                    onBlur={(e) => {
                      if (editingChatId === chat.id) {
                        const newTitle = e.currentTarget.textContent || ''
                        if (newTitle !== chat.nombre) {
                          updateTitleMutation({ id: chat.id, nombre: newTitle })
                        }
                        setEditingChatId(null)
                      }
                    }}
                    onClick={(e) => {
                      if (editingChatId === chat.id) e.stopPropagation()
                    }}
                  >
                    {chat.nombre || `Chat ${chat.creado_en.split('T')[0]}`}
                  </span>

                  {/* ACCIONES */}
                  <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingChatId(chat.id)
                        // Pequeño timeout para asegurar que el DOM se actualice antes de enfocar
                        setTimeout(() => editableRef.current?.focus(), 50)
                      }}
                      className="p-1 text-slate-400 hover:text-teal-600"
                    >
                      <Send size={12} className="rotate-45" />
                    </button>
                    <button
                      onClick={(e) => archiveChat(e, chat.id)}
                      className="p-1 text-slate-400 hover:text-amber-600"
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* ... Resto del código de archivados (sin cambios) ... */
              <div className="animate-in fade-in slide-in-from-left-2">
                <p className="mb-2 px-2 text-[10px] font-bold text-slate-400 uppercase">
                  Archivados
                </p>
                {archivedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="group relative mb-1 flex w-full items-center gap-3 rounded-lg bg-slate-50/50 px-3 py-2 text-sm text-slate-400"
                  >
                    <Archive size={14} className="shrink-0 opacity-30" />
                    <span className="truncate pr-8">
                      {chat.nombre ||
                        `Archivado ${chat.creado_en.split('T')[0]}`}
                    </span>
                    <button
                      onClick={(e) => unarchiveChat(e, chat.id)}
                      className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-teal-600"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      {/* PANEL DE CHAT PRINCIPAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        {/* NUEVO: Barra superior de campos seleccionados */}
        <div className="shrink-0 border-b bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Mejorar con IA
            </span>
            <button
              onClick={() => setOpenIA(true)}
              className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-200"
            >
              <Archive size={14} className="text-slate-500" />
              Referencias
              {totalReferencias > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">
                  {totalReferencias}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL CHAT */}
        <div className="relative min-h-0 flex-1">
          <ScrollArea ref={scrollRef} className="h-full w-full">
            <div className="mx-auto max-w-3xl space-y-6 p-6">
              {!activeChatId &&
              chatMessages.length === 0 &&
              !optimisticMessage ? (
                <div className="flex h-[400px] flex-col items-center justify-center text-center opacity-40">
                  <MessageSquarePlus
                    size={48}
                    className="mb-4 text-slate-300"
                  />
                  <h3 className="text-lg font-medium text-slate-900">
                    No hay un chat seleccionado
                  </h3>
                  <p className="text-sm text-slate-500">
                    Selecciona un chat del historial o crea uno nuevo para
                    empezar.
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex max-w-[85%] flex-col ${
                        msg.role === 'user'
                          ? 'ml-auto items-end'
                          : 'items-start'
                      }`}
                    >
                      <div
                        className={`relative rounded-2xl p-3 text-sm whitespace-pre-wrap shadow-sm transition-all duration-300 ${
                          msg.role === 'user'
                            ? 'rounded-tr-none bg-teal-600 text-white'
                            : `rounded-tl-none border bg-white text-slate-700 ${
                                // --- LÓGICA DE REFUSAL ---
                                msg.isRefusal
                                  ? 'border-red-200 bg-red-50/50 ring-1 ring-red-100'
                                  : 'border-slate-100'
                              }`
                        }`}
                      >
                        {/* Icono opcional de advertencia si es refusal */}
                        {msg.isRefusal && (
                          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase">
                            <span>Aviso del Asistente</span>
                          </div>
                        )}

                        {msg.content}

                        {!msg.isRefusal &&
                          msg.suggestions &&
                          msg.suggestions.length > 0 && (
                            <div className="mt-4">
                              <ImprovementCard
                                suggestions={msg.suggestions}
                                dbMessageId={msg.dbMessageId}
                                planId={planId}
                                currentDatos={data?.datos}
                                activeChatId={activeChatId}
                                onApplySuccess={(key) =>
                                  removeSelectedField(key)
                                }
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  ))}

                  {optimisticMessage && (
                    <div className="animate-in fade-in slide-in-from-right-2 ml-auto flex max-w-[85%] flex-col items-end">
                      <div className="rounded-2xl rounded-tr-none bg-teal-600/70 p-3 text-sm whitespace-pre-wrap text-white shadow-sm">
                        {optimisticMessage}
                      </div>
                    </div>
                  )}

                  {isSending && (
                    <div className="animate-in fade-in slide-in-from-left-2 flex flex-col items-start duration-300">
                      <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-500" />
                          </div>
                          <span className="text-[10px] font-medium tracking-tight text-slate-400 uppercase">
                            Esperando respuesta...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {/* MENÚ DE SUGERENCIAS FLOTANTE */}
            {showSuggestions && (
              <div className="animate-in slide-in-from-bottom-2 absolute bottom-full mb-2 w-full rounded-xl border bg-white shadow-2xl">
                <div className="border-b bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">
                  Resultados para "{filterQuery}"
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {filteredFields.length > 0 ? (
                    filteredFields.map((field, index) => (
                      <button
                        key={field.key}
                        onClick={() => toggleField(field)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          index === 0
                            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200 ring-inset'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span>{field.label}</span>
                        {index === 0 && (
                          <span className="font-mono text-[10px] opacity-50">
                            TAB
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      No hay coincidencias
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENEDOR DEL INPUT TRANSFORMADO */}
            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {/* 1. Visualización de campos dentro del input ) */}
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
                    if (showSuggestions) {
                      if (e.key === 'Tab' || e.key === 'Enter') {
                        if (filteredFields.length > 0) {
                          e.preventDefault()
                          toggleField(filteredFields[0])
                        }
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        setShowSuggestions(false)
                        setFilterQuery('')
                      }
                    } else {
                      // Si el usuario borra y el input está vacío, eliminar el último campo
                      if (
                        e.key === 'Backspace' &&
                        input === '' &&
                        selectedFields.length > 0
                      ) {
                        setSelectedFields((prev) => prev.slice(0, -1))
                      }
                    }

                    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
                      e.preventDefault()
                      if (!isSending) handleSend()
                    }
                  }}
                  placeholder={
                    selectedFields.length > 0
                      ? 'Escribe instrucciones adicionales...'
                      : 'Escribe tu solicitud o ":" para campos...'
                  }
                />

                <Button
                  onClick={() => handleSend()}
                  disabled={
                    isSending || (!input.trim() && selectedFields.length === 0)
                  }
                  size="icon"
                  className="mb-1 h-9 w-9 shrink-0 bg-teal-600 hover:bg-teal-700"
                >
                  {isSending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
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
      <Drawer open={openIA} onOpenChange={setOpenIA}>
        <DrawerContent className="fixed inset-x-0 bottom-0 mx-auto mb-4 flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* Cabecera más compacta */}
          <div className="flex items-center justify-between border-b bg-slate-50/50 px-4 py-3">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Referencias para la IA
            </h2>
            <button
              onClick={() => setOpenIA(false)}
              className="text-slate-400 transition-colors hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenido con scroll interno */}
          <div className="flex-1 overflow-y-auto p-4">
            <ReferenciasParaIA
              selectedArchivoIds={selectedArchivoIds}
              selectedRepositorioIds={selectedRepositorioIds}
              uploadedFiles={uploadedFiles}
              onToggleArchivo={(id, checked) => {
                setSelectedArchivoIds((prev) =>
                  checked ? [...prev, id] : prev.filter((a) => a !== id),
                )
              }}
              onToggleRepositorio={(id, checked) => {
                setSelectedRepositorioIds((prev) =>
                  checked ? [...prev, id] : prev.filter((r) => r !== id),
                )
              }}
              onFilesChange={(files) => {
                setUploadedFiles(files)
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
