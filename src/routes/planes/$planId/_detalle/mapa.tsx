/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/label-has-associated-control */
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus,
  ChevronDown,
  AlertTriangle,
  Trash2,
  Pencil,
} from 'lucide-react'
import { useMemo, useState, useEffect, Fragment } from 'react'

import type { TipoAsignatura } from '@/data'
import type { Asignatura, LineaCurricular } from '@/types/plan'
import type { TablesUpdate } from '@/types/supabase'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateLinea,
  useDeleteLinea,
  usePlan,
  usePlanAsignaturas,
  usePlanLineas,
  useUpdateAsignatura,
  useUpdateLinea,
} from '@/data'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

const lineColors = [
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-purple-50 border-purple-200 text-purple-700',
  'bg-orange-50 border-orange-200 text-orange-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
]

const statusBadge: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  revisada: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-emerald-100 text-emerald-700',
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
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
        {label}:
      </span>
      <span className="text-sm font-bold text-slate-700">
        {value}
        {total ? (
          <span className="font-normal text-slate-400">/{total}</span>
        ) : (
          ''
        )}
      </span>
    </div>
  )
}

import * as Icons from 'lucide-react'

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
  const estado = estadoConfig[asignatura.estado] ?? estadoConfig.borrador
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
              'group relative h-[200px] w-[272px] shrink-0 overflow-hidden rounded-[22px] border text-left',
              'transition-all duration-300 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
              'active:cursor-grabbing cursor-grab',
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
              className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundColor: hexToRgba(lineaColor, 0.22) }}
            />

            <div className="relative flex h-full flex-col p-4">
              {/* top */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className="inline-flex h-8 max-w-[200px] items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold"
                  style={{
                    borderColor: hexToRgba(lineaColor, 0.2),
                    backgroundColor: hexToRgba(lineaColor, 0.1),
                    color: lineaColor,
                  }}
                >
                  <Icons.KeyRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{asignatura.clave || 'Sin clave'}</span>
                </div>

                <div className="relative flex h-8 items-center overflow-hidden rounded-full bg-background/70 px-2 backdrop-blur-sm">
                  <div className="flex gap-4 items-center gap-1.5 transition-transform duration-300 group-hover:-translate-x-[72px]">
                    <span className={`h-2.5 w-2.5 rounded-full ${estado.dot}`} />
                    <EstadoIcon
                      className={[
                        'h-3.5 w-3.5 text-foreground/65',
                        asignatura.estado === 'generando' ? 'animate-spin' : '',
                      ].join(' ')}
                    />
                  </div>
                  <div
                    className={[
                      'absolute right-2 flex translate-x-6 items-center gap-1.5 opacity-0 transition-all duration-300',
                      'group-hover:translate-x-0 group-hover:opacity-100'
                    ].join(' ')}
                  >
                    <span className="text-[11px] font-semibold whitespace-nowrap">
                      {estado.label}
                    </span>
                  </div>

                </div>
              </div>

              {/* titulo */}
              <div className="mt-4 min-h-[72px]">
                <h3
                  className="overflow-hidden text-[18px] leading-[1.08] font-bold text-foreground"
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
                  <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <Icons.Award className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">
                      CR
                    </span>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {asignatura.creditos}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/55 px-2.5 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <Icons.Clock3 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">
                      HD
                    </span>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {asignatura.hd}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/40 bg-white/55 px-2.5 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                    <Icons.BookOpenText className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">
                      HI
                    </span>
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {asignatura.hi}
                  </div>
                </div>
              </div>

              {/* drag affordance */}
              <div className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background/70 p-1.5 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                <Icons.GripVertical className="h-4 w-4 text-muted-foreground/55" />
              </div>
            </div>
          </button>
        </TooltipTrigger>

        <TooltipContent side="bottom">
          <div className="text-xs">
            {lineaNombre ? `${lineaNombre} · ` : ''}
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
  const [ciclo, setCiclo] = useState(0)
  const [editingLineaId, setEditingLineaId] = useState<string | null>(null)
  const [tempNombreLinea, setTempNombreLinea] = useState('')
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
  const [seriacionValue, setSeriacionValue] = useState<string>('')

  useEffect(() => {
    if (data?.numero_ciclos) {
      setCiclo(data.numero_ciclos)
    }
  }, [data])

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
  const guardarEdicionLinea = (id: string, nuevoNombre?: string) => {
    // Usamos el nombre que viene por parámetro o el del estado como fallback
    const nombreAFijar = (
      nuevoNombre !== undefined ? nuevoNombre : tempNombreLinea
    ).trim()

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
          setTempNombreLinea('')
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

  const ciclosTotales = Number(ciclo)
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
  const handleSaveChanges = () => {
    if (!editingData) return
    setAsignaturas((prev) =>
      prev.map((m) => (m.id === editingData.id ? { ...editingData } : m)),
    )
    type AsignaturaPatch = {
      codigo?: TablesUpdate<'asignaturas'>['codigo']
      nombre?: TablesUpdate<'asignaturas'>['nombre']
      tipo?: TablesUpdate<'asignaturas'>['tipo']
      creditos?: TablesUpdate<'asignaturas'>['creditos']
      horas_academicas?: TablesUpdate<'asignaturas'>['horas_academicas']
      horas_independientes?: TablesUpdate<'asignaturas'>['horas_independientes']
      numero_ciclo?: TablesUpdate<'asignaturas'>['numero_ciclo']
      linea_plan_id?: TablesUpdate<'asignaturas'>['linea_plan_id']
      prerrequisito_asignatura_id?: string | null
    }
    const patch: Partial<AsignaturaPatch> = {
      nombre: editingData.nombre,
      codigo: editingData.clave,
      creditos: editingData.creditos,
      horas_academicas: editingData.hd,
      horas_independientes: editingData.hi,
      numero_ciclo: editingData.ciclo,
      linea_plan_id: editingData.lineaCurricularId,
      prerrequisito_asignatura_id: editingData.prerrequisito_asignatura_id,
      tipo: editingData.tipo.toUpperCase() as TipoAsignatura, // Asegurar que coincida con el ENUM (OBLIGATORIA/OPTATIVA)
    }

    updateAsignatura(
      { asignaturaId: editingData.id, patch: patch as any },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
          // Opcional: Mostrar un toast de éxito
        },
        onError: (error) => {
          console.error('Error al guardar:', error)
          alert('Hubo un error al guardar los cambios.')
        },
      },
    )
  }
  const unassignedAsignaturas = asignaturas.filter(
    (m) => m.ciclo === null || m.lineaCurricularId === null,
  )

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
  const getTotalesCiclo = (ciclo: number) => {
    return asignaturas
      .filter((m) => m.ciclo === ciclo)
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
  const handleDrop = (
    e: React.DragEvent,
    ciclo: number | null,
    lineaId: string | null,
  ) => {
    e.preventDefault()
    if (draggedAsignatura) {
      // 1. Actualización optimista del UI
      setAsignaturas((prev) =>
        prev.map((m) =>
          m.id === draggedAsignatura
            ? { ...m, ciclo, lineaCurricularId: lineaId }
            : m,
        ),
      )
      const patch = {
        numero_ciclo: ciclo,
        linea_plan_id: lineaId,
      }

      updateAsignatura(
        { asignaturaId: draggedAsignatura, patch },
        {
          onError: (error) => {
            console.error('Error al mover:', error)
            // Opcional: Revertir el estado local si falla
          },
        },
      )

      setDraggedAsignatura(null)
    }
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

  const handleKeyDownLinea = (
    e: React.KeyboardEvent<HTMLSpanElement>,
    id: string,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  const handleBlurLinea = (
    e: React.FocusEvent<HTMLSpanElement>,
    id: string,
  ) => {
    const nuevoNombre = e.currentTarget.textContent.trim() || ''

    // Buscamos la línea original para comparar
    const lineaOriginal = lineas.find((l) => l.id === id)

    if (nuevoNombre !== lineaOriginal?.nombre) {
      // IMPORTANTE: Pasamos nuevoNombre directamente
      guardarEdicionLinea(id, nuevoNombre)
    } else {
      setEditingLineaId(null)
    }
  }

  if (loadingAsig || loadingLineas)
    return <div className="p-10 text-center">Cargando mapa curricular...</div>

  return (
    <div className="container mx-auto px-2 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Mapa Curricular</h2>
          <p className="text-sm text-slate-500">
            Organiza las asignaturas de la petición por línea y ciclo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-teal-700 text-white hover:bg-teal-800">
            <Plus size={16} className="mr-2" /> Exportar{' '}
          </Button>
          {asignaturas.filter((m) => !m.ciclo || !m.lineaCurricularId).length >
            0 && (
              <Badge className="border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-50">
                <AlertTriangle size={14} className="mr-1" />{' '}
                {
                  asignaturas.filter((m) => !m.ciclo || !m.lineaCurricularId)
                    .length
                }{' '}
                sin asignar
              </Badge>
            )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-teal-700 text-white hover:bg-teal-800">
                <Plus size={16} className="mr-2" /> Agregar{' '}
                <ChevronDown size={14} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!tieneAreaComun && (
                <>
                  <DropdownMenuItem
                    onClick={() => manejarAgregarLinea('Área Común')}
                    className="font-bold text-teal-700"
                  >
                    + Agregar Área Común
                  </DropdownMenuItem>
                  <div className="my-1 border-t border-slate-100" />
                </>
              )}
              {/* Input para nombre personalizado */}
              <div className="p-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Nombre de Línea
                </label>
                <div className="mt-1 flex gap-1">
                  <Input
                    value={nombreNuevaLinea}
                    onChange={(e) => setNombreNuevaLinea(e.target.value)}
                    placeholder="Ej: Optativas"
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => manejarAgregarLinea(nombreNuevaLinea)}
                    disabled={!nombreNuevaLinea.trim()}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra Totales */}
      <div className="mb-8 flex gap-10 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <StatItem label="Total Créditos" value={stats.cr} total={320} />
        <StatItem label="Total HD" value={stats.hd} />
        <StatItem label="Total HI" value={stats.hi} />
        <StatItem label="Total Horas" value={stats.hd + stats.hi} />
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="min-w-[1500px]">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `220px repeat(${ciclosTotales}, minmax(auto, 1fr)) 120px`,
            }}
          >
            <div className="self-end px-2 text-xs font-bold text-slate-400">
              LÍNEA CURRICULAR
            </div>

            {ciclosArray.map((n) => (
              <div
                key={`header-${n}`}
                className="rounded-lg bg-slate-100 p-2 text-center text-sm font-bold text-slate-600"
              >
                Ciclo {n}
              </div>
            ))}

            <div className="self-end text-center text-xs font-bold text-slate-400">
              SUBTOTAL
            </div>

            {lineas.map((linea, idx) => {
              const sub = getSubtotalLinea(linea.id)

              return (
                <Fragment key={linea.id}>
                  <div
                    className={`group relative flex items-center justify-between rounded-xl border-l-4 p-4 transition-all ${lineColors[idx % lineColors.length]
                      } ${editingLineaId === linea.id ? 'bg-white ring-2 ring-teal-500/20' : ''}`}
                  >
                    <div className="flex-1 overflow-hidden">
                      <span
                        contentEditable={editingLineaId === linea.id}
                        suppressContentEditableWarning
                        spellCheck={false}
                        onKeyDown={(e) => handleKeyDownLinea(e, linea.id)}
                        onBlur={(e) => handleBlurLinea(e, linea.id)}
                        onClick={() => {
                          if (editingLineaId !== linea.id) {
                            setEditingLineaId(linea.id)
                            setTempNombreLinea(linea.nombre)
                          }
                        }}
                        className={`block w-full text-xs font-bold break-words outline-none ${editingLineaId === linea.id
                          ? 'cursor-text border-b border-teal-500/50 pb-1'
                          : 'cursor-pointer'
                          }`}
                      >
                        {linea.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingLineaId(linea.id)}
                        className="..."
                      >
                        {' '}
                        <Pencil size={12} />{' '}
                      </button>
                      <Trash2
                        onClick={() => borrarLinea(linea.id)}
                        className="..."
                        size={14}
                      />
                    </div>
                  </div>

                  {ciclosArray.map((ciclo) => (
                    <div
                      key={`${linea.id}-${ciclo}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, ciclo, linea.id)}
                      className="min-h-[140px] space-y-2 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 p-2"
                    >
                      {asignaturas
                        .filter(
                          (m) =>
                            m.ciclo === ciclo &&
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

                  <div className="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 text-[10px] font-medium text-slate-500">
                    <div>Cr: {sub.cr}</div>
                    <div>HD: {sub.hd}</div>
                    <div>HI: {sub.hi}</div>
                  </div>
                </Fragment>
              )
            })}

            <div className="col-span-full my-2 border-t border-slate-200"></div>

            <div className="self-center p-2 font-bold text-slate-600">
              Totales por Ciclo
            </div>

            {ciclosArray.map((ciclo) => {
              const t = getTotalesCiclo(ciclo)
              return (
                <div
                  key={`footer-${ciclo}`}
                  className="rounded-lg bg-slate-50 p-2 text-center text-[10px]"
                >
                  <div className="font-bold text-slate-700">Cr: {t.cr}</div>
                  <div>
                    HD: {t.hd} • HI: {t.hi}
                  </div>
                </div>
              )
            })}

            <div className="flex flex-col justify-center rounded-lg bg-teal-50 p-2 text-center text-xs font-bold text-teal-800">
              <div>{stats.cr} Cr</div>
              <div>{stats.hd + stats.hi} Hrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asignaturas Sin Asignar */}
      <div className="mt-12 rounded-[28px] border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icons.Inbox className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                    Bandeja de entrada
                  </h3>

                  <div className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-[11px] font-semibold text-muted-foreground">
                    {unassignedAsignaturas.length}
                  </div>
                </div>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Asignaturas sin ciclo o línea curricular
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-dashed border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
            <Icons.MoveDown className="h-3.5 w-3.5" />
            <span>Arrastra aquí para desasignar</span>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null, null)}
          className={[
            'rounded-[24px] border-2 border-dashed p-4 transition-all duration-300',
            'min-h-[220px]',
            draggedAsignatura
              ? 'border-primary/35 bg-primary/6 shadow-inner'
              : 'border-border bg-muted/20',
          ].join(' ')}
        >
          {unassignedAsignaturas.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {unassignedAsignaturas.map((m) => (
                <div key={m.id} className="w-[272px] shrink-0">
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
            <div className="flex min-h-[188px] flex-col items-center justify-center rounded-[20px] border border-border/70 bg-background/70 px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icons.CheckCheck className="h-5 w-5" />
              </div>

              <p className="text-sm font-semibold text-foreground">
                No hay asignaturas pendientes
              </p>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Todo está colocado en el mapa. Arrastra una asignatura aquí para quitarle
                ciclo y línea curricular.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="sm:max-w-[550px]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-700">
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
                          <span className="font-bold text-teal-600">
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
                <Button
                  className="bg-teal-700 text-white"
                  onClick={handleSaveChanges}
                >
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">No hay datos seleccionados</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
