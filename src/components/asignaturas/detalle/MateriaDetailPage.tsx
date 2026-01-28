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
import { IAMateriaTab } from './IAMateriaTab'

import type { CampoEstructura, IAMessage, IASugerencia } from '@/types/materia'

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
import { useSubject } from '@/data/hooks/useSubjects'
import {
  mockMateria,
  mockEstructura,
  mockDocumentoSep,
} from '@/data/mockMateriaData'

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
  component: MateriaDetailPage,
})

export default function MateriaDetailPage() {
  const routerState = useRouterState()
  const state = routerState.location.state as any
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { data: asignaturasApi, isLoading: loadingAsig } =
    useSubject(asignaturaId)
  // 1. Asegúrate de tener estos estados en tu componente principal
  const [messages, setMessages] = useState<Array<IAMessage>>([])
  const [datosGenerales, setDatosGenerales] = useState({})
  const [campos, setCampos] = useState<Array<CampoEstructura>>([])
  const [activeTab, setActiveTab] = useState('datos')

  // Dentro de MateriaDetailPage
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
    if (asignaturasApi) {
      setHeaderData({
        codigo: asignaturasApi.codigo ?? '',
        nombre: asignaturasApi.nombre,
        creditos: asignaturasApi.creditos,
        ciclo: asignaturasApi.numero_ciclo ?? 0,
      })
    }
  }, [asignaturasApi])

  const handleUpdateHeader = (key: string, value: string | number) => {
    const newData = { ...headerData, [key]: value }
    setHeaderData(newData)
    console.log('💾 Guardando en estado y base de datos:', key, value)
  }
  /* ---------- sincronizar API ---------- */
  useEffect(() => {
    if (asignaturasApi?.datos) {
      setDatosGenerales(asignaturasApi)
    }
  }, [asignaturasApi])

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
    // Lógica para actualizar el valor del campo en tu estado de datosGenerales
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
      <section className="bg-gradient-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
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
                  {/* Eliminamos el max-w y dejamos que el flex-wrap haga su trabajo */}
                  <EditableHeaderField
                    value={asignaturasApi?.planes_estudio?.datos?.nombre || ''}
                    onSave={(val) => handleUpdateHeader('plan_nombre', val)}
                    className="min-w-[10ch] text-blue-100" // min-w para que sea clickeable si está vacío
                  />
                </span>
                <span className="flex items-center gap-1">
                  <EditableHeaderField
                    value={
                      asignaturasApi?.planes_estudio?.carreras?.facultades
                        ?.nombre || ''
                    }
                    onSave={(val) => handleUpdateHeader('facultad_nombre', val)}
                    className="min-w-[10ch] text-blue-100"
                  />
                </span>
              </div>

              <p className="text-sm text-blue-300">
                Pertenece al plan:{' '}
                <span className="cursor-pointer underline">
                  {asignaturasApi?.planes_estudio?.nombre}
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

              <Badge variant="secondary">{asignaturasApi?.tipo}</Badge>
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
              <TabsTrigger value="ia">IA de la materia</TabsTrigger>
              <TabsTrigger value="sep">Documento SEP</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <Separator className="mt-2" />

            {/* ================= TAB: DATOS GENERALES ================= */}
            <TabsContent value="datos">
              <DatosGenerales
                data={datosGenerales}
                isLoading={loadingAsig}
                asignaturaId={asignaturaId}
              />
            </TabsContent>

            <TabsContent value="contenido">
              <ContenidoTematico
                data={asignaturasApi}
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
              <IAMateriaTab
                campos={campos}
                datosGenerales={datosGenerales}
                messages={messages}
                onSendMessage={handleSendMessage}
                onAcceptSuggestion={handleAcceptSuggestion}
                onRejectSuggestion={
                  (id) =>
                    console.log(
                      'Rechazada',
                    ) /* toast.error("Sugerencia rechazada")*/
                }
              />
            </TabsContent>

            <TabsContent value="sep">
              <DocumentoSEPTab
                documento={mockDocumentoSep}
                materia={mockMateria}
                estructura={mockEstructura}
                datosGenerales={datosGenerales}
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
  data: AsignaturaDatos
  isLoading: boolean
}
function DatosGenerales({
  data,
  isLoading,
  asignaturaId,
}: DatosGeneralesProps) {
  const formatTitle = (key: string): string =>
    key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())

  // 1. Extraemos la definición de la estructura (los metadatos)
  const structureProps =
    data?.estructuras_asignatura?.definicion?.properties || {}

  // 2. Extraemos los valores reales (el contenido redactado)
  const valoresActuales = data?.datos || {}

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

                // Obtenemos el placeholder del arreglo 'examples' de la estructura
                const placeholder =
                  config.examples && config.examples.length > 0
                    ? config.examples[0]
                    : ''

                // 2. CONTENIDO REAL (Viene de data.datos -> valoresActuales)
                // El problema: Si 'description' en 'datos' es igual a la de la 'estructura',
                // el usuario aún no ha redactado nada real.

                const valActual = valoresActuales[key]

                // Lógica para determinar si mostrar el contenido o dejarlo vacío (para que salga el placeholder)
                // Si el contenido en 'datos' es idéntico a la instrucción de la 'estructura',
                // asumimos que no hay contenido real todavía.
                const isContentEmpty =
                  !valActual?.description ||
                  valActual.description === config.description

                const currentContent = valActual.description ?? ''

                return (
                  <InfoCard
                    asignaturaId={asignaturaId}
                    key={key}
                    clave={key}
                    title={cardTitle}
                    initialContent={currentContent} // Si es igual a la descripción de la SEP, pasamos vacío
                    placeholder={placeholder} // Aquí irá "Primer semestre", "MAT-101", etc.
                    description={description} // El texto largo de "Indicar el ciclo..."
                    onEnhanceAI={(contenido) => console.log(contenido)}
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
}: InfoCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [data, setData] = useState(initialContent)
  const [tempText, setTempText] = useState(initialContent)
  const navigate = useNavigate()

  useEffect(() => {
    setData(initialContent)
    setTempText(initialContent)
  }, [initialContent])

  const handleSave = () => {
    setData(tempText)
    setIsEditing(false)
    // Aquí iría tu lógica de guardado a la DB
  }

  const handleIARequest = (campoClave: string) => {
    console.log(placeholder)

    navigate({
      to: '/planes/$planId/asignaturas/$asignaturaId',
      params: { asignaturaId: asignaturaId! },
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
                      onClick={() => handleIARequest(clave)}
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
                <p className="text-slate-400 italic">
                  Sin información. Ejemplo: {placeholder}
                </p>
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
