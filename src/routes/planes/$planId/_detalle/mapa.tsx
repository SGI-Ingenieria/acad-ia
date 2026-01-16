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

import type { Materia, LineaCurricular } from '@/types/plan'

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
import { usePlanAsignaturas, usePlanLineas } from '@/data'

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

const mapAsignaturasToMaterias = (asigApi: Array<any> = []): Array<Materia> => {
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
    hd: Math.floor((asig.horas_semana ?? 0) / 2),
    hi: Math.ceil((asig.horas_semana ?? 0) / 2),
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

function MateriaCardItem({
  materia,
  onDragStart,
  isDragging,
  onClick,
}: {
  materia: Materia
  onDragStart: (e: React.DragEvent, id: string) => void
  isDragging: boolean
  onClick: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, materia.id)}
      onClick={onClick}
      className={`group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all active:cursor-grabbing ${
        isDragging
          ? 'scale-95 opacity-40'
          : 'hover:border-teal-400 hover:shadow-md'
      }`}
    >
      <div className="mb-1 flex items-start justify-between">
        <span className="font-mono text-[10px] font-bold text-slate-400">
          {materia.clave}
        </span>
        <Badge
          variant="outline"
          className={`px-1 py-0 text-[9px] uppercase ${statusBadge[materia.estado] || ''}`}
        >
          {materia.estado}
        </Badge>
      </div>
      <p className="mb-1 text-xs leading-tight font-bold text-slate-700">
        {materia.nombre}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          {materia.creditos} CR • HD:{materia.hd} • HI:{materia.hi}
        </span>
        <GripVertical
          size={12}
          className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/planes/$planId/_detalle/mapa')({
  component: MapaCurricularPage,
})

function MapaCurricularPage() {
  const { planId } = Route.useParams() // Idealmente usa el ID de la ruta

  // 1. Fetch de Datos
  const { data: asignaturasApi, isLoading: loadingAsig } = usePlanAsignaturas(
    /* planId*/ '0e0aea4d-b8b4-4e75-8279-6224c3ac769f',
  )
  const { data: lineasApi, isLoading: loadingLineas } = usePlanLineas(
    /* planId*/ '0e0aea4d-b8b4-4e75-8279-6224c3ac769f',
  )

  // 2. Estado Local (Para interactividad)
  const [materias, setMaterias] = useState<Array<Materia>>([])
  const [lineas, setLineas] = useState<Array<LineaCurricular>>([])
  const [draggedMateria, setDraggedMateria] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null)
  const [hasAreaComun, setHasAreaComun] = useState(false)
  const [nombreNuevaLinea, setNombreNuevaLinea] = useState('') // Para el input de nombre personalizado

  const manejarAgregarLinea = (nombre: string) => {
    const nombreNormalizado = nombre.trim()

    // Validar si es Área Común (insensible a mayúsculas/minúsculas)
    const esAreaComun =
      nombreNormalizado.toLowerCase() === 'área común' ||
      nombreNormalizado.toLowerCase() === 'area comun'

    if (esAreaComun && hasAreaComun) {
      alert('El Área Común ya ha sido agregada.')
      return
    }

    const nueva = {
      id: crypto.randomUUID(),
      nombre: nombreNormalizado,
      orden: lineas.length + 1,
    }

    setLineas([...lineas, nueva])

    if (esAreaComun) {
      setHasAreaComun(true)
    }
    setNombreNuevaLinea('') // Limpiar input
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
    if (asignaturasApi) setMaterias(mapAsignaturasToMaterias(asignaturasApi))
  }, [asignaturasApi])

  useEffect(() => {
    if (lineasApi) setLineas(mapLineasToLineaCurricular(lineasApi))
  }, [lineasApi])

  const ciclosTotales = 9
  const ciclosArray = Array.from({ length: ciclosTotales }, (_, i) => i + 1)

  // Nuevo estado para controlar los datos temporales del modal de edición
  const [editingData, setEditingData] = useState<Materia | null>(null)

  // 1. FUNCION DE GUARDAR MODAL
  const handleSaveChanges = () => {
    if (!editingData) return
    console.log(materias)

    setMaterias((prev) =>
      prev.map((m) => (m.id === editingData.id ? { ...editingData } : m)),
    )
    setIsEditModalOpen(false)
  }

  // 2. MODIFICACIÓN: Zona de soltado siempre visible
  // Cambiamos la condición: Mostramos la sección si hay materias sin asignar
  // O si simplemente queremos tener el "depósito" disponible.
  const unassignedMaterias = materias.filter((m) => m.ciclo === null)

  // --- Lógica de Gestión ---
  const agregarLinea = (nombre: string) => {
    const nueva = { id: crypto.randomUUID(), nombre, orden: lineas.length + 1 }
    setLineas([...lineas, nueva])
  }

  const borrarLinea = (id: string) => {
    setMaterias((prev) =>
      prev.map((m) =>
        m.lineaCurricularId === id
          ? { ...m, ciclo: null, lineaCurricularId: null }
          : m,
      ),
    )
    setLineas((prev) => prev.filter((l) => l.id !== id))
  }

  // --- Selectores/Cálculos ---
  const getTotalesCiclo = (ciclo: number) => {
    return materias
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
    return materias
      .filter((m) => m.lineaCurricularId === lineaId && m.ciclo !== null)
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
    setDraggedMateria(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (
    e: React.DragEvent,
    ciclo: number | null,
    lineaId: string | null,
  ) => {
    e.preventDefault()
    if (draggedMateria) {
      setMaterias((prev) =>
        prev.map((m) =>
          m.id === draggedMateria
            ? { ...m, ciclo, lineaCurricularId: lineaId }
            : m,
        ),
      )
      setDraggedMateria(null)
    }
  }

  const stats = useMemo(
    () =>
      materias.reduce(
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
    [materias],
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
            Organiza las materias de la petición por línea y ciclo
          </p>
        </div>
        <div className="flex items-center gap-3">
          {materias.filter((m) => !m.ciclo).length > 0 && (
            <Badge className="border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-50">
              <AlertTriangle size={14} className="mr-1" />{' '}
              {materias.filter((m) => !m.ciclo).length} sin asignar
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
                  <span className="text-xs font-bold">{linea.nombre}</span>
                  <Trash2
                    size={14}
                    className="cursor-pointer text-slate-400 hover:text-red-500"
                    onClick={() => borrarLinea(linea.id)}
                  />
                </div>

                {ciclosArray.map((ciclo) => (
                  <div
                    key={ciclo}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, ciclo, linea.id)}
                    className="min-h-[140px] space-y-2 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 p-2"
                  >
                    {materias
                      .filter(
                        (m) =>
                          m.ciclo === ciclo && m.lineaCurricularId === linea.id,
                      )
                      .map((m) => (
                        <MateriaCardItem
                          key={m.id}
                          materia={m}
                          isDragging={draggedMateria === m.id}
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

      {/* Materias Sin Asignar */}
      {/* SECCIÓN DE MATERIAS SIN ASIGNAR (Mejorada para estar siempre disponible) */}
      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <h3 className="text-sm font-bold tracking-wider uppercase">
              Bandeja de Entrada / Materias sin asignar
            </h3>
            <Badge variant="secondary">{unassignedMaterias.length}</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Arrastra una materia aquí para quitarla del mapa
          </p>
        </div>

        <div
          className={`flex min-h-[120px] flex-wrap gap-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
            draggedMateria
              ? 'border-teal-300 bg-teal-50/50'
              : 'border-slate-200 bg-white/50'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null, null)} // Limpia ciclo y línea
        >
          {unassignedMaterias.map((m) => (
            <div key={m.id} className="w-[200px]">
              <MateriaCardItem
                materia={m}
                isDragging={draggedMateria === m.id}
                onDragStart={handleDragStart}
                onClick={() => {
                  setEditingData(m) // Cargamos los datos en el estado de edición
                  setIsEditModalOpen(true)
                }}
              />
            </div>
          ))}
          {unassignedMaterias.length === 0 && (
            <div className="flex w-full items-center justify-center text-sm text-slate-400">
              No hay materias pendientes. Arrastra una materia aquí para
              desasignarla.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-bold text-slate-700">
              Editar Materia
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
                  <Input type="number" value={editingData.creditos} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HD (Horas Docente)
                  </label>
                  <Input type="number" value={editingData.hd} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    HI (Horas Indep.)
                  </label>
                  <Input type="number" value={editingData.hi} />
                </div>
              </div>

              {/* Fila 3: Ciclo y Línea */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Ciclo
                  </label>
                  <Select value={editingData.ciclo?.toString() || 'null'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select value={editingData.lineaCurricularId || 'null'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lineas.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fila 4: Seriación (Igual a tu imagen) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Seriación (Prerrequisitos)
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar materia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((m) => (
                      <SelectItem key={m.id} value={m.clave}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex gap-2">
                  {/* Aquí usamos el array vacío que inicializamos en el mapeador */}
                  {editingData.prerrequisitos.map((pre) => (
                    <Badge
                      key={pre}
                      variant="secondary"
                      className="bg-slate-100 text-slate-600"
                    >
                      {pre} <span className="ml-1 cursor-pointer">×</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Fila 5: Tipo */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Tipo
                </label>
                <Select value={editingData.tipo}>
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
