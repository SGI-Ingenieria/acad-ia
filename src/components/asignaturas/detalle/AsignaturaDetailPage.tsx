import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { ArrowLeft, GraduationCap, Pencil, Sparkles } from 'lucide-react'
import { useCallback, useState, useEffect } from 'react'

import { BibliographyItem } from './BibliographyItem'
import { ContenidoTematico } from './ContenidoTematico'
import { DocumentoSEPTab } from './DocumentoSEPTab'
import { HistorialTab } from './HistorialTab'
import { IAAsignaturaTab } from './IAAsignaturaTab'

import type { AsignaturaDetail } from '@/data'
import type {
  CampoEstructura,
  IAMessage,
  IASugerencia,
} from '@/types/asignatura'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSubject, useUpdateAsignatura } from '@/data/hooks/useSubjects'
import {
  mockAsignatura,
  mockEstructura,
  mockDocumentoSep,
} from '@/data/mockAsignaturaData'

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseContenidoTematicoToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return ''

  const blocks: Array<string> = []

  for (const item of value) {
    if (!isRecord(item)) continue

    const unidad =
      typeof item.unidad === 'number' && Number.isFinite(item.unidad)
        ? item.unidad
        : undefined
    const titulo = typeof item.titulo === 'string' ? item.titulo : ''

    const header = `${unidad ?? ''}${unidad ? '.' : ''} ${titulo}`.trim()
    if (!header) continue

    const lines: Array<string> = [header]

    const temas = Array.isArray(item.temas) ? item.temas : []
    temas.forEach((tema, idx) => {
      const temaNombre =
        typeof tema === 'string'
          ? tema
          : isRecord(tema) && typeof tema.nombre === 'string'
            ? tema.nombre
            : ''
      if (!temaNombre) return

      if (unidad != null) {
        lines.push(`${unidad}.${idx + 1} ${temaNombre}`.trim())
      } else {
        lines.push(`${idx + 1}. ${temaNombre}`)
      }
    })

    blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n').trimEnd()
}

const columnParsers: Partial<Record<string, (value: unknown) => string>> = {
  contenido_tematico: parseContenidoTematicoToPlainText,
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
  const [asignatura, setAsignatura] = useState<AsignaturaDetail | null>(null)
  const [campos] = useState<Array<CampoEstructura>>([])
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
    const baseDatos = asignatura?.datos ?? (asignaturaApi as any)?.datos ?? {}
    const mergedDatos = { ...baseDatos, [clave]: value }

    // Mantener estado local coherente para merges posteriores.
    setAsignatura((prev) => ({
      ...((prev ?? asignaturaApi ?? {}) as any),
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
    if (asignaturaApi) setAsignatura(asignaturaApi)
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

  const handleAcceptSuggestion = (_sugerencia: IASugerencia) => {
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

  return (
    <div className="w-full">
      {/* ================= HEADER ACTUALIZADO ================= */}
      <section className="bg-linear-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            to="/planes/$planId/asignaturas"
            params={{ planId }}
            className="mb-4 flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al plan
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              {/* CÓDIGO EDITABLE */}
              <Badge className="border border-blue-700 bg-blue-900/50">
                <EditableHeaderField
                  value={headerData.codigo}
                  onSave={(val) => handleUpdateHeader('codigo', val)}
                />
              </Badge>

              {/* NOMBRE EDITABLE */}
              <h1 className="text-3xl font-bold">
                <EditableHeaderField
                  value={headerData.nombre}
                  onSave={(val) => handleUpdateHeader('nombre', val)}
                />
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span className="text-blue-100">
                    {(() => {
                      const datosPlan = asignaturaApi?.planes_estudio?.datos
                      return isRecord(datosPlan)
                        ? String((datosPlan as any).nombre ?? '')
                        : ''
                    })()}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <span className="text-blue-100">
                    {asignaturaApi?.planes_estudio?.carreras?.facultades
                      ?.nombre || ''}
                  </span>
                </span>
              </div>

              <p className="text-sm text-blue-300">
                Pertenece al plan:{' '}
                <span className="cursor-pointer underline">
                  {asignaturaApi?.planes_estudio?.nombre}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {/* CRÉDITOS EDITABLES */}
              <Badge variant="secondary" className="gap-1">
                <span className="inline-flex max-w-fit">
                  <EditableHeaderField
                    value={headerData.creditos}
                    onSave={(val) =>
                      handleUpdateHeader('creditos', parseInt(val) || 0)
                    }
                  />
                </span>
                <span>créditos</span>
              </Badge>

              {/* SEMESTRE EDITABLE */}
              <Badge variant="secondary" className="gap-1">
                <EditableHeaderField
                  value={headerData.ciclo}
                  onSave={(val) =>
                    handleUpdateHeader('ciclo', parseInt(val) || 0)
                  }
                />
                <span>° ciclo</span>
              </Badge>

              <Badge variant="secondary">{asignaturaApi?.tipo}</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TABS ================= */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="h-auto gap-6 bg-transparent p-0">
              <TabsTrigger value="datos">Datos generales</TabsTrigger>
              <TabsTrigger value="contenido">Contenido temático</TabsTrigger>
              <TabsTrigger value="bibliografia">Bibliografía</TabsTrigger>
              <TabsTrigger value="ia">IA de la asignatura</TabsTrigger>
              <TabsTrigger value="sep">Documento SEP</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <Separator className="mt-2" />

            {/* ================= TAB: DATOS GENERALES ================= */}
            <TabsContent value="datos">
              <DatosGenerales
                data={asignatura ?? asignaturaApi ?? null}
                isLoading={loadingAsig}
                asignaturaId={asignaturaId}
                onPersistDato={handlePersistDatoGeneral}
              />
            </TabsContent>

            <TabsContent value="contenido">
              <ContenidoTematico
                asignaturaId={asignaturaId}
                data={asignaturaApi ?? null}
                isLoading={loadingAsig}
              ></ContenidoTematico>
            </TabsContent>

            <TabsContent value="bibliografia">
              <BibliographyItem
                bibliografia={bibliografia}
                id={asignaturaId}
                onSave={handleSaveBibliografia}
                isSaving={isSaving}
              />
            </TabsContent>

            <TabsContent value="ia">
              <IAAsignaturaTab
                campos={campos}
                asignatura={(asignatura ?? asignaturaApi ?? {}) as any}
                messages={messages}
                onSendMessage={handleSendMessage}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={
                  (_id) =>
                    console.log(
                      'Rechazada',
                    ) /* toast.error("Sugerencia rechazada")*/
                }
              />
            </TabsContent>

            <TabsContent value="sep">
              <DocumentoSEPTab
                documento={mockDocumentoSep}
                estructura={mockEstructura}
                asignatura={mockAsignatura}
                datosGenerales={(asignatura as any)?.datos ?? {}}
                onRegenerate={handleRegenerateDocument}
                isRegenerating={isRegenerating}
              />
            </TabsContent>

            <TabsContent value="historial">
              <HistorialTab asignaturaId={asignaturaId} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

/* ================= TAB CONTENT ================= */
interface DatosGeneralesProps {
  asignaturaId: string
  data: AsignaturaDetail | null
  isLoading: boolean
  onPersistDato: (clave: string, value: string) => void
}
function DatosGenerales({
  data,
  isLoading,
  asignaturaId,
  onPersistDato,
}: DatosGeneralesProps) {
  // 1. Extraemos la definición de la estructura (los metadatos)
  const definicionRaw = data?.estructuras_asignatura?.definicion
  const definicion = isRecord(definicionRaw)
    ? (definicionRaw as Record<string, unknown>)
    : null

  const propertiesRaw = definicion ? (definicion as any).properties : undefined
  const structureProps = isRecord(propertiesRaw)
    ? (propertiesRaw as Record<string, any>)
    : {}

  // 2. Extraemos los valores reales (el contenido redactado)
  const datosRaw = data?.datos
  const valoresActuales = isRecord(datosRaw)
    ? (datosRaw as Record<string, any>)
    : {}

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
          {isLoading && <p>Cargando información...</p>}

          {!isLoading &&
            Object.entries(structureProps).map(
              ([key, config]: [string, any]) => {
                // 1. METADATOS (Vienen de structureProps -> config)
                const cardTitle = config.title || key
                const description = config.description || ''

                const xColumn =
                  typeof config?.['x-column'] === 'string'
                    ? config['x-column']
                    : undefined

                // Obtenemos el placeholder del arreglo 'examples' de la estructura
                const placeholder =
                  config.examples && config.examples.length > 0
                    ? config.examples[0]
                    : ''

                const valActual = valoresActuales[key]

                let currentContent = valActual ?? ''

                if (xColumn) {
                  const rawValue = (data as any)?.[xColumn]
                  const parser = columnParsers[xColumn]
                  currentContent = parser
                    ? parser(rawValue)
                    : String(rawValue ?? '')
                }

                return (
                  <InfoCard
                    asignaturaId={asignaturaId}
                    key={key}
                    clave={key}
                    title={cardTitle}
                    initialContent={currentContent} // Si es igual a la descripción de la SEP, pasamos vacío
                    xColumn={xColumn}
                    placeholder={placeholder} // Aquí irá "Primer semestre", "MAT-101", etc.
                    description={description} // El texto largo de "Indicar el ciclo..."
                    onEnhanceAI={(contenido) => console.log(contenido)}
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
  xColumn?: string
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
  xColumn,
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
      to: '/planes/$planId/asignaturas/$asignaturaId',
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
                      onClick={() => {
                        // Si esta InfoCard proviene de una columna externa (ej: contenido_tematico),
                        // redirigimos a la pestaña de Contenido en vez de editar inline.
                        if (xColumn === 'contenido_tematico') {
                          navigate({
                            to: '/planes/$planId/asignaturas/$asignaturaId',
                            params: { planId, asignaturaId: asignaturaId! },
                            state: { activeTab: 'contenido' } as any,
                          })
                          return
                        }

                        setIsEditing(true)
                      }}
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
              className="min-h-30 text-sm leading-relaxed"
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
