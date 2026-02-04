/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/label-has-associated-control */
import { createFileRoute } from '@tanstack/react-router'
import {
  Plus,
  ChevronDown,
  AlertTriangle,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'

import type { Asignatura, LineaCurricular } from '@/types/plan'

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
  usePlanAsignaturas,
  usePlanLineas,
  useUpdateAsignatura,
  useUpdateLinea,
} from '@/data'

// --- Mapeadores (Fuera del componente para mayor limpieza) ---
const mapLineasToLineaCurricular = (
  lineasApi: Array<any> = [],
): Array<LineaCurricular> => {
  return lineasApi.map((linea) => ({
    id: linea.id,
    nombre: linea.nombre,
    orden: linea.orden ?? 0,
    color: '#1976d2',
  }))
}

const mapAsignaturasToAsignaturas = (
  asigApi: Array<any> = [],
): Array<Asignatura> => {
  return asigApi.map((asig) => ({
    id: asig.id,
    clave: asig.codigo,
    nombre: asig.nombre,
    creditos: asig.creditos ?? 0,
    ciclo: asig.numero_ciclo ?? null,
    lineaCurricularId: asig.linea_plan_id ?? null,
    tipo: asig.tipo === 'OBLIGATORIA' ? 'obligatoria' : 'optativa',
    estado: 'borrador',
    orden: asig.orden_celda ?? 0,
    // Mapeo directo de los nuevos campos de la API
    hd: asig.horas_academicas ?? 0,
    hi: asig.horas_independientes ?? 0,
    prerrequisitos: [],
  }))
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

function AsignaturaCardItem({
  asignatura,
  onDragStart,
  isDragging,
  onClick,
}: {
  asignatura: Asignatura
  onDragStart: (e: React.DragEvent, id: string) => void
  isDragging: boolean
  onClick: () => void
}) {
  return (
    <button
      draggable
      onDragStart={(e) => onDragStart(e, asignatura.id)}
      onClick={onClick}
      className={`group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all active:cursor-grabbing ${
        isDragging
          ? 'scale-95 opacity-40'
          : 'hover:border-teal-400 hover:shadow-md'
      }`}
    >
      <div className="mb-1 flex items-start justify-between">
        <span className="font-mono text-[10px] font-bold text-slate-400">
          {asignatura.clave}
        </span>
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[9px] uppercase ${statusBadge[asignatura.estado] || ''}`}
        >
          {asignatura.estado}
        </Badge>
      </div>
      <p className="mb-1 text-xs leading-tight font-bold text-slate-700">
        {asignatura.nombre}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          {asignatura.creditos} CR • HD:{asignatura.hd} • HI:{asignatura.hi}
        </span>
        <GripVertical
          size={12}
          className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </button>
  )
}

export const Route = createFileRoute('/planes/$planId/_detalle/mapa')({
  component: MapaCurricularPage,
  validateSearch: (search: { ciclo?: number }) => ({
    ciclo: search.ciclo ?? null,
  }),
})

function MapaCurricularPage() {
  const { planId } = Route.useParams() // Idealmente usa el ID de la ruta
  const { ciclo } = Route.useSearch()
  const [editingLineaId, setEditingLineaId] = useState<string | null>(null)
  const [tempNombreLinea, setTempNombreLinea] = useState('')
  const { mutate: createLinea } = useCreateLinea()
  const { mutate: updateLineaApi } = useUpdateLinea()
  const { mutate: deleteLineaApi } = useDeleteLinea()
  // 1. Fetch de Datos
  const { data: asignaturasApi, isLoading: loadingAsig } =
    usePlanAsignaturas(planId)
  const { data: lineasApi, isLoading: loadingLineas } = usePlanLineas(planId)

  // 2. Estado Local (Para interactividad)
  const [asignaturas, setAsignaturas] = useState<Array<Asignatura>>([])
  const [lineas, setLineas] = useState<Array<LineaCurricular>>([])
  const [draggedAsignatura, setDraggedAsignatura] = useState<string | null>(
    null,
  )
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAsignatura, setSelectedAsignatura] =
    useState<Asignatura | null>(null)
  const [hasAreaComun, setHasAreaComun] = useState(false)
  const [nombreNuevaLinea, setNombreNuevaLinea] = useState('') // Para el input de nombre personalizado
  const { mutate: updateAsignatura, isPending } = useUpdateAsignatura()

  const manejarAgregarLinea = (nombre: string) => {
    const nombreNormalizado = nombre.trim()

    // 1. Validar vacío
    if (!nombreNormalizado) return

    // 2. Validar duplicados en el estado local (Insensible a mayúsculas/acentos)
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
      return // DETIENE la ejecución aquí, no llega a la mutación
    }

    // 3. Si pasa las validaciones, procedemos con la persistencia
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
          // Sincronización local que ya teníamos
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
  const guardarEdicionLinea = (id: string) => {
    if (!tempNombreLinea.trim()) {
      setEditingLineaId(null)
      return
    }

    updateLineaApi(
      {
        lineaId: id,
        patch: { nombre: tempNombreLinea.trim() },
      },
      {
        onSuccess: (lineaActualizada) => {
          // ACTUALIZACIÓN MANUAL DEL ESTADO LOCAL
          setLineas((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, nombre: lineaActualizada.nombre } : l,
            ),
          )
          setEditingLineaId(null)
          setTempNombreLinea('')
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

  // 3. Sincronizar API -> Estado Local
  useEffect(() => {
    if (asignaturasApi)
      setAsignaturas(mapAsignaturasToAsignaturas(asignaturasApi))
  }, [asignaturasApi])

  useEffect(() => {
    if (lineasApi) setLineas(mapLineasToLineaCurricular(lineasApi))
  }, [lineasApi])

  const ciclosTotales = Number(ciclo)
  const ciclosArray = Array.from({ length: ciclosTotales }, (_, i) => i + 1)

  // Nuevo estado para controlar los datos temporales del modal de edición
  const [editingData, setEditingData] = useState<Asignatura | null>(null)

  // 1. FUNCION DE GUARDAR MODAL
  const handleSaveChanges = () => {
    if (!editingData) return
    console.log(asignaturas)

    setAsignaturas((prev) =>
      prev.map((m) => (m.id === editingData.id ? { ...editingData } : m)),
    )
    // setIsEditModalOpen(false)
    // Preparamos el patch con la estructura de tu tabla
    const patch = {
      nombre: editingData.nombre,
      codigo: editingData.clave,
      creditos: editingData.creditos,
      horas_academicas: editingData.hd,
      horas_independientes: editingData.hi,
      numero_ciclo: editingData.ciclo,
      linea_plan_id: editingData.lineaCurricularId,
      tipo: editingData.tipo.toUpperCase(), // Asegurar que coincida con el ENUM (OBLIGATORIA/OPTATIVA)
      // datos: editingData.datos, // Si editaste algo del JSONB
    }

    updateAsignatura(
      { asignaturaId: editingData.id, patch },
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

  // 2. MODIFICACIÓN: Zona de soltado siempre visible
  // Cambiamos la condición: Mostramos la sección si hay asignaturas sin asignar
  // O si simplemente queremos tener el "depósito" disponible.
  const unassignedAsignaturas = asignaturas.filter(
    (m) => m.ciclo === null || m.lineaCurricularId === null,
  )

  // --- Lógica de Gestión ---
  const agregarLinea = (nombre: string) => {
    const nueva = { id: crypto.randomUUID(), nombre, orden: lineas.length + 1 }
    setLineas([...lineas, nueva])
  }

  const borrarLinea = (id: string) => {
    // 1. Opcional: Confirmación de seguridad
    if (
      !confirm(
        '¿Estás seguro de eliminar esta línea? Las materias asignadas volverán a la bandeja de entrada.',
      )
    ) {
      return
    }

    // 2. Llamada a la API
    deleteLineaApi(id, {
      onSuccess: () => {
        // 3. Actualización instantánea del estado local

        // Primero: Las materias que estaban en esa línea pasan a ser "huérfanas"
        setAsignaturas((prev) =>
          prev.map((asig) =>
            asig.lineaCurricularId === id
              ? { ...asig, ciclo: null, lineaCurricularId: null }
              : asig,
          ),
        )

        // Segundo: Quitamos la línea del estado
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

      // 2. Persistir en la API
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
            className="mb-4 grid gap-3"
            style={{
              gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px`,
            }}
          >
            <div className="self-end px-2 text-xs font-bold text-slate-400">
              LÍNEA CURRICULAR
            </div>
            {ciclosArray.map((n) => (
              <div
                key={n}
                className="rounded-lg bg-slate-100 p-2 text-center text-sm font-bold text-slate-600"
              >
                Ciclo {n}
              </div>
            ))}
            <div className="self-end text-center text-xs font-bold text-slate-400">
              SUBTOTAL
            </div>
          </div>

          {lineas.map((linea, idx) => {
            const sub = getSubtotalLinea(linea.id)
            return (
              <div
                key={linea.id}
                className="mb-3 grid gap-3"
                style={{
                  gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px`,
                }}
              >
                <div
                  className={`flex items-center justify-between rounded-xl border-l-4 p-4 ${lineColors[idx % lineColors.length]}`}
                >
                  {editingLineaId === linea.id ? (
                    <Input
                      autoFocus
                      className="h-7 bg-white text-xs"
                      value={tempNombreLinea}
                      onChange={(e) => setTempNombreLinea(e.target.value)}
                      onBlur={() => guardarEdicionLinea(linea.id)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && guardarEdicionLinea(linea.id)
                      }
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-xs font-bold hover:underline"
                      onClick={() => {
                        setEditingLineaId(linea.id)
                        setTempNombreLinea(linea.nombre)
                      }}
                    >
                      {linea.nombre}
                    </span>
                  )}

                  <Trash2
                    size={14}
                    className="cursor-pointer text-slate-400 hover:text-red-500"
                    onClick={() => borrarLinea(linea.id)} // Aquí también podrías añadir una mutación delete
                  />
                </div>

                {ciclosArray.map((ciclo) => (
                  <div
                    key={ciclo}
                    onDragOver={handleDragOver}
                    // ANTES: onDrop={(e) => handleDrop(e, null, null)}
                    // AHORA: Usamos las variables 'ciclo' y 'linea.id' del map
                    onDrop={(e) => handleDrop(e, ciclo, linea.id)}
                    className="min-h-[140px] space-y-2 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 p-2"
                  >
                    {asignaturas
                      .filter(
                        (m) =>
                          m.ciclo === ciclo && m.lineaCurricularId === linea.id,
                      )
                      .map((m) => (
                        <AsignaturaCardItem
                          key={m.id}
                          asignatura={m}
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
              </div>
            )
          })}

          <div
            className="mt-6 grid gap-3 border-t pt-4"
            style={{
              gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px`,
            }}
          >
            <div className="p-2 font-bold text-slate-600">
              Totales por Ciclo
            </div>
            {ciclosArray.map((ciclo) => {
              const t = getTotalesCiclo(ciclo)
              return (
                <div
                  key={ciclo}
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
      {/* SECCIÓN DE MATERIAS SIN ASIGNAR (Mejorada para estar siempre disponible) */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Bandeja de Entrada / Asignaturas sin asignar
            </h3>
            <Badge variant="secondary">{unassignedAsignaturas.length}</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Arrastra una asignatura aquí para quitarla del mapa
          </p>
        </div>

        <div
          className={`flex min-h-[120px] flex-wrap gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
            draggedAsignatura
              ? 'border-teal-300 bg-teal-50/50'
              : 'border-slate-200 bg-white/50'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null, null)} // Limpia ciclo y línea
        >
          {unassignedAsignaturas.map((m) => (
            <div key={m.id} className="w-[200px]">
              <AsignaturaCardItem
                asignatura={m}
                isDragging={draggedAsignatura === m.id}
                onDragStart={handleDragStart}
                onClick={() => {
                  setEditingData(m) // Cargamos los datos en el estado de edición
                  setIsEditModalOpen(true)
                }}
              />
            </div>
          ))}
          {unassignedAsignaturas.length === 0 && (
            <div className="flex w-full items-center justify-center text-sm text-slate-400">
              No hay asignaturas pendientes. Arrastra una asignatura aquí para
              desasignarla.
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
                    value={editingData.creditos}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        creditos: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HD (Horas Docente)
                  </label>
                  <Input
                    type="number"
                    value={editingData.hd}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        hd: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HI (Horas Indep.)
                  </label>
                  <Input
                    type="number"
                    value={editingData.hi}
                    onChange={(e) =>
                      setEditingData({
                        ...editingData,
                        hi: Number(e.target.value),
                      })
                    }
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
                  Seriación (Prerrequisitos)
                </label>
                <Select
                  onValueChange={(val) => {
                    // Evitamos duplicados en la lista de prerrequisitos local
                    if (!editingData.prerrequisitos.includes(val)) {
                      setEditingData({
                        ...editingData,
                        prerrequisitos: [...editingData.prerrequisitos, val],
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* FILTRO CLAVE: 
                      Solo mostramos materias cuyo ID sea diferente al de la materia que estamos editando 
                  */}
                    {asignaturas
                      .filter((m) => m.id !== editingData.id)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.clave}>
                          {m.nombre} ({m.clave})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Visualización de los prerrequisitos seleccionados */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {editingData.prerrequisitos.map((pre) => (
                    <Badge
                      key={pre}
                      variant="secondary"
                      className="bg-slate-100 text-slate-600"
                    >
                      {pre}
                      <button
                        className="ml-1 hover:text-red-500"
                        onClick={() => {
                          setEditingData({
                            ...editingData,
                            prerrequisitos: editingData.prerrequisitos.filter(
                              (p) => p !== pre,
                            ),
                          })
                        }}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Fila 5: Tipo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Tipo
                </label>
                <Select
                  value={editingData.tipo}
                  onValueChange={(val: 'obligatoria' | 'optativa') =>
                    setEditingData({ ...editingData, tipo: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obligatoria">Obligatoria</SelectItem>
                    <SelectItem value="optativa">Optativa</SelectItem>
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
