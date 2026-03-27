/* eslint-disable jsx-a11y/label-has-associated-control */
import { createFileRoute } from '@tanstack/react-router'
import { Plus, AlertTriangle, Trash2, Download } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useMemo, useState, useEffect, Fragment, useRef } from 'react'

import type { TipoAsignatura } from '@/data'
import type { Asignatura } from '@/types/plan'
import type { TablesUpdate } from '@/types/supabase'

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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
import { cn } from '@/lib/utils'
import { generarColorContrastante } from '@/utils/colors'

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

type LineaCurricularUI = {
  id: string
  nombre: string
  orden: number
  color: string
}

const mapLineasToLineaCurricular = (
  lineasApi: Array<any> = [],
): Array<LineaCurricularUI> => {
  return lineasApi.map((linea, index) => ({
    id: linea.id,
    nombre: linea.nombre,
    orden: linea.orden ?? 0,
    color: linea.color ?? palette[index % palette.length],
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
              'group bg-background relative h-50 w-40 shrink-0 overflow-hidden rounded-[22px] border text-left',
              'transition-all duration-300 ease-out',
              'focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:outline-none',
              'cursor-grab active:cursor-grabbing',
              isDragging
                ? 'scale-[0.985] opacity-45 shadow-none'
                : 'hover:-translate-y-1 hover:shadow-lg',
            ].join(' ')}
            style={{
              borderColor: lineaColor,
            }}
            title={asignatura.nombre}
          >
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
                  className="text-foreground overflow-hidden pb-1 text-sm leading-[1.08]"
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
                <div className="bg-muted/70 border-border/70 flex flex-col items-center rounded-2xl border px-2.5 py-2">
                  {/* <Icons.Award className="h-3.5 w-3.5" /> */}
                  <span className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                    CR
                  </span>

                  <div className="text-foreground text-sm font-bold">
                    {asignatura.creditos}
                  </div>
                </div>

                <div className="bg-muted/70 border-border/70 flex flex-col items-center rounded-2xl border px-2.5 py-2">
                  <span className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                    HD
                  </span>

                  <div className="text-foreground text-sm font-bold">
                    {asignatura.hd}
                  </div>
                </div>

                <div className="bg-muted/70 border-border/70 flex flex-col items-center rounded-2xl border px-2.5 py-2">
                  <span className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
                    HI
                  </span>

                  <div className="text-foreground text-sm font-bold">
                    {asignatura.hi}
                  </div>
                </div>
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
  const { mutate: createLinea, isPending: isCreatingLinea } = useCreateLinea()
  const { mutate: updateLineaApi } = useUpdateLinea()
  const { mutate: deleteLineaApi } = useDeleteLinea()
  const { data: asignaturaApi, isLoading: loadingAsig } =
    usePlanAsignaturas(planId)
  const { data: lineasApi, isLoading: loadingLineas } = usePlanLineas(planId)
  const [asignaturas, setAsignaturas] = useState<Array<Asignatura>>([])
  const [lineas, setLineas] = useState<Array<LineaCurricularUI>>([])
  const [draggedAsignatura, setDraggedAsignatura] = useState<string | null>(
    null,
  )
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddLineaDialogOpen, setIsAddLineaDialogOpen] = useState(false)
  const [selectedLineaOption, setSelectedLineaOption] = useState<
    'matematicas' | 'area_comun' | 'custom' | ''
  >('')
  const [customLineaNombre, setCustomLineaNombre] = useState('')
  const [ultimoHue, setUltimoHue] = useState<number | null>(null)
  const { mutate: updateAsignatura } = useUpdateAsignatura()
  const inputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    if (selectedLineaOption === 'custom' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [selectedLineaOption])

  const handleCambioCicloSeguro = async (
    asignatura: Asignatura,
    nuevoCiclo: number,
  ) => {
    const acepto = await validarConInterrupcion(asignatura.id, nuevoCiclo)

    if (!acepto) {
      setConfirmState(null)
      return
    }

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
          setConfirmState(null) // Cerramos el modal de Radix al tener éxito
        },
        onError: (err) => {
          // En lugar de alert nativo, podrías usar un toast aquí
          console.error('Error al actualizar:', err)
          setConfirmState(null)
        },
      },
    )
  }

  const manejarAgregarLinea = (nombre: string, color: string, hue: number) => {
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
        color,
      },
      {
        onSuccess: (nueva) => {
          const mapeada = {
            id: nueva.id,
            nombre: nueva.nombre,
            orden: nueva.orden,
            color: nueva.color ?? color,
          }
          setLineas((prev) => [...prev, mapeada])
          setUltimoHue(hue)
          setIsAddLineaDialogOpen(false)
          setSelectedLineaOption('')
          setCustomLineaNombre('')
        },
        onError: (err) => {
          console.error('Error al crear linea:', err)
        },
      },
    )
  }

  const canAddLinea =
    selectedLineaOption === 'matematicas' ||
    selectedLineaOption === 'area_comun' ||
    (selectedLineaOption === 'custom' && customLineaNombre.trim().length > 0)

  const handleAgregarLinea = () => {
    if (!canAddLinea || isCreatingLinea) return

    const nombreSeleccionado =
      selectedLineaOption === 'matematicas'
        ? 'Matemáticas'
        : selectedLineaOption === 'area_comun'
          ? 'Área Común'
          : customLineaNombre.trim()

    if (!nombreSeleccionado) return

    const { hex, hue } = generarColorContrastante(ultimoHue)

    manejarAgregarLinea(nombreSeleccionado, hex, hue)
  }

  const cambiarColorLinea = (lineaId: string, nuevoColor: string) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, color: nuevoColor } : l)),
    )

    updateLineaApi(
      {
        lineaId,
        patch: { color: nuevoColor },
      },
      {
        onError: (err) => {
          console.error('Error al actualizar color de linea:', err)
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

    // Buscamos la asignatura completa para tener sus datos
    const asignatura = asignaturas.find((a) => a.id === draggedAsignatura)
    if (!asignatura) return

    // SI EL CAMBIO ES DE CICLO (y no solo de línea o a la bandeja)
    // Ejecutamos la validación segura
    if (cicloDestino !== null && cicloDestino !== asignatura.ciclo) {
      // Llamamos a la función que agregaste
      // IMPORTANTE: Asegúrate que handleCambioCicloSeguro esté definida ANTES o sea accesible
      await handleCambioCicloSeguro(asignatura, cicloDestino)

      // Si la validación interna de handleCambioCicloSeguro falla o el usuario cancela,
      // la ejecución se detiene dentro de esa función.
    } else {
      // CASO B: Es un movimiento a la bandeja (null) o cambio de línea en el mismo ciclo
      // Mantenemos la lógica simple de actualización
      setAsignaturas((prev) =>
        prev.map((m) =>
          m.id === draggedAsignatura
            ? { ...m, ciclo: cicloDestino, lineaCurricularId: lineaId }
            : m,
        ),
      )

      updateAsignatura(
        {
          asignaturaId: draggedAsignatura,
          patch: { numero_ciclo: cicloDestino, linea_plan_id: lineaId },
        },
        { onError: (err) => console.error('Error al mover:', err) },
      )
    }

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

          <Button
            variant="outline"
            className={cn(
              'inline-flex h-11 w-full items-center justify-start gap-2 rounded-md px-8 text-sm font-medium shadow-sm transition-colors',
              // Fondo verde claro y texto oscuro para contraste
              'bg-green-100 text-green-900 hover:bg-green-200/80',
              // Borde verde más oscuro y definido
              'border border-green-600/30',
              // Enfoque y estados (Accesibilidad)
              'ring-offset-background focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none',
              // Soporte para modo oscuro (opcional pero recomendado)
              'dark:border-green-500/40 dark:bg-green-900/30 dark:text-green-100 dark:hover:bg-green-900/50',
            )}
          >
            <Download
              size={16}
              className="text-green-700 dark:text-green-400"
            />{' '}
            Exportar a Excel
          </Button>

          {/* Barra Totales */}
          <div className="border-border bg-card/60 col-span-2 grid grid-cols-2 gap-3 rounded-2xl border p-3 shadow-sm md:grid-cols-4">
            <StatItem label="Total Créditos" value={stats.cr} total={320} />
            <StatItem label="Total HD" value={stats.hd} />
            <StatItem label="Total HI" value={stats.hi} />
            <StatItem label="Total Horas" value={stats.hd + stats.hi} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-6">
        <div
          className="grid gap-3 pl-1"
          style={{
            gridTemplateColumns: `140px repeat(${ciclosTotales}, 188px) 120px`,
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
                  className={`group relative flex flex-col gap-2 rounded-xl border p-3 transition-all ${editingLineaId === linea.id ? 'ring-primary/30 ring-2' : 'cursor-text'}`}
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

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="border-border/70 bg-background relative inline-flex h-8 w-8 items-center justify-center rounded-md border"
                        style={{
                          borderColor: hexToRgba(
                            linea.color || '#1976d2',
                            0.35,
                          ),
                        }}
                      >
                        <input
                          type="color"
                          aria-label="Cambiar color de línea"
                          value={linea.color || '#1976d2'}
                          onChange={(e) =>
                            cambiarColorLinea(linea.id, e.target.value)
                          }
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <Icons.Palette
                          className="text-muted-foreground h-4 w-4"
                          aria-hidden
                        />
                      </div>

                      <div
                        className="border-border/70 h-5 w-5 rounded-full border"
                        style={{ backgroundColor: linea.color || '#1976d2' }}
                        aria-hidden
                      />
                    </div>

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

          {/* Agregar línea (sticky dentro del overflow-x)
              Nota: Se envuelve en un row `col-span-full` para evitar bugs de sticky en mobile/iOS
              cuando el sticky es un grid-item. */}
          <div className="col-span-full">
            <div className="sticky left-0 z-10 w-35">
              <Button
                className="shadow-md"
                onClick={() => setIsAddLineaDialogOpen(true)}
              >
                <Plus size={14} /> Agregar línea
              </Button>
            </div>
          </div>

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

          <div className="text-accent-foreground border-accent/40 bg-accent flex flex-col justify-center rounded-xl border p-2 text-center text-xs font-bold shadow-sm">
            <div>{stats.cr} Cr</div>
            <div>{stats.hd + stats.hi} Hrs</div>
          </div>
        </div>
      </div>

      {/* Asignaturas Sin Asignar */}
      <div className="border-border bg-card/80 mt-6 rounded-[28px] border p-5 shadow-sm backdrop-blur-sm">
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
      <Dialog
        open={isAddLineaDialogOpen}
        onOpenChange={(open) => {
          setIsAddLineaDialogOpen(open)
          if (!open) {
            setSelectedLineaOption(undefined)
            setCustomLineaNombre('')
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-bold">
              Agregar línea curricular
            </DialogTitle>
          </DialogHeader>

          <RadioGroup
            value={selectedLineaOption}
            onValueChange={(val) =>
              setSelectedLineaOption(val as typeof selectedLineaOption)
            }
            className="grid grid-cols-[1fr_auto_1fr] gap-8 py-4"
          >
            {/* Columna Izquierda: Predefinidas */}
            <div className="space-y-4">
              <div className="text-foreground mb-3 text-sm font-semibold">
                Catálogo Institucional
              </div>

              {/* Tarjeta: Matemáticas */}
              <div className="border-input has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5 hover:bg-muted/50 relative flex w-full items-start gap-3 rounded-md border p-4 shadow-sm transition-all outline-none">
                <RadioGroupItem
                  id="linea-matematicas"
                  value="matematicas"
                  className="mt-0.5 size-5 after:absolute after:inset-0 [&_svg]:size-3"
                />
                <div className="grid grow gap-1">
                  <Label
                    htmlFor="linea-matematicas"
                    className="cursor-pointer font-semibold"
                  >
                    Matemáticas
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Línea base para ciencias exactas.
                  </p>
                </div>
              </div>

              {/* Tarjeta: Área Común */}
              <div className="border-input has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5 hover:bg-muted/50 relative flex w-full items-start gap-3 rounded-md border p-4 shadow-sm transition-all outline-none">
                <RadioGroupItem
                  id="linea-area-comun"
                  value="area_comun"
                  className="mt-0.5 size-5 after:absolute after:inset-0 [&_svg]:size-3"
                />
                <div className="grid grow gap-1">
                  <Label
                    htmlFor="linea-area-comun"
                    className="cursor-pointer font-semibold"
                  >
                    Área Común
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    Materias compartidas entre programas.
                  </p>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="flex justify-center">
              <Separator orientation="vertical" />
            </div>

            {/* Columna Derecha: Personalizada */}
            <div className="space-y-4">
              <div className="text-foreground mb-3 text-sm font-semibold">
                Línea personalizada
              </div>

              {/* Tarjeta: Custom */}
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault() // Evita que la página haga scroll con el espacio
                    setSelectedLineaOption('custom')
                    inputRef.current?.focus()
                  }
                }}
                onClick={() => {
                  setSelectedLineaOption('custom')
                  inputRef.current?.focus()
                }}
                className={`focus-visible:ring-primary relative flex w-full cursor-pointer items-start gap-3 rounded-md border p-4 shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  selectedLineaOption === 'custom'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-input hover:bg-muted/50'
                }`}
              >
                {/* Omitimos after:absolute para no tapar el input */}
                <RadioGroupItem
                  id="linea-custom"
                  value="custom"
                  className="mt-0.5 size-5 [&_svg]:size-3"
                />
                <div className="grid w-full grow gap-3">
                  <Label
                    htmlFor="linea-custom"
                    className="cursor-pointer font-semibold"
                  >
                    Otra línea...
                  </Label>
                  <Input
                    ref={inputRef}
                    value={customLineaNombre}
                    onChange={(e) =>
                      setCustomLineaNombre(e.target.value.slice(0, 200))
                    }
                    placeholder="Escribe el nombre aquí"
                    maxLength={200}
                    disabled={selectedLineaOption !== 'custom'}
                    className="bg-background h-9 w-full"
                  />
                </div>
              </div>
            </div>
          </RadioGroup>

          <div className="mt-2 flex items-center justify-end gap-3 border-t pt-4">
            <Button
              className="shadow-md"
              onClick={handleAgregarLinea}
              disabled={!canAddLinea || isCreatingLinea}
            >
              <Plus size={16} /> Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
