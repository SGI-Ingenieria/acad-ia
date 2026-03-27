/* eslint-disable jsx-a11y/label-has-associated-control */
import { createFileRoute } from '@tanstack/react-router'
import { Plus, AlertTriangle, Trash2, Download } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useMemo, useState, useEffect, Fragment } from 'react'

import type { TipoAsignatura } from '@/data'
import type { Asignatura, LineaCurricular } from '@/types/plan'

import { AlertaConflicto } from '@/components/asignaturas/detalle/mapa/AlertaConflicto'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useAsignaturaConflictos,
  useCreateLinea,
  useDeleteLinea,
  usePlan,
  usePlanAsignaturas,
  usePlanLineas,
  useUpdateAsignatura,
  useUpdateLinea,
} from '@/data'

// --- Mapeadores (Fuera del componente para mayor limpieza) ---
const palette = [
  '#4F46E5', // índigo
  '#7C3AED', // violeta
  '#EA580C', // naranja
  '#059669', // esmeralda
  '#DC2626', // rojo
  '#0891B2', // cyan
  '#CA8A04', // ámbar
  '#C026D3', // fucsia
]

const mapLineasToLineaCurricular = (
  lineasApi: Array<any> = [],
): Array<LineaCurricular> => {
  return lineasApi.map((linea, index) => ({
    id: linea.id,
    nombre: linea.nombre,
    orden: linea.orden ?? 0,
    color: palette[index % palette.length],
  }))
}

const mapAsignaturasToAsignaturas = (
  asigApi: Array<any> = [],
): Array<Asignatura> => {
  return asigApi.map((asig) => {
    return {
      id: asig.id,
      clave: asig.codigo,
      nombre: asig.nombre,
      creditos: asig.creditos ?? 0,
      ciclo: asig.numero_ciclo ?? null,
      lineaCurricularId: asig.linea_plan_id ?? null,
      tipo: asig.tipo,
      estado: 'borrador',
      orden: asig.orden_celda ?? 0,
      // Mapeo directo de los nuevos campos de la API
      hd: asig.horas_academicas ?? 0,
      hi: asig.horas_independientes ?? 0,
      prerrequisito_asignatura_id: asig.prerrequisito_asignatura_id ?? null,
    }
  })
}

// --- Subcomponentes ---
function StatItem({
  label,
  value,
  total,
}: {
  label: string
  value: number
  total?: number
}) {
  return (
    <div className="border-border/70 bg-background/75 rounded-xl border p-3">
      <span className="text-muted-foreground block text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground mt-1 block text-lg leading-none font-bold">
        {value}
        {total ? (
          <span className="text-muted-foreground ml-1 text-sm font-medium">
            /{total}
          </span>
        ) : (
          ''
        )}
      </span>
    </div>
  )
}

const estadoConfig: Record<
  Asignatura['estado'],
  {
    label: string
    dot: string
    soft: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  borrador: {
    label: 'Borrador',
    dot: 'bg-slate-500',
    soft: 'bg-slate-100 text-slate-700',
    icon: Icons.FileText,
  },
  revisada: {
    label: 'Revisada',
    dot: 'bg-amber-500',
    soft: 'bg-amber-100 text-amber-700',
    icon: Icons.ScanSearch,
  },
  aprobada: {
    label: 'Aprobada',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-100 text-emerald-700',
    icon: Icons.BadgeCheck,
  },
  generando: {
    label: 'Generando',
    dot: 'bg-sky-500',
    soft: 'bg-sky-100 text-sky-700',
    icon: Icons.LoaderCircle,
  },
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function AsignaturaCardItem({
  asignatura,
  lineaColor,
  lineaNombre,
  onDragStart,
  isDragging,
  onClick,
}: {
  asignatura: Asignatura
  lineaColor: string
  lineaNombre?: string
  onDragStart: (e: React.DragEvent, id: string) => void
  isDragging: boolean
  onClick: () => void
}) {
  const estado = estadoConfig[asignatura.estado]
  const EstadoIcon = estado.icon

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            draggable
            onDragStart={(e) => onDragStart(e, asignatura.id)}
            onClick={onClick}
            className={[
              'group relative h-50 w-40 shrink-0 overflow-hidden rounded-[22px] border text-left',
              'transition-all duration-300 ease-out',
              'focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none',
              'cursor-grab active:cursor-grabbing',
              isDragging
                ? 'scale-[0.985] opacity-45 shadow-none'
                : 'hover:-translate-y-1 hover:shadow-lg',
            ].join(' ')}
            style={{
              borderColor: hexToRgba(lineaColor, 0.18),
              background: `
                radial-gradient(circle at top right, ${hexToRgba(lineaColor, 0.22)} 0%, transparent 34%),
                linear-gradient(180deg, ${hexToRgba(lineaColor, 0.12)} 0%, ${hexToRgba(lineaColor, 0.04)} 42%, var(--card) 100%)
              `,
            }}
            title={asignatura.nombre}
          >
            {/* franja */}
            <div
              className="absolute inset-x-0 top-0 h-2"
              style={{ backgroundColor: lineaColor }}
            />

            {/* glow decorativo */}
            <div
              className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl"
              style={{ backgroundColor: hexToRgba(lineaColor, 0.22) }}
            />

            <div className="relative flex h-full flex-col p-4">
              {/* top */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className="inline-flex h-8 max-w-32 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold"
                  style={{
                    borderColor: hexToRgba(lineaColor, 0.2),
                    backgroundColor: hexToRgba(lineaColor, 0.1),
                    color: lineaColor,
                  }}
                >
                  <Icons.KeyRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {asignatura.clave || 'Sin clave'}
                  </span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-background/70 flex h-8 items-center rounded-full px-2 backdrop-blur-sm">
                      <EstadoIcon className="text-foreground/65 h-3.5 w-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs font-semibold">
                      {estado.label}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* titulo */}
              <div className="mt-4 min-h-18">
                <h3
                  className="text-foreground text-md overflow-hidden leading-[1.08]"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {asignatura.nombre}
                </h3>
              </div>

              {/* bottom */}
              <div className="mt-auto grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/40 bg-white/55 px-2.5 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Icons.Award className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium tracking-wide uppercase">
                      CR
                    </span>
                  </div>
                  <div className="text-foreground text-sm font-bold">
                    {asignatura.creditos}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/55 px-2.5 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Icons.Clock3 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium tracking-wide uppercase">
                      HD
                    </span>
                  </div>
                  <div className="text-foreground text-sm font-bold">
                    {asignatura.hd}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/55 px-2.5 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Icons.BookOpenText className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium tracking-wide uppercase">
                      HI
                    </span>
                  </div>
                  <div className="text-foreground text-sm font-bold">
                    {asignatura.hi}
                  </div>
                </div>
              </div>

              {/* drag affordance */}
              <div className="bg-background/70 pointer-events-none absolute right-3 bottom-3 rounded-full p-1.5 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                <Icons.GripVertical className="text-muted-foreground/55 h-4 w-4" />
              </div>
            </div>
          </button>
        </TooltipTrigger>

        <TooltipContent side="bottom">
          <div className="text-lg">
            {/* ciclo */}
            {asignatura.ciclo ? (
              <span className="font-bold">C{asignatura.ciclo} · </span>
            ) : null}
            {lineaNombre ? (
              <span className="font-medium">{lineaNombre} · </span>
            ) : null}
            {asignatura.nombre}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const Route = createFileRoute('/planes/$planId/_detalle/mapa')({
  component: MapaCurricularPage,
})

function MapaCurricularPage() {
  const { planId } = Route.useParams() // Idealmente usa el ID de la ruta
  const { data } = usePlan(planId)
  const [totalCiclos, setTotalCiclos] = useState(0)
  const [editingLineaId, setEditingLineaId] = useState<string | null>(null)
  const { mutate: createLinea } = useCreateLinea()
  const { mutate: updateLineaApi } = useUpdateLinea()
  const { mutate: deleteLineaApi } = useDeleteLinea()
  const { data: asignaturaApi, isLoading: loadingAsig } =
    usePlanAsignaturas(planId)
  const { data: lineasApi, isLoading: loadingLineas } = usePlanLineas(planId)
  const [asignaturas, setAsignaturas] = useState<Array<Asignatura>>([])
  const [lineas, setLineas] = useState<Array<LineaCurricular>>([])
  const [draggedAsignatura, setDraggedAsignatura] = useState<string | null>(
    null,
  )
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [nombreNuevaLinea, setNombreNuevaLinea] = useState('') // Para el input de nombre personalizado
  const { mutate: updateAsignatura } = useUpdateAsignatura()
  const { validarCambioCiclo } = useAsignaturaConflictos()
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    resolve: (value: boolean) => void
    mensaje: string
  } | null>(null)

  const validarConInterrupcion = async (
    asignaturaId: string,
    nuevoCiclo: number,
  ): Promise<boolean> => {
    const asignatura = asignaturas.find((a) => a.id === asignaturaId)
    if (!asignatura) return true

    // Buscamos las materias que causan el conflicto
    const materiasConflicto = asignaturas.filter((a) => {
      const esPrerrequisitoConflictivo =
        asignatura.prerrequisito_asignatura_id === a.id &&
        (a.ciclo ?? 0) >= nuevoCiclo

      const esDependienteConflictiva =
        a.prerrequisito_asignatura_id === asignatura.id &&
        (a.ciclo ?? 0) <= nuevoCiclo &&
        a.ciclo !== null

      return esPrerrequisitoConflictivo || esDependienteConflictiva
    })

    if (materiasConflicto.length === 0) return true

    // Extraemos solo los nombres para la lista visual
    const listaNombres = materiasConflicto.map((m) => m.nombre)

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        resolve,
        // Guardamos la lista de nombres en el mensaje de forma que podamos procesarla
        mensaje: JSON.stringify({
          main: `Mover "${asignatura.nombre}" al ciclo ${nuevoCiclo} genera conflictos con:`,
          materias: listaNombres,
        }),
      })
    })
  }

  useEffect(() => {
    if (data?.numero_ciclos) {
      setTotalCiclos(data.numero_ciclos)
    }
  }, [data])

  const handleCambioCicloSeguro = async (
    asignatura: Asignatura,
    nuevoCiclo: number,
  ) => {
    // 1. Esperamos la interacción del usuario
    const acepto = await validarConInterrupcion(asignatura.id, nuevoCiclo)

    // 2. Limpiamos el estado del modal ANTES de seguir
    setConfirmState(null)

    // 3. Verificamos la respuesta
    if (acepto === false) {
      return // Detenemos la ejecución aquí
    }

    // 4. Solo si acepto es true, ejecutamos la API
    const patch = { numero_ciclo: nuevoCiclo }
    updateAsignatura(
      { asignaturaId: asignatura.id, patch: patch as any },
      {
        onSuccess: () => {
          setAsignaturas((prev) =>
            prev.map((m) =>
              m.id === asignatura.id ? { ...m, ciclo: nuevoCiclo } : m,
            ),
          )
        },
        onError: (err) => {
          console.error('Error al actualizar:', err)
        },
      },
    )
  }

  const manejarAgregarLinea = (nombre: string) => {
    const nombreNormalizado = nombre.trim()
    if (!nombreNormalizado) return
    const nombreBusqueda = nombreNormalizado
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    const yaExiste = lineas.some((l) => {
      const lineaExistente = l.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return lineaExistente === nombreBusqueda
    })

    if (yaExiste) {
      alert(`La línea "${nombreNormalizado}" ya existe en este plan.`)
      return
    }
    const maxOrden = lineas.reduce((max, l) => Math.max(max, l.orden || 0), 0)
    createLinea(
      {
        nombre: nombreNormalizado,
        plan_estudio_id: planId,
        orden: maxOrden + 1,
        area: 'sin asignar',
      },
      {
        onSuccess: (nueva) => {
          const mapeada = {
            id: nueva.id,
            nombre: nueva.nombre,
            orden: nueva.orden,
            color: '#1976d2',
          }
          setLineas((prev) => [...prev, mapeada])
          setNombreNuevaLinea('')
        },
      },
    )
  }
  const guardarEdicionLinea = (id: string, nuevoNombre: string) => {
    const nombreAFijar = nuevoNombre.trim()

    if (!nombreAFijar) {
      setEditingLineaId(null)
      return
    }

    updateLineaApi(
      {
        lineaId: id,
        patch: { nombre: nombreAFijar },
      },
      {
        onSuccess: (lineaActualizada) => {
          setLineas((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, nombre: lineaActualizada.nombre } : l,
            ),
          )
          setEditingLineaId(null)
        },
        onError: (err) => {
          console.error('Error al actualizar linea:', err)
          // Opcional: revertir cambios o avisar al usuario
        },
      },
    )
  }
  const tieneAreaComun = useMemo(() => {
    return lineas.some(
      (l) =>
        l.nombre.toLowerCase() === 'área común' ||
        l.nombre.toLowerCase() === 'area comun',
    )
  }, [lineas])

  useEffect(() => {
    if (asignaturaApi)
      setAsignaturas(mapAsignaturasToAsignaturas(asignaturaApi))
  }, [asignaturaApi])

  useEffect(() => {
    if (lineasApi) setLineas(mapLineasToLineaCurricular(lineasApi))
  }, [lineasApi])

  const ciclosTotales = Number(totalCiclos)
  const ciclosArray = Array.from({ length: ciclosTotales }, (_, i) => i + 1)
  const [editingData, setEditingData] = useState<Asignatura | null>(null)
  const handleIntegerChange = (value: string) => {
    if (value === '') return value

    // Solo números, máximo 3 cifras
    const regex = /^\d{1,3}$/

    if (!regex.test(value)) return null

    return value
  }
  const handleDecimalChange = (value: string, max?: number): string | null => {
    if (value === '') return ''

    const val = value.replace(',', '.')
    const regex = /^\d*\.?\d{0,2}$/
    if (!regex.test(val)) return null
    if (max !== undefined) {
      const num = Number(val)
      if (!isNaN(num) && num > max) {
        return max.toFixed(2)
      }
    }

    return val
  }

  const procesarCambioAsignatura = async (
    asignaturaId: string,
    nuevosDatos: Partial<Asignatura>,
  ) => {
    const asignaturaOriginal = asignaturas.find((a) => a.id === asignaturaId)
    if (!asignaturaOriginal) return

    // ¿Cambió el ciclo? Si es así, validamos seriación
    if (
      nuevosDatos.ciclo !== undefined &&
      nuevosDatos.ciclo !== asignaturaOriginal.ciclo
    ) {
      const acepto = await validarConInterrupcion(
        asignaturaId,
        nuevosDatos.ciclo,
      )
      setConfirmState(null)
      if (!acepto) return // El usuario canceló, no guardamos nada
    }

    // Si llegamos aquí, o no cambió el ciclo o el usuario aceptó el conflicto
    const patch = {
      nombre: nuevosDatos.nombre ?? asignaturaOriginal.nombre,
      codigo: nuevosDatos.clave ?? asignaturaOriginal.clave,
      numero_ciclo: nuevosDatos.ciclo,
      linea_plan_id: nuevosDatos.lineaCurricularId,
      creditos: nuevosDatos.creditos,
      horas_academicas: nuevosDatos.hd,
      horas_independientes: nuevosDatos.hi,
      prerrequisito_asignatura_id: nuevosDatos.prerrequisito_asignatura_id,
      tipo: nuevosDatos.tipo?.toUpperCase() as TipoAsignatura,
    }

    updateAsignatura(
      { asignaturaId, patch: patch as any },
      {
        onSuccess: () => {
          setAsignaturas((prev) =>
            prev.map((m) =>
              m.id === asignaturaId ? { ...m, ...nuevosDatos } : m,
            ),
          )
          setIsEditModalOpen(false) // Cerramos el modal si estaba abierto
        },
        onError: (err) => console.error('Error al guardar:', err),
      },
    )
  }
  const handleSaveChanges = () => {
    if (!editingData) return

    // Llamamos a la lógica centralizada que incluye la alerta
    procesarCambioAsignatura(editingData.id, editingData)
  }
  const unassignedAsignaturas = asignaturas.filter(
    (m) => m.ciclo === null || m.lineaCurricularId === null,
  )
  const unassignedCount = unassignedAsignaturas.length

  const borrarLinea = (id: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar esta línea? Las materias asignadas volverán a la bandeja de entrada.',
      )
    ) {
      return
    }

    deleteLineaApi(id, {
      onSuccess: () => {
        // Primero: Las materias que estaban en esa línea pasan a ser "huérfanas"
        setAsignaturas((prev) =>
          prev.map((asig) =>
            asig.lineaCurricularId === id
              ? { ...asig, ciclo: null, lineaCurricularId: null }
              : asig,
          ),
        )
        setLineas((prev) => prev.filter((l) => l.id !== id))
      },
      onError: (error) => {
        console.error(error)
        alert('No se pudo eliminar la línea. Verifica si tiene dependencias.')
      },
    })
  }

  // --- Selectores/Cálculos ---
  const getTotalesCiclo = (cicloNumero: number) => {
    return asignaturas
      .filter((m) => m.ciclo === cicloNumero)
      .reduce(
        (acc, m) => ({
          cr: acc.cr + (m.creditos || 0),
          hd: acc.hd + (m.hd || 0),
          hi: acc.hi + (m.hi || 0),
        }),
        { cr: 0, hd: 0, hi: 0 },
      )
  }

  const getSubtotalLinea = (lineaId: string) => {
    return asignaturas
      .filter((m) => m.lineaCurricularId === lineaId && m.ciclo !== null) // Aseguramos que pertenezca a la línea Y tenga ciclo
      .reduce(
        (acc, m) => ({
          cr: acc.cr + (m.creditos || 0),
          hd: acc.hd + (m.hd || 0),
          hi: acc.hi + (m.hi || 0),
        }),
        { cr: 0, hd: 0, hi: 0 },
      )
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedAsignatura(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (
    e: React.DragEvent,
    cicloDestino: number | null,
    lineaId: string | null,
  ) => {
    e.preventDefault()
    if (!draggedAsignatura) return

    // Solo disparamos la lógica si realmente hay un cambio de posición
    procesarCambioAsignatura(draggedAsignatura, {
      ciclo: cicloDestino,
      lineaCurricularId: lineaId,
    })

    setDraggedAsignatura(null)
  }

  const stats = useMemo(
    () =>
      asignaturas.reduce(
        (acc, m) => {
          if (m.ciclo !== null) {
            acc.cr += m.creditos || 0
            acc.hd += m.hd || 0
            acc.hi += m.hi || 0
          }
          return acc
        },
        { cr: 0, hd: 0, hi: 0 },
      ),
    [asignaturas],
  )

  const confirmarEdicionLinea = (id: string, nuevoNombreRaw: string) => {
    const nuevoNombre = nuevoNombreRaw.trim()
    const lineaOriginal = lineas.find((l) => l.id === id)

    if (!nuevoNombre) {
      setEditingLineaId(null)
      return
    }

    if (nuevoNombre !== lineaOriginal?.nombre) {
      guardarEdicionLinea(id, nuevoNombre)
      return
    }

    setEditingLineaId(null)
  }

  if (loadingAsig || loadingLineas)
    return <div className="p-10 text-center">Cargando mapa curricular...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-border bg-card/70 rounded-2xl border p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold">Mapa Curricular</h2>
            <p className="text-muted-foreground text-sm">
              Organiza las asignaturas de la petición por línea y ciclo
            </p>

            {unassignedCount > 0 && (
              <Badge className="border-border bg-accent/50 text-accent-foreground hover:bg-accent/50 mt-2 inline-flex">
                <AlertTriangle size={14} className="mr-1" />
                {unassignedCount} sin asignar
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-start gap-2 lg:justify-end">
            <Button variant="outline" className="gap-2">
              <Download size={16} /> Exportar
            </Button>
            {!tieneAreaComun && (
              <Button
                variant="outline"
                className="text-primary border-primary/30 hover:bg-primary/8"
                onClick={() => manejarAgregarLinea('Área Común')}
              >
                + Área Común
              </Button>
            )}
          </div>

          <div className="border-border/70 bg-background/70 rounded-xl border p-3 lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <label className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Nueva Línea Curricular
                </label>
                <p className="text-muted-foreground text-xs">
                  Crea una línea personalizada sin abrir menús adicionales.
                </p>
              </div>

              <div className="flex w-full gap-2 sm:w-auto sm:min-w-90">
                <Input
                  value={nombreNuevaLinea}
                  onChange={(e) => setNombreNuevaLinea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nombreNuevaLinea.trim()) {
                      manejarAgregarLinea(nombreNuevaLinea)
                    }
                  }}
                  placeholder="Ej: Optativas"
                  className="h-9"
                />
                <Button
                  className="h-9 gap-1.5"
                  onClick={() => manejarAgregarLinea(nombreNuevaLinea)}
                  disabled={!nombreNuevaLinea.trim()}
                >
                  <Plus size={14} /> Agregar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra Totales */}
      <div className="border-border bg-card/60 mb-8 grid grid-cols-2 gap-3 rounded-2xl border p-3 shadow-sm md:grid-cols-4">
        <StatItem label="Total Créditos" value={stats.cr} total={320} />
        <StatItem label="Total HD" value={stats.hd} />
        <StatItem label="Total HI" value={stats.hi} />
        <StatItem label="Total Horas" value={stats.hd + stats.hi} />
      </div>

      <div className="overflow-x-auto pb-6">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `140px repeat(${ciclosTotales}, minmax(auto, 1fr)) 120px`,
          }}
        >
          <div className="text-muted-foreground self-end px-2 text-xs font-bold">
            LÍNEA CURRICULAR
          </div>

          {ciclosArray.map((n) => (
            <div
              key={`header-${n}`}
              className="bg-muted/70 text-muted-foreground border-border/70 rounded-xl border p-2 text-center text-sm font-bold"
            >
              Ciclo {n}
            </div>
          ))}

          <div className="text-muted-foreground self-end text-center text-xs font-bold">
            SUBTOTAL
          </div>

          {lineas.map((linea) => {
            const sub = getSubtotalLinea(linea.id)

            return (
              <Fragment key={linea.id}>
                <div
                  className={`group relative flex items-start justify-between gap-2 rounded-xl border p-3 transition-all ${editingLineaId === linea.id ? 'ring-primary/30 ring-2' : 'cursor-text'}`}
                  style={{
                    borderColor: hexToRgba(linea.color || '#1976d2', 0.24),
                    backgroundColor:
                      editingLineaId === linea.id
                        ? hexToRgba(linea.color || '#1976d2', 0.12)
                        : hexToRgba(linea.color || '#1976d2', 0.08),
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          contentEditable
                          role="textbox"
                          tabIndex={0}
                          aria-label={`Nombre de línea ${linea.nombre}`}
                          suppressContentEditableWarning
                          spellCheck={false}
                          onFocus={() => setEditingLineaId(linea.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              e.currentTarget.blur()
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              e.currentTarget.textContent = linea.nombre
                              e.currentTarget.blur()
                            }
                          }}
                          onBlur={(e) =>
                            confirmarEdicionLinea(
                              linea.id,
                              e.currentTarget.textContent,
                            )
                          }
                          className="text-foreground hover:text-foreground/85 block w-full cursor-text text-sm leading-snug wrap-break-word transition-colors outline-none"
                        >
                          {linea.nombre}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        {linea.nombre}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="ml-1 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label="Eliminar línea"
                      onClick={() => borrarLinea(linea.id)}
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {ciclosArray.map((cicloNumero) => (
                  <div
                    key={`${linea.id}-${cicloNumero}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cicloNumero, linea.id)}
                    className={`min-h-35 space-y-2 rounded-xl border border-dashed p-1.5 transition-colors ${
                      draggedAsignatura
                        ? 'border-primary/35 bg-primary/6'
                        : 'border-border/70 bg-muted/15'
                    }`}
                  >
                    {asignaturas
                      .filter(
                        (m) =>
                          m.ciclo === cicloNumero &&
                          m.lineaCurricularId === linea.id,
                      )
                      .map((m) => (
                        <AsignaturaCardItem
                          key={m.id}
                          asignatura={m}
                          lineaColor={linea.color || '#1976d2'}
                          lineaNombre={linea.nombre}
                          isDragging={draggedAsignatura === m.id}
                          onDragStart={handleDragStart}
                          onClick={() => {
                            setEditingData(m)
                            setIsEditModalOpen(true)
                          }}
                        />
                      ))}
                  </div>
                ))}

                <div
                  className={`flex flex-col justify-center rounded-xl border p-4 text-[11px] font-medium ${
                    sub.cr === 0 && sub.hd === 0 && sub.hi === 0
                      ? 'border-border/50 bg-muted/20 text-muted-foreground/70'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {sub.cr === 0 && sub.hd === 0 && sub.hi === 0 ? (
                    <div className="text-muted-foreground">—</div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <div className="text-foreground font-bold">
                          Cr: {sub.cr}
                        </div>
                        <div>
                          HD: {sub.hd} • HI: {sub.hi}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Fragment>
            )
          })}

          <div className="border-border col-span-full my-2 border-t"></div>

          <div className="text-foreground self-center p-2 font-bold">
            Totales por Ciclo
          </div>

          {ciclosArray.map((cicloNumero) => {
            const t = getTotalesCiclo(cicloNumero)
            const isEmpty = t.cr === 0 && t.hd === 0 && t.hi === 0

            return (
              <div
                key={`footer-${cicloNumero}`}
                className={`rounded-xl border p-2 text-center text-[11px] ${
                  isEmpty
                    ? 'border-border/50 bg-muted/30 text-muted-foreground'
                    : 'border-border bg-card'
                }`}
              >
                {isEmpty ? (
                  <div className="text-muted-foreground py-1 text-xs">—</div>
                ) : (
                  <>
                    <div className="text-foreground font-bold">Cr: {t.cr}</div>
                    <div>
                      HD: {t.hd} • HI: {t.hi}
                    </div>
                  </>
                )}
              </div>
            )
          })}

          <div className="text-primary-foreground border-primary/40 bg-primary flex flex-col justify-center rounded-xl border p-2 text-center text-xs font-bold shadow-sm">
            <div>{stats.cr} Cr</div>
            <div>{stats.hd + stats.hi} Hrs</div>
          </div>
        </div>
      </div>

      {/* Asignaturas Sin Asignar */}
      <div className="border-border bg-card/80 mt-12 rounded-[28px] border p-5 shadow-sm backdrop-blur-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-2xl">
                <Icons.Inbox className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
                    Bandeja de entrada
                  </h3>

                  <div className="bg-muted text-muted-foreground inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold">
                    {unassignedAsignaturas.length}
                  </div>
                </div>

                <p className="text-muted-foreground mt-0.5 text-sm">
                  Asignaturas sin ciclo o línea curricular
                </p>
              </div>
            </div>
          </div>

          <div className="border-border bg-background/80 text-muted-foreground flex items-center gap-2 rounded-full border border-dashed px-3 py-1.5 text-xs">
            <Icons.MoveDown className="h-3.5 w-3.5" />
            <span>Arrastra aquí para desasignar</span>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null, null)}
          className={[
            'rounded-3xl border-2 border-dashed p-4 transition-all duration-300',
            'min-h-55',
            draggedAsignatura
              ? 'border-primary/35 bg-primary/6 shadow-inner'
              : 'border-border bg-muted/20',
          ].join(' ')}
        >
          {unassignedAsignaturas.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {unassignedAsignaturas.map((m) => (
                <div key={m.id} className="w-fit shrink-0">
                  <AsignaturaCardItem
                    asignatura={m}
                    lineaColor="#94A3B8"
                    lineaNombre="Sin asignar"
                    isDragging={draggedAsignatura === m.id}
                    onDragStart={handleDragStart}
                    onClick={() => {
                      setEditingData(m)
                      setIsEditModalOpen(true)
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="border-border/70 bg-background/70 flex min-h-47 flex-col items-center justify-center rounded-[20px] border px-6 text-center">
              <div className="bg-muted text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
                <Icons.CheckCheck className="h-5 w-5" />
              </div>

              <p className="text-foreground text-sm font-semibold">
                No hay asignaturas pendientes
              </p>

              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Todo está colocado en el mapa. Arrastra una asignatura aquí para
                quitarle ciclo y línea curricular.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-137.5"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold">
              Editar Asignatura
            </DialogTitle>
          </DialogHeader>

          {/* Verificación de seguridad: solo renderiza si hay datos */}
          {editingData ? (
            <div className="grid gap-4 py-4">
              {/* Fila 1: Clave y Nombre */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Clave
                  </label>
                  <Input
                    maxLength={100}
                    value={editingData.clave}
                    onChange={(e) =>
                      setEditingData({ ...editingData, clave: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Nombre
                  </label>
                  <Input
                    maxLength={200}
                    value={editingData.nombre}
                    onChange={(e) =>
                      setEditingData({ ...editingData, nombre: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Fila 2: Créditos y Horas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Créditos
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={editingData.creditos}
                    onChange={(e) => {
                      const val = handleDecimalChange(e.target.value, 10)
                      if (val !== null) {
                        setEditingData({
                          ...editingData,
                          creditos: val === '' ? 0 : Number(val),
                        })
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HD (Horas Docente)
                  </label>
                  <Input
                    type="number"
                    value={editingData.hd}
                    onChange={(e) => {
                      const val = handleIntegerChange(e.target.value)
                      if (val !== null) {
                        setEditingData({
                          ...editingData,
                          hd: Number(e.target.value),
                        })
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HI (Horas Indep.)
                  </label>
                  <Input
                    type="number"
                    value={editingData.hi}
                    onChange={(e) => {
                      const val = handleIntegerChange(e.target.value)
                      if (val !== null) {
                        setEditingData({
                          ...editingData,
                          hi: Number(e.target.value),
                        })
                      }
                    }}
                  />
                </div>
              </div>

              {/* Fila 3: Ciclo y Línea */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Ciclo
                  </label>
                  <Select
                    value={editingData.ciclo?.toString() || 'unassigned'}
                    onValueChange={(val) =>
                      setEditingData({
                        ...editingData,
                        ciclo: val === 'unassigned' ? null : Number(val),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        -- Sin Asignar --
                      </SelectItem>
                      {ciclosArray.map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          Ciclo {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Línea Curricular
                  </label>
                  <Select
                    value={editingData.lineaCurricularId || 'unassigned'}
                    onValueChange={(val) =>
                      setEditingData({
                        ...editingData,
                        lineaCurricularId: val === 'unassigned' ? null : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        -- Sin Asignar --
                      </SelectItem>
                      {lineas.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 4: Seriación (Prerrequisitos) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Seriación (Prerrequisito)
                </label>
                <Select
                  // Cambiamos a manejo de valor único basado en el ID de la columna
                  value={editingData.prerrequisito_asignatura_id || undefined}
                  onValueChange={(val) => {
                    console.log(editingData)

                    setEditingData({
                      ...editingData,
                      prerrequisito_asignatura_id: val === 'none' ? null : val,
                    })
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Seleccionar asignatura..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Sin Seriación --</SelectItem>

                    {asignaturas
                      .filter((asig) => {
                        // 1. No es la misma materia
                        const noEsMisma = asig.id !== editingData.id
                        // 2. El ciclo debe ser estrictamente MENOR
                        const esCicloMenor =
                          asig.ciclo !== null &&
                          editingData.ciclo !== null &&
                          asig.ciclo < editingData.ciclo

                        return noEsMisma && esCicloMenor
                      })
                      .sort(
                        (a, b) =>
                          (a.ciclo || 0) - (b.ciclo || 0) ||
                          a.nombre.localeCompare(b.nombre),
                      )
                      .map((asig) => (
                        <SelectItem key={asig.id} value={asig.id}>
                          <span className="text-primary font-bold">
                            [C{asig.ciclo}]
                          </span>{' '}
                          {asig.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Visualización del Prerrequisito con el Nombre */}
              </div>

              {/* Fila 5: Tipo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Tipo
                </label>
                <Select
                  value={editingData.tipo}
                  onValueChange={(val: 'OBLIGATORIA' | 'OPTATIVA') =>
                    setEditingData({ ...editingData, tipo: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OBLIGATORIA">Obligatoria</SelectItem>
                    <SelectItem value="OPTATIVA">Optativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveChanges}>Guardar</Button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">No hay datos seleccionados</div>
          )}
        </DialogContent>
      </Dialog>

      {confirmState && (
        <AlertaConflicto
          isOpen={confirmState.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              confirmState.resolve(false)
              setConfirmState(null)
            }
          }}
          onConfirm={() => {
            confirmState.resolve(true)
          }}
          titulo="Conflicto de Seriación"
          descripcion={confirmState.mensaje}
        />
      )}
    </div>
  )
}
