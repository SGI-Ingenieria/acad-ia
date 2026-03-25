import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useParams } from '@tanstack/react-router'
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
  Edit2,
  Loader2, // Agregado
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import { ImprovementCard } from './SaveAsignatura/ImprovementCardProps'

import ReferenciasParaIA from '@/components/planes/wizard/PasoDetallesPanel/ReferenciasParaIA'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useAISubjectChat,
  useConversationBySubject,
  useMessagesBySubjectChat,
  useSubject,
  useUpdateAsignatura,
  useUpdateSubjectConversationName,
  useUpdateSubjectConversationStatus,
  useUpdateSubjectRecommendation,
} from '@/data'
import { cn } from '@/lib/utils'

interface SelectedField {
  key: string
  label: string
  value: string
}

export function IAAsignaturaTab() {
  const queryClient = useQueryClient()
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const location = useLocation()
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const updateAsignatura = useUpdateAsignatura()
  const updateRecommendation = useUpdateSubjectRecommendation()

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
  const [selectedImprovements, setSelectedImprovements] = useState<
    Array<string>
  >([])

  const handleApplyMultiple = async (sugerencias: Array<any>) => {
    if (!asignaturaId || !datosGenerales || sugerencias.length === 0) return

    setIsSending(true)
    try {
      // 1. Consolidar el Patch
      const patchData: any = {
        datos: { ...datosGenerales.datos },
      }

      for (const sug of sugerencias) {
        if (sug.campoKey === 'contenido_tematico') {
          patchData.contenido_tematico = sug.valorSugerido
        } else if (sug.campoKey === 'criterios_de_evaluacion') {
          patchData.criterios_de_evaluacion = sug.valorSugerido
        } else {
          patchData.datos[sug.campoKey] = sug.valorSugerido
        }
      }

      // 2. Actualización única de la asignatura
      await updateAsignatura.mutateAsync({
        asignaturaId: asignaturaId as any,
        patch: patchData,
      })

      // 3. Marcar recomendaciones una por una (Secuencialmente para evitar colisiones)
      for (const sug of sugerencias) {
        await updateRecommendation.mutateAsync({
          mensajeId: sug.messageId,
          campoAfectado: sug.campoKey,
        })
      }

      // 4. Limpieza de estados
      const appliedKeys = sugerencias.map((s) => s.campoKey)
      setSelectedFields((prev) =>
        prev.filter((f) => !appliedKeys.includes(f.key)),
      )
      setSelectedImprovements([])

      // Forzar actualización visual
      queryClient.invalidateQueries({ queryKey: ['subject', asignaturaId] })
    } catch (error) {
      console.error('Error en aplicación masiva:', error)
    } finally {
      setIsSending(false)
    }
  }
  const toggleImprovementSelection = (sugId: string) => {
    setSelectedImprovements((prev) =>
      prev.includes(sugId)
        ? prev.filter((id) => id !== sugId)
        : [...prev, sugId],
    )
  }

  const toggleAllFromMessage = (sugerencias: Array<any>) => {
    const allIds = sugerencias.map((s) => s.id)
    const allSelected = allIds.every((id) => selectedImprovements.includes(id))

    if (allSelected) {
      setSelectedImprovements((prev) =>
        prev.filter((id) => !allIds.includes(id)),
      )
    } else {
      setSelectedImprovements((prev) =>
        Array.from(new Set([...prev, ...allIds])),
      )
    }
  }

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
    // 1. Obtenemos los campos dinámicos de la DB
    const dynamicFields = datosGenerales?.datos
      ? Object.keys(datosGenerales.datos).map((key) => {
          const estructuraProps =
            datosGenerales.estructuras_asignatura?.definicion?.properties || {}
          return {
            key,
            label:
              estructuraProps[key]?.title ||
              key.replace(/_/g, ' ').toUpperCase(),
            value: String(datosGenerales.datos[key] || ''),
          }
        })
      : []

    // 2. Definimos tus campos manuales (hardcoded)
    const hardcodedFields = [
      {
        key: 'contenido_tematico',
        label: 'Contenido temático',
        value: '', // Puedes dejarlo vacío o buscarlo en datosGenerales si existiera
      },
      {
        key: 'criterios_de_evaluacion',
        label: 'Criterios de evaluación',
        value: '',
      },
    ]

    // 3. Unimos ambos, filtrando duplicados por si acaso el backend ya los envía
    const combined = [...dynamicFields]

    hardcodedFields.forEach((hf) => {
      if (!combined.some((f) => f.key === hf.key)) {
        combined.push(hf)
      }
    })

    return combined
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const selectionStart = e.target.selectionStart // Posición del cursor
    setInput(value)

    // Buscamos si el carácter anterior al cursor es ':'
    const lastChar = value.slice(selectionStart - 1, selectionStart)

    if (lastChar === ':') {
      setShowSuggestions(true)
    } else if (!value.includes(':')) {
      // Si borran todos los dos puntos, cerramos
      setShowSuggestions(false)
    }
  }

  const filteredFields = useMemo(() => {
    if (!showSuggestions || !input) return availableFields

    // 1. Encontrar el ":" más cercano a la IZQUIERDA del cursor
    // Usamos una posición de referencia (si no tienes ref, usaremos el final del string,
    // pero para mayor precisión lo ideal es usar e.target.selectionStart en el onChange)

    const lastColonIndex = input.lastIndexOf(':')
    if (lastColonIndex === -1) return availableFields

    // 2. Extraer solo el fragmento de "búsqueda"
    // Cortamos desde el ":" hasta el final, y luego tomamos solo la primera palabra
    const textAfterColon = input.slice(lastColonIndex + 1)
    const query = textAfterColon.split(/\s/)[0].toLowerCase() // Se detiene al encontrar un espacio

    if (!query) return availableFields

    return availableFields.filter(
      (f) =>
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query),
    )
  }, [availableFields, input, showSuggestions])

  useEffect(() => {
    const state = location.state as any

    // Verificamos si existe el timestamp (_ts) para saber que es una acción nueva
    if (state?.activeTab === 'ia' && state?._ts) {
      // Si el campo no está ya seleccionado, lo agregamos
      if (state.prefillCampo) {
        const fieldToSelect = availableFields.find(
          (f) => f.key === state.prefillCampo,
        )

        if (fieldToSelect) {
          setSelectedFields([fieldToSelect]) // Reemplaza o añade según prefieras

          // Generamos un prompt inicial automático
          const autoPrompt = `Mejora el contenido de: ${fieldToSelect.label}`
          setInput(autoPrompt)

          // Opcional: Si quieres que dispare la IA inmediatamente al llegar:
          // handleSend(autoPrompt)
        }
      }
    }
  }, [location.state, availableFields])
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
    if (!selectedFields.find((f) => f.key === field.key)) {
      setSelectedFields((prev) => [...prev, field])
    }

    const lastColonIndex = input.lastIndexOf(':')
    if (lastColonIndex !== -1) {
      const parteAntesDelColon = input.slice(0, lastColonIndex)

      // Buscamos si hay texto después de la palabra que estamos escribiendo
      const textoDespuesDelColon = input.slice(lastColonIndex + 1)
      const espacioIndex = textoDespuesDelColon.indexOf(' ')

      // Si hay un espacio, guardamos lo que sigue. Si no, es el final del texto.
      const parteRestante =
        espacioIndex !== -1 ? textoDespuesDelColon.slice(espacioIndex) : ''

      // Reconstruimos: [Antes] + [Label] + [Lo que ya estaba después]
      const nuevoTexto = `${parteAntesDelColon}${field.label}${parteRestante}`
      setInput(nuevoTexto)
    }

    setShowSuggestions(false)
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
      // setSelectedFields([])

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
    <div className="flex h-full w-full overflow-hidden bg-white">
      <div className="fixed top-0 z-40 flex w-full items-center justify-between border-b bg-white/80 p-2 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600"
          onClick={() => setIsSidebarOpen(true)}
        >
          <History size={18} className="mr-2" /> Historial
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-[9px] font-bold tracking-wider text-teal-600 uppercase">
            Asistente
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600"
          onClick={() => setOpenIA(true)} // O el drawer de acciones/referencias
        >
          <FileText size={18} className="mr-2 text-teal-600" /> Referencias
        </Button>
      </div>
      {/* 1. PANEL IZQUIERDO (HISTORIAL) - Desktop */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-white pr-4 md:flex">
        <div className="mb-4 flex items-center justify-between px-2 pt-4">
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
            setActiveChatId(undefined)
            setIsCreatingNewChat(true)
            setInput('')
            setSelectedFields([])
            queryClient.setQueryData(['subject-messages', undefined], [])
          }}
          variant="outline"
          className="mb-4 w-full justify-start gap-2 border-dashed border-slate-300 text-slate-600 hover:border-teal-500 hover:bg-teal-50/50"
        >
          <MessageSquarePlus size={18} /> Nuevo Chat
        </Button>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 pr-3">
            {(showArchived ? archivedChats : activeChats).map((chat: any) => (
              <div
                key={chat.id}
                className={cn(
                  // Agregamos 'overflow-hidden' para que nada salga de este cuadro
                  'group relative flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm transition-all',
                  activeChatId === chat.id
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
                onDoubleClick={() => {
                  setEditingId(chat.id)
                  setTempName(chat.nombre || chat.titulo || 'Conversacion')
                }}
              >
                {editingId === chat.id ? (
                  <div className="flex min-w-0 flex-1 items-center">
                    <input
                      autoFocus
                      className="w-full rounded border-none bg-white px-1 text-xs ring-1 ring-teal-400 outline-none"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onBlur={() => handleSaveName(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName(chat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {/* CLAVE 2: 'truncate' y 'min-w-0' en el span para que ceda ante los botones */}
                    <span
                      onClick={() => setActiveChatId(chat.id)}
                      className="block max-w-[140px] min-w-0 flex-1 cursor-pointer truncate pr-1"
                      title={chat.nombre || chat.titulo}
                    >
                      {chat.nombre || chat.titulo || 'Conversación'}
                    </span>

                    {/* CLAVE 3: 'shrink-0' asegura que los botones NUNCA desaparezcan */}
                    <div
                      className={cn(
                        'z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                        activeChatId === chat.id
                          ? 'bg-teal-50'
                          : 'bg-slate-100',
                      )}
                    >
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(chat.id)
                                setTempName(chat.nombre || chat.titulo || '')
                              }}
                              className="rounded-md p-1 transition-colors hover:bg-slate-200 hover:text-teal-600"
                            >
                              <Edit2 size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            Editar nombre
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const nuevoEstado =
                                  chat.estado === 'ACTIVA'
                                    ? 'ARCHIVADA'
                                    : 'ACTIVA'
                                updateStatus({
                                  id: chat.id,
                                  estado: nuevoEstado,
                                })
                              }}
                              className={cn(
                                'rounded-md p-1 transition-colors hover:bg-slate-200',
                                chat.estado === 'ACTIVA'
                                  ? 'hover:text-red-500'
                                  : 'hover:text-teal-600',
                              )}
                            >
                              {chat.estado === 'ACTIVA' ? (
                                <Archive size={14} />
                              ) : (
                                <History size={14} className="scale-x-[-1]" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            {chat.estado === 'ACTIVA'
                              ? 'Archivar'
                              : 'Desarchivar'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* 2. PANEL CENTRAL (CHAT) - EL RECUADRO ESTILIZADO */}
      <main
        className={cn(
          'relative flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/50 shadow-sm',
          'mt-[50px] h-[calc(100svh-50px)]', // 50px es la altura aproximada de tu header fixed
          'md:m-2 md:mt-0 md:h-[calc(100vh-160px)] md:rounded-xl md:border md:border-slate-200',
        )}
      >
        {/* Header Interno del Recuadro */}
        <div className="flex shrink-0 items-center justify-between border-b bg-white p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <History size={20} className="text-slate-500" />
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-wider text-teal-600 uppercase">
                Asistente Académico
              </span>
              <span className="text-[11px] text-slate-400">
                Personalizado para tu asignatura
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOpenIA(true)}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              <FileText size={14} />
              <span className="xs:inline hidden">Referencias</span>
              {totalReferencias > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] text-white">
                  {totalReferencias}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          <ScrollArea ref={scrollRef} className="h-full w-full">
            <div className="mx-auto max-w-3xl space-y-6 p-3 md:p-6">
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
                        style={{ whiteSpace: 'pre-line' }}
                        className={cn(
                          'text-sm leading-relaxed',
                          msg.role === 'assistant' && 'p-4',
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* CONTENEDOR DE SUGERENCIAS INTEGRADO */}
                      {msg.role === 'assistant' &&
                        msg.sugerencias?.length > 0 && (
                          <div className="space-y-3 border-t bg-slate-50/50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                Mejoras disponibles
                              </p>

                              {/* Solo mostramos "Seleccionar todo" si hay sugerencias pendientes en ESTE mensaje */}
                              {msg.sugerencias.some((s) => !s.aceptada) && (
                                <Button
                                  variant="ghost"
                                  className="h-6 text-[10px] text-teal-600 hover:bg-teal-100"
                                  onClick={() =>
                                    toggleAllFromMessage(msg.sugerencias)
                                  }
                                >
                                  {msg.sugerencias
                                    .filter((s) => !s.aceptada)
                                    .every((s) =>
                                      selectedImprovements.includes(s.id),
                                    )
                                    ? 'Desmarcar todas'
                                    : 'Seleccionar todas'}
                                </Button>
                              )}
                            </div>

                            {msg.sugerencias.map((sug: any) => (
                              <div key={sug.id} className="flex gap-2">
                                {!sug.aceptada && (
                                  <input
                                    type="checkbox"
                                    className="mt-4 h-4 w-4 rounded border-slate-300 accent-teal-600"
                                    checked={selectedImprovements.includes(
                                      sug.id,
                                    )}
                                    onChange={() =>
                                      toggleImprovementSelection(sug.id)
                                    }
                                  />
                                )}
                                <div className="flex-1">
                                  <ImprovementCard
                                    sug={sug}
                                    asignaturaId={asignaturaId}
                                    onApplied={(key) =>
                                      setSelectedFields((prev) =>
                                        prev.filter((f) => f.key !== key),
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            ))}

                            {/* EL BOTÓN DE APLICAR: Lo movemos para que solo aparezca si hay algo seleccionado de ESTE mensaje */}
                            {msg.sugerencias.some((s) =>
                              selectedImprovements.includes(s.id),
                            ) && (
                              <Button
                                size="sm"
                                disabled={isSending}
                                className="w-full bg-teal-600 text-xs font-bold shadow-md hover:bg-teal-700"
                                onClick={() => {
                                  const seleccionadasDeEsteMensaje =
                                    msg.sugerencias.filter((s) =>
                                      selectedImprovements.includes(s.id),
                                    )
                                  handleApplyMultiple(
                                    seleccionadasDeEsteMensaje,
                                  )
                                }}
                              >
                                {isSending ? (
                                  <Loader2
                                    className="mr-2 animate-spin"
                                    size={14}
                                  />
                                ) : (
                                  <Check className="mr-2" size={14} />
                                )}
                                Aplicar mejoras seleccionadas
                              </Button>
                            )}
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

        {/* Input de Chat */}
        <footer className="shrink-0 border-t bg-white p-3 md:p-4">
          <div className="shrink-0 border-t bg-white p-2 md:p-4">
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
                      const val = e.target.value
                      const cursor = e.target.selectionStart
                      setInput(val)

                      const textBeforeCursor = val.slice(0, cursor)
                      const lastColonIndex = textBeforeCursor.lastIndexOf(':')

                      if (lastColonIndex !== -1) {
                        const textSinceColon = textBeforeCursor.slice(
                          lastColonIndex + 1,
                        )

                        // Si hay un espacio después del ":", cerramos sugerencias (ya no es un comando)
                        // Si no hay espacio, activamos
                        if (!textSinceColon.includes(' ')) {
                          setShowSuggestions(true)
                        } else {
                          setShowSuggestions(false)
                        }
                      } else {
                        setShowSuggestions(false)
                      }
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
                      (!input.trim() && selectedFields.length === 0) ||
                      isSending
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
        </footer>
      </main>

      {/* 3. PANEL DERECHO (ATAJOS) */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto p-4 lg:flex">
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Lightbulb size={18} className="text-orange-500" /> Atajos Rápidos
        </h4>
        <div className="space-y-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSend(preset.prompt)}
              className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left text-sm transition-all hover:border-teal-500 hover:shadow-sm"
            >
              <div className="rounded-lg bg-slate-50 p-2 group-hover:bg-teal-50 group-hover:text-teal-600">
                <preset.icon size={16} />
              </div>
              <span className="font-medium text-slate-600 group-hover:text-slate-900">
                {preset.label}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* DRAWERS (Referencias e Historial Móvil) */}
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

      <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/40" />
          <DrawerContent className="fixed right-0 bottom-0 left-0 h-[70vh] p-4 outline-none">
            <div className="flex h-full flex-col overflow-hidden pt-8">
              {/* Reutiliza aquí el componente de la lista de chats */}
              <Button
                onClick={() => {
                  setActiveChatId(undefined)
                  setIsCreatingNewChat(true)
                  setInput('')
                  setSelectedFields([])
                  queryClient.setQueryData(['subject-messages', undefined], [])
                  setIsSidebarOpen(false) // Cierra el drawer al crear nuevo
                }}
                variant="outline"
                className="mb-6 w-full justify-center gap-2 border-dashed border-teal-500 bg-teal-50/50 text-teal-700 hover:bg-teal-100"
              >
                <MessageSquarePlus size={18} /> Nuevo Chat
              </Button>
              <h2 className="mb-4 font-bold">Historial de Chats</h2>
              {(showArchived ? archivedChats : activeChats).map((chat: any) => (
                <div
                  key={chat.id}
                  className={cn(
                    // Agregamos 'overflow-hidden' para que nada salga de este cuadro
                    'group relative flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm transition-all',
                    activeChatId === chat.id
                      ? 'bg-teal-50 text-teal-900'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                  onDoubleClick={() => {
                    setEditingId(chat.id)
                    setTempName(chat.nombre || chat.titulo || 'Conversacion')
                  }}
                >
                  {editingId === chat.id ? (
                    <div className="flex min-w-0 flex-1 items-center">
                      <input
                        autoFocus
                        className="w-full rounded border-none bg-white px-1 text-xs ring-1 ring-teal-400 outline-none"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => handleSaveName(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveName(chat.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* CLAVE 2: 'truncate' y 'min-w-0' en el span para que ceda ante los botones */}
                      <span
                        onClick={() => setActiveChatId(chat.id)}
                        className="block max-w-[140px] min-w-0 flex-1 cursor-pointer truncate pr-1"
                        title={chat.nombre || chat.titulo}
                      >
                        {chat.nombre || chat.titulo || 'Conversación'}
                      </span>

                      {/* CLAVE 3: 'shrink-0' asegura que los botones NUNCA desaparezcan */}
                      <div
                        className={cn(
                          'z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                          activeChatId === chat.id
                            ? 'bg-teal-50'
                            : 'bg-slate-100',
                        )}
                      >
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingId(chat.id)
                                  setTempName(chat.nombre || chat.titulo || '')
                                }}
                                className="rounded-md p-1 transition-colors hover:bg-slate-200 hover:text-teal-600"
                              >
                                <Edit2 size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px]">
                              Editar nombre
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const nuevoEstado =
                                    chat.estado === 'ACTIVA'
                                      ? 'ARCHIVADA'
                                      : 'ACTIVA'
                                  updateStatus({
                                    id: chat.id,
                                    estado: nuevoEstado,
                                  })
                                }}
                                className={cn(
                                  'rounded-md p-1 transition-colors hover:bg-slate-200',
                                  chat.estado === 'ACTIVA'
                                    ? 'hover:text-red-500'
                                    : 'hover:text-teal-600',
                                )}
                              >
                                {chat.estado === 'ACTIVA' ? (
                                  <Archive size={14} />
                                ) : (
                                  <History size={14} className="scale-x-[-1]" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px]">
                              {chat.estado === 'ACTIVA'
                                ? 'Archivar'
                                : 'Desarchivar'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  )
}
