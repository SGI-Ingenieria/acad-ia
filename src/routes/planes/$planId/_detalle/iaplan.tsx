/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
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
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'

import type { UploadedFile } from '@/components/planes/wizard/PasoDetallesPanel/FileDropZone'

import ReferenciasParaIA from '@/components/planes/wizard/PasoDetallesPanel/ReferenciasParaIA'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
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

export const Route = createFileRoute('/planes/$planId/_detalle/iaplan')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()

  const { data } = usePlan('0e0aea4d-b8b4-4e75-8279-6224c3ac769f')
  const routerState = useRouterState()
  const [openIA, setOpenIA] = useState(false)
  // archivos
  const [selectedArchivoIds, setSelectedArchivoIds] = useState<Array<string>>(
    [],
  )
  const [selectedRepositorioIds, setSelectedRepositorioIds] = useState<
    Array<string>
  >([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<UploadedFile>>([])

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
  const [activeChatId, setActiveChatId] = useState('1')
  const [chatHistory, setChatHistory] = useState([
    { id: '1', title: 'Chat inicial' },
  ])
  const [showArchived, setShowArchived] = useState(false)
  const [archivedHistory, setArchivedHistory] = useState<Array<any>>([])
  const [allMessages, setAllMessages] = useState<{ [key: string]: Array<any> }>(
    {
      '1': [
        {
          id: 'm1',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente de IA en este chat inicial.',
        },
      ],
    },
  )
  const createNewChat = () => {
    const newId = Date.now().toString()
    const newChat = { id: newId, title: `Nuevo chat ${chatHistory.length + 1}` }

    setChatHistory([newChat, ...chatHistory])
    setAllMessages({
      ...allMessages,
      [newId]: [
        {
          id: '1',
          role: 'assistant',
          content: '¡Nuevo chat creado! ¿En qué puedo ayudarte?',
        },
      ],
    })
    setActiveChatId(newId)
  }

  const archiveChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    const chatToArchive = chatHistory.find((chat) => chat.id === id)
    if (chatToArchive) {
      setArchivedHistory([chatToArchive, ...archivedHistory])
      const newHistory = chatHistory.filter((chat) => chat.id !== id)
      setChatHistory(newHistory)
      if (activeChatId === id && newHistory.length > 0) {
        setActiveChatId(newHistory[0].id)
      }
    }
  }
  const unarchiveChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const chatToRestore = archivedHistory.find((chat) => chat.id === id)
    if (chatToRestore) {
      setChatHistory([chatToRestore, ...chatHistory])
      setArchivedHistory(archivedHistory.filter((chat) => chat.id !== id))
    }
  }

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

    if (!field) return

    setSelectedFields([field])
    setInput((prev) =>
      injectFieldsIntoInput(prev || 'Mejora este campo:', [field]),
    )
  }, [availableFields])

  // 3. Lógica para el disparador ":"
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)

    // Si el último carácter es ':', mostramos sugerencias
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
    // Quita cualquier bloque previo de campos
    const cleaned = input.replace(/\n?\[Campos:[^\]]*]/g, '').trim()

    if (fields.length === 0) return cleaned

    const fieldLabels = fields.map((f) => f.label).join(', ')

    return `${cleaned}\n[Campos: ${fieldLabels}]`
  }

  const toggleField = (field: SelectedField) => {
    // 1. Actualizamos los campos seleccionados (para los badges y la lógica de la IA)
    setSelectedFields((prev) => {
      const isSelected = prev.find((f) => f.key === field.key)
      return isSelected ? prev : [...prev, field]
    })

    // 2. Insertamos el nombre del campo en el texto y quitamos el ":"
    setInput((prevInput) => {
      // Buscamos la última posición del ":"
      const lastColonIndex = prevInput.lastIndexOf(':')

      if (lastColonIndex !== -1) {
        // Tomamos lo que está antes del ":" y le concatenamos el nombre del campo
        const textBefore = prevInput.substring(0, lastColonIndex)
        const textAfter = prevInput.substring(lastColonIndex + 1)

        // Retornamos el texto con el nombre del campo (puedes añadir espacio si prefieres)
        return `${textBefore} ${field.label}${textAfter}`
      }

      return prevInput
    })

    setShowSuggestions(false)
  }

  const buildPrompt = (userInput: string) => {
    // Si no hay campos, enviamos solo el texto
    if (selectedFields.length === 0) return userInput

    const fieldsText = selectedFields
      .map(
        (f) =>
          `### CAMPO: ${f.label}\nCONTENIDO ACTUAL: ${f.value || '(vacío)'}`,
      )
      .join('\n\n')

    return `Instrucción del usuario: ${userInput || 'Mejora los campos seleccionados.'}

A continuación se detallan los campos a procesar:
${fieldsText}`.trim()
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

    // setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    // setSelectedFields([])
    setSelectedArchivoIds([])
    setSelectedRepositorioIds([])
    setUploadedFiles([])

    setTimeout(() => {
      const suggestions = selectedFields.map((field) => ({
        key: field.key,
        label: field.label,
        newValue: field.value,
      }))

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          type: 'improvement-card',
          content:
            'He analizado los campos seleccionados. Aquí tienes mis sugerencias de mejora:',
          suggestions: suggestions,
        },
      ])
      setIsLoading(false)
    }, 1200)
  }

  // ... debajo de tus otros hooks
  const totalReferencias = useMemo(() => {
    return (
      selectedArchivoIds.length +
      selectedRepositorioIds.length +
      uploadedFiles.length
    )
  }, [selectedArchivoIds, selectedRepositorioIds, uploadedFiles])

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
            {/* Lógica de renderizado condicional */}
            {!showArchived ? (
              // LISTA DE CHATS ACTIVOS
              chatHistory.map((chat) => (
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
                  <span className="truncate pr-8">{chat.title}</span>
                  <button
                    onClick={(e) => archiveChat(e, chat.id)}
                    className="absolute right-2 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:text-amber-600"
                    title="Archivar"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              ))
            ) : (
              // LISTA DE CHATS ARCHIVADOS
              <div className="animate-in fade-in slide-in-from-left-2">
                <p className="mb-2 px-2 text-[10px] font-bold text-slate-400 uppercase">
                  Archivados
                </p>
                {archivedHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="group relative mb-1 flex w-full items-center gap-3 rounded-lg bg-slate-50/50 px-3 py-2 text-sm text-slate-400"
                  >
                    <Archive size={14} className="shrink-0 opacity-30" />
                    <span className="truncate pr-8">{chat.title}</span>
                    <button
                      onClick={(e) => unarchiveChat(e, chat.id)}
                      className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-teal-600"
                      title="Desarchivar"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                ))}
                {archivedHistory.length === 0 && (
                  <div className="px-2 py-4 text-center">
                    <p className="text-xs text-slate-400 italic">
                      No hay archivados
                    </p>
                  </div>
                )}
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
              {messages.map((msg) => (
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

                    {msg.type === 'improvement-card' && (
                      <ImprovementCard
                        suggestions={msg.suggestions}
                        onApply={(key, val) => {
                          setSelectedFields((prev) =>
                            prev.filter((f) => f.key !== key),
                          )
                          console.log(`Aplicando ${val} al campo ${key}`)
                          // Aquí llamarías a tu función de actualización de datos real
                        }}
                      />
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
                  placeholder={
                    selectedFields.length > 0
                      ? 'Escribe instrucciones adicionales...'
                      : 'Escribe tu solicitud o ":" para campos...'
                  }
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
        <DrawerContent className="fixed inset-0 h-screen w-screen max-w-none rounded-none">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-sm font-semibold">Referencias para la IA</h2>

            <button
              onClick={() => setOpenIA(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Cerrar
            </button>
          </div>

          <div className="h-[calc(100vh-60px)] overflow-y-auto p-6">
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

const ImprovementCard = ({
  suggestions,
  onApply,
}: {
  suggestions: Array<any>
  onApply: (key: string, value: string) => void
}) => {
  // Estado para rastrear qué campos han sido aplicados
  const [appliedFields, setAppliedFields] = useState<Array<string>>([])

  const handleApply = (key: string, value: string) => {
    onApply(key, value)
    setAppliedFields((prev) => [...prev, key])
  }

  return (
    <div className="mt-2 flex w-full flex-col gap-4">
      {suggestions.map((sug) => {
        const isApplied = appliedFields.includes(sug.key)

        return (
          <div
            key={sug.key}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{sug.label}</h3>
              <Button
                size="sm"
                onClick={() => handleApply(sug.key, sug.newValue)}
                disabled={isApplied}
                className={`h-8 rounded-full px-4 text-xs transition-all ${
                  isApplied
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-[#00a189] text-white hover:bg-[#008f7a]'
                }`}
              >
                {isApplied ? (
                  <span className="flex items-center gap-1">
                    <Check size={12} /> Aplicado
                  </span>
                ) : (
                  'Aplicar mejora'
                )}
              </Button>
            </div>

            <div
              className={`rounded-xl border p-3 text-sm transition-colors duration-300 ${
                isApplied
                  ? 'border-[#ccfbf1] bg-[#f0fdfa] text-slate-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {sug.newValue}
            </div>
          </div>
        )
      })}
    </div>
  )
}
