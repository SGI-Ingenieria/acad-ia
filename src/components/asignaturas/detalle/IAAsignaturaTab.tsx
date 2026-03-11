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
  History,
  Edit2, // Agregado
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import { ImprovementCard } from './SaveAsignatura/ImprovementCardProps'

import type { IASugerencia } from '@/types/asignatura'

import ReferenciasParaIA from '@/components/planes/wizard/PasoDetallesPanel/ReferenciasParaIA'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  useAISubjectChat,
  useConversationBySubject,
  useMessagesBySubjectChat,
  useSubject,
  useUpdateSubjectConversationName,
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
  const { mutate: updateName } = useUpdateSubjectConversationName()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempName, setTempName] = useState('')
  const [openIA, setOpenIA] = useState(false)

  const [selectedArchivoIds, setSelectedArchivoIds] = useState<Array<string>>(
    [],
  )
  const [selectedRepositorioIds, setSelectedRepositorioIds] = useState<
    Array<string>
  >([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<File>>([])

  // Cálculo del total para el Badge del botón
  const totalReferencias =
    selectedArchivoIds.length +
    selectedRepositorioIds.length +
    uploadedFiles.length

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

  // --- PROCESAMIENTO DE MENSAJES ---
  // --- PROCESAMIENTO DE MENSAJES ---
  const messages = useMemo(() => {
    const msgs: Array<any> = []

    // 1. Mensajes existentes de la DB
    if (rawMessages) {
      rawMessages.forEach((m) => {
        // Mensaje del usuario
        msgs.push({ id: `${m.id}-user`, role: 'user', content: m.mensaje })

        // Respuesta de la IA (si existe)
        if (m.respuesta) {
          const sugerencias =
            m.propuesta?.recommendations?.map((rec: any, index: number) => ({
              id: `${m.id}-sug-${index}`,
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
            sugerencias: sugerencias,
          })
        }
      })
    }

    // 2. INYECCIÓN OPTIMISTA: Si estamos enviando, mostramos el texto actual del input como mensaje de usuario
    if (isSending && input.trim()) {
      msgs.push({
        id: 'optimistic-user-msg',
        role: 'user',
        content: input,
      })
    }

    return msgs
  }, [rawMessages, isSending, input])

  // Auto-selección inicial
  useEffect(() => {
    // Si ya hay un chat, o si el usuario ya interactuó (hasInitialSelected), abortamos.
    if (activeChatId || hasInitialSelected.current) return

    if (activeChats.length > 0 && !loadingConv) {
      setActiveChatId(activeChats[0].id)
      hasInitialSelected.current = true
    }
  }, [activeChats, loadingConv])

  const filteredFields = useMemo(() => {
    if (!showSuggestions) return availableFields

    // Extraemos lo que hay después del último ':' para filtrar
    const lastColonIndex = input.lastIndexOf(':')
    const query = input.slice(lastColonIndex + 1).toLowerCase()

    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query),
    )
  }, [availableFields, input, showSuggestions])

  // 2. Efecto para cerrar con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSuggestions(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 3. Función para insertar el campo y limpiar el prompt
  const handleSelectField = (field: SelectedField) => {
    // 1. Agregamos al array de objetos (para tu lógica de API)
    if (!selectedFields.find((f) => f.key === field.key)) {
      setSelectedFields((prev) => [...prev, field])
    }

    // 2. Lógica de autocompletado en el texto
    const lastColonIndex = input.lastIndexOf(':')
    if (lastColonIndex !== -1) {
      // Tomamos lo que había antes del ":" + el Nombre del Campo + un espacio
      const nuevoTexto = input.slice(0, lastColonIndex) + `${field.label} `
      setInput(nuevoTexto)
    }

    // 3. Cerramos el buscador y devolvemos el foco al textarea
    setShowSuggestions(false)

    // Opcional: Si tienes una ref del textarea, puedes hacer:
    // textareaRef.current?.focus()
  }

  const handleSaveName = (id: string) => {
    if (tempName.trim()) {
      updateName({ id, nombre: tempName })
    }
    setEditingId(null)
  }

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
            {/* CORRECCIÓN: Mapear ambos casos */}
            {(showArchived ? archivedChats : activeChats).map((chat: any) => (
              <div
                key={chat.id}
                className={cn(
                  'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                  activeChatId === chat.id
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <FileText size={14} className="shrink-0 opacity-50" />

                {editingId === chat.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      autoFocus
                      className="w-full rounded bg-white px-1 text-xs ring-1 ring-teal-400 outline-none"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => handleSaveName(chat.id)} // Guardar al hacer clic fuera
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(chat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => setActiveChatId(chat.id)}
                      className="flex-1 cursor-pointer truncate"
                    >
                      {/* CORRECCIÓN: Usar 'nombre' si así se llama en tu DB */}
                      {chat.nombre || chat.titulo || 'Conversación'}
                    </span>

                    <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(chat.id)
                          setTempName(chat.nombre || chat.titulo || '')
                        }}
                        className="p-1 hover:text-teal-600"
                      >
                        <Edit2 size={12} />
                      </button>

                      {/* Botón para Archivar/Desarchivar dinámico */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Si el estado actual es ACTIVA, mandamos ARCHIVADA. Si no, viceversa.
                          const nuevoEstado =
                            chat.estado === 'ACTIVA' ? 'ARCHIVADA' : 'ACTIVA'
                          updateStatus({ id: chat.id, estado: nuevoEstado })
                        }}
                        className={cn(
                          'p-1 transition-colors',
                          chat.estado === 'ACTIVA'
                            ? 'hover:text-red-500'
                            : 'hover:text-teal-600',
                        )}
                        title={
                          chat.estado === 'ACTIVA'
                            ? 'Archivar chat'
                            : 'Desarchivar chat'
                        }
                      >
                        {chat.estado === 'ACTIVA' ? (
                          <Archive size={12} />
                        ) : (
                          /* Icono de Desarchivar */
                          <History size={12} className="scale-x-[-1]" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* PANEL CENTRAL */}
      <div className="relative flex min-w-0 flex-[3] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b bg-white p-3">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Asistente IA
          </span>
          <button
            onClick={() => setOpenIA(true)}
            className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-200"
          >
            <FileText size={14} className="text-slate-500" />
            Referencias
            {totalReferencias > 0 && (
              <span className="animate-in zoom-in flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">
                {totalReferencias}
              </span>
            )}
          </button>
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
                            {msg.sugerencias.map((sug: any) => (
                              <ImprovementCard
                                key={sug.id}
                                sug={sug}
                                asignaturaId={asignaturaId}
                              />
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="animate-in fade-in slide-in-from-bottom-2 flex gap-4">
                  <Avatar className="h-9 w-9 shrink-0 border bg-teal-600 text-white shadow-sm">
                    <AvatarFallback>
                      <Sparkles size={16} className="animate-pulse" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start gap-2">
                    <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 italic">
                      La IA está analizando tu solicitud...
                    </span>
                  </div>
                </div>
              )}
              {/* Espacio extra al final para que el scroll no tape el último mensaje */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t bg-white p-4">
          <div className="relative mx-auto max-w-4xl">
            {showSuggestions && (
              <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-0 z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-white shadow-2xl">
                <div className="flex justify-between border-b bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase">
                  <span>Filtrando campos...</span>
                  <span className="rounded bg-slate-200 px-1 text-[9px] text-slate-400">
                    ESC para cerrar
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto p-1">
                  {filteredFields.length > 0 ? (
                    filteredFields.map((field) => (
                      <button
                        key={field.key}
                        onClick={() => handleSelectField(field)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-teal-50"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {field.label}
                          </span>
                        </div>
                        {selectedFields.find((f) => f.key === field.key) && (
                          <Check size={14} className="text-teal-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No se encontraron coincidencias
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 rounded-xl border bg-slate-50 p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-teal-500">
              {selectedFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-2 pt-1">
                  {selectedFields.map((field) => (
                    <div
                      key={field.key}
                      className="animate-in zoom-in-95 flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 shadow-sm"
                    >
                      <Target size={10} />
                      {field.label}
                      <button
                        onClick={() => toggleField(field)}
                        className="ml-1 rounded-full p-0.5 transition-colors hover:bg-teal-200/50"
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
      {/* --- DRAWER DE REFERENCIAS --- */}
      <Drawer open={openIA} onOpenChange={setOpenIA}>
        <DrawerContent className="fixed inset-x-0 bottom-0 mx-auto mb-4 flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b bg-slate-50/50 px-4 py-3">
            <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Referencias para la IA
            </h2>
            <button
              onClick={() => setOpenIA(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

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
              onFilesChange={(files) => setUploadedFiles(files)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
