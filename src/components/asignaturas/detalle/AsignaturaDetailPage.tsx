import {
  createFileRoute,
  useNavigate,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { Pencil, Sparkles } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

import type { AsignaturaDetail } from '@/data'
import type {
  CampoEstructura,
  IAMessage,
  IASugerencia,
} from '@/types/asignatura'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSubject, useUpdateAsignatura } from '@/data/hooks/useSubjects'

export interface BibliografiaEntry {
  id: string
  tipo: 'BASICA' | 'COMPLEMENTARIA'
  cita: string
  fuenteBibliotecaId?: string
  fuenteBiblioteca?: any
}
export interface BibliografiaTabProps {
  id: string
  bibliografia: Array<BibliografiaEntry>
  onSave: (bibliografia: Array<BibliografiaEntry>) => void
  isSaving: boolean
}

export interface AsignaturaDatos {
  [key: string]: string
}

export interface AsignaturaResponse {
  datos: AsignaturaDatos
}

function EditableHeaderField({
  value,
  onSave,
  className,
}: {
  value: string | number
  onSave: (val: string) => void
  className?: string
}) {
  const textValue = String(value)

  // Manejador para cuando el usuario termina de editar (pierde el foco)
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const newValue = e.currentTarget.innerText
    if (newValue !== textValue) {
      onSave(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur() // Forzamos el guardado al presionar Enter
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      contentEditable
      suppressContentEditableWarning={true} // Evita el warning de React por tener hijos y contentEditable
      spellCheck={false}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`inline-block cursor-text rounded-sm px-1 transition-all hover:bg-white/10 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 focus:outline-none ${className ?? ''} `}
    >
      {textValue}
    </span>
  )
}

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  component: AsignaturaDetailPage,
})

export default function AsignaturaDetailPage() {
  const routerState = useRouterState()
  const state = routerState.location.state as any
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { data: asignaturaApi, isLoading: loadingAsig } =
    useSubject(asignaturaId)
  // 1. Asegúrate de tener estos estados en tu componente principal
  const [messages, setMessages] = useState<Array<IAMessage>>([])
  const [asignatura, setAsignatura] = useState({})
  const [campos, setCampos] = useState<Array<CampoEstructura>>([])
  const [activeTab, setActiveTab] = useState('datos')
  const updateAsignatura = useUpdateAsignatura()

  // Dentro de AsignaturaDetailPage
  const [headerData, setHeaderData] = useState({
    codigo: '',
    nombre: '',
    creditos: 0,
    ciclo: 0,
  })

  useEffect(() => {
    // Si en el state de la ruta viene una pestaña específica, cámbiate a ella
    if (state?.activeTab) {
      setActiveTab(state.activeTab)
    }
  }, [state])

  // Sincronizar cuando llegue la API
  useEffect(() => {
    if (asignaturaApi) {
      setHeaderData({
        codigo: asignaturaApi.codigo ?? '',
        nombre: asignaturaApi.nombre,
        creditos: asignaturaApi.creditos,
        ciclo: asignaturaApi.numero_ciclo ?? 0,
      })
    }
  }, [asignaturaApi])

  const handleUpdateHeader = (key: string, value: string | number) => {
    const newData = { ...headerData, [key]: value }
    setHeaderData(newData)

    const patch: Record<string, any> =
      key === 'ciclo'
        ? { numero_ciclo: value }
        : {
            [key]: value,
          }

    updateAsignatura.mutate({
      asignaturaId,
      patch,
    })
  }

  const handlePersistDatoGeneral = (clave: string, value: string) => {
    const baseDatos =
      (asignatura as any)?.datos ?? (asignaturaApi as any)?.datos ?? {}
    const mergedDatos = { ...baseDatos, [clave]: value }

    // Mantener estado local coherente para merges posteriores.
    setAsignatura((prev: any) => ({
      ...(prev && Object.keys(prev).length
        ? prev
        : ((asignaturaApi as any) ?? {})),
      datos: mergedDatos,
    }))

    updateAsignatura.mutate({
      asignaturaId,
      patch: {
        datos: mergedDatos,
      },
    })
  }
  /* ---------- sincronizar API ---------- */
  useEffect(() => {
    if (asignaturaApi?.datos) {
      setAsignatura(asignaturaApi)
    }
  }, [asignaturaApi])

  // 2. Funciones de manejo para la IA
  const handleSendMessage = (text: string, campoId?: string) => {
    const newMessage: IAMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      campoAfectado: campoId,
    }
    setMessages([...messages, newMessage])

    // Aquí llamarías a tu API de OpenAI/Claude
    // toast.info("Enviando consulta a la IA...");
  }

  const handleAcceptSuggestion = (sugerencia: IASugerencia) => {
    // Lógica para actualizar el valor del campo en tu estado de asignatura
    // toast.success(`Sugerencia aplicada a ${sugerencia.campoNombre}`);
  }

  // Dentro de tu componente principal (donde están los Tabs)
  const [bibliografia, setBibliografia] = useState<Array<BibliografiaEntry>>([
    {
      id: '1',
      tipo: 'BASICA',
      cita: 'Russell, S., & Norvig, P. (2020). Artificial Intelligence: A Modern Approach. Pearson.',
    },
  ])
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveBibliografia = (data: Array<BibliografiaEntry>) => {
    setIsSaving(true)
    // Aquí iría tu llamada a la API
    setBibliografia(data)

    // Simulamos un guardado
    setTimeout(() => {
      setIsSaving(false)
      // toast.success("Cambios guardados");
    }, 1000)
  }

  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerateDocument = useCallback(() => {
    setIsRegenerating(true)
    setTimeout(() => {
      setIsRegenerating(false)
    }, 2000)
  }, [])

  return <DatosGenerales onPersistDato={handlePersistDatoGeneral} />
}

interface EstructuraDefinicion {
  properties?: Record<
    string,
    {
      title?: string
      description?: string
      examples?: Array<string>
    }
  >
}
interface DatosGeneralesProps {
  asignaturaId: string
  data: AsignaturaDetail
  isLoading: boolean
  onPersistDato: (clave: string, value: string) => void
}
function DatosGenerales({
  onPersistDato,
}: {
  onPersistDato: (clave: string, value: string) => void
}) {
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  const { data: data, isLoading: isLoading } = useSubject(asignaturaId)

  const structureProps =
    (data?.estructuras_asignatura?.definicion as EstructuraDefinicion)
      .properties || {}
  const valoresActuales = data?.datos || {}
  if (isLoading) return <p>Cargando información...</p>

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 px-4 py-8 duration-500">
      {/* Encabezado de la Sección */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Datos Generales
          </h2>
          <p className="mt-1 text-slate-500">
            Información oficial estructurada bajo los lineamientos de la SEP.
          </p>
        </div>
      </div>

      {/* Grid de Información */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Columna Principal (Más ancha) */}
        <div className="space-y-6 md:col-span-2">
          {Object.entries(structureProps).map(
            ([key, config]: [string, any]) => {
              const cardTitle = config.title || key
              const description = config.description || ''

              const placeholder =
                config.examples && config.examples.length > 0
                  ? config.examples[0]
                  : ''

              const valActual = (valoresActuales as Record<string, any>)[key]
              const currentContent = valActual ?? ''

              return (
                <InfoCard
                  asignaturaId={asignaturaId}
                  key={key}
                  clave={key}
                  title={cardTitle}
                  initialContent={currentContent}
                  placeholder={placeholder}
                  description={description}
                  onPersist={(clave, value) => onPersistDato(clave, value)}
                />
              )
            },
          )}
        </div>

        {/* Columna Lateral (Información Secundaria) */}
        <div className="space-y-6">
          <div className="space-y-6">
            {/* Tarjeta de Requisitos */}
            <InfoCard
              title="Requisitos y Seriación"
              type="requirements"
              initialContent={[
                {
                  type: 'Pre-requisito',
                  code: 'PA-301',
                  name: 'Programación Avanzada',
                },
                {
                  type: 'Co-requisito',
                  code: 'MAT-201',
                  name: 'Matemáticas Discretas',
                },
              ]}
            />

            {/* Tarjeta de Evaluación */}
            <InfoCard
              title="Sistema de Evaluación"
              type="evaluation"
              initialContent={[
                { label: 'Exámenes parciales', value: '30%' },
                { label: 'Proyecto integrador', value: '35%' },
                { label: 'Prácticas de laboratorio', value: '20%' },
                { label: 'Participación', value: '15%' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface InfoCardProps {
  asignaturaId?: string
  clave?: string
  title: string
  initialContent: any
  placeholder?: string
  description?: string
  required?: boolean // Nueva prop para el asterisco
  type?: 'text' | 'requirements' | 'evaluation'
  onEnhanceAI?: (content: any) => void
  onPersist?: (clave: string, value: string) => void
}

function InfoCard({
  asignaturaId,
  clave,
  title,
  initialContent,
  placeholder,
  description,
  required,
  type = 'text',
  onPersist,
}: InfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState(initialContent)
  const [tempText, setTempText] = useState(initialContent)
  const navigate = useNavigate()
  const { planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  useEffect(() => {
    setData(initialContent)
    setTempText(initialContent)
  }, [initialContent])

  const handleSave = () => {
    console.log('clave, valor:', clave, String(tempText ?? ''))

    setData(tempText)
    setIsEditing(false)

    if (type === 'text' && clave && onPersist) {
      onPersist(clave, String(tempText ?? ''))
    }
  }

  const handleIARequest = (campoClave: string) => {
    console.log(placeholder)

    navigate({
      to: '/planes/$planId/asignaturas/$asignaturaId/iaasignatura',
      params: { planId, asignaturaId: asignaturaId! },
      state: {
        activeTab: 'ia',
        prefillCampo: campoClave,
        prefillContenido: data,
      } as any,
    })
  }

  return (
    <Card className="overflow-hidden transition-all hover:border-slate-300">
      <TooltipProvider>
        <CardHeader className="border-b bg-slate-50/50 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="cursor-help text-sm font-bold text-slate-700">
                    {title}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {description || 'Información del campo'}
                </TooltipContent>
              </Tooltip>

              {required && (
                <span
                  className="text-sm font-bold text-red-500"
                  title="Requerido"
                >
                  *
                </span>
              )}
            </div>

            {!isEditing && (
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:bg-blue-100"
                      onClick={() => clave && handleIARequest(clave)}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mejorar con IA</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar campo</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardHeader>
      </TooltipProvider>

      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={tempText}
              placeholder={placeholder}
              onChange={(e) => setTempText(e.target.value)}
              className="min-h-[120px] text-sm leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-[#00a878] hover:bg-[#008f66]"
                onClick={handleSave}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm leading-relaxed text-slate-600">
            {type === 'text' &&
              (data ? (
                <p className="whitespace-pre-wrap">{data}</p>
              ) : (
                <p className="text-slate-400 italic">Sin información.</p>
              ))}
            {type === 'requirements' && <RequirementsView items={data} />}
            {type === 'evaluation' && <EvaluationView items={data} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Vista de Requisitos
function RequirementsView({ items }: { items: Array<any> }) {
  return (
    <div className="space-y-3">
      {items.map((req, i) => (
        <div
          key={i}
          className="rounded-lg border border-slate-100 bg-slate-50 p-3"
        >
          <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
            {req.type}
          </p>
          <p className="text-sm font-medium text-slate-700">
            {req.code} {req.name}
          </p>
        </div>
      ))}
    </div>
  )
}

// Vista de Evaluación
function EvaluationView({ items }: { items: Array<any> }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex justify-between border-b border-slate-50 pb-1.5 text-sm italic"
        >
          <span className="text-slate-500">{item.label}</span>
          <span className="font-bold text-blue-600">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
