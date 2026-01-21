import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Copy,
  Search,
  Filter,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { useState, useMemo } from 'react'

import type { Materia } from '@/types/plan'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePlanAsignaturas, usePlanLineas } from '@/data'

// --- Configuración de Estilos ---
const statusConfig: Record<string, { label: string; className: string }> = {
  borrador: { label: 'Borrador', className: 'bg-slate-100 text-slate-600' },
  revisada: { label: 'Revisada', className: 'bg-amber-100 text-amber-700' },
  aprobada: { label: 'Aprobada', className: 'bg-emerald-100 text-emerald-700' },
}

const tipoConfig: Record<string, { label: string; className: string }> = {
  obligatoria: { label: 'Obligatoria', className: 'bg-blue-100 text-blue-700' },
  optativa: { label: 'Optativa', className: 'bg-purple-100 text-purple-700' },
  troncal: { label: 'Troncal', className: 'bg-slate-100 text-slate-700' },
}

// --- Mapeadores de API ---
const mapAsignaturas = (asigApi: Array<any> = []): Array<Materia> => {
  return asigApi.map((asig) => ({
    id: asig.id,
    clave: asig.codigo,
    nombre: asig.nombre,
    creditos: asig.creditos ?? 0,
    ciclo: asig.numero_ciclo ?? null,
    lineaCurricularId: asig.linea_plan_id ?? null,
    tipo:
      asig.tipo?.toLowerCase() === 'obligatoria' ? 'obligatoria' : 'optativa',
    estado: 'borrador', // O el campo que venga de tu API
    hd: Math.floor((asig.horas_semana ?? 0) / 2),
    hi: Math.ceil((asig.horas_semana ?? 0) / 2),
  }))
}

export const Route = createFileRoute('/planes/$planId/_detalle/materias')({
  component: MateriasPage,
})

function MateriasPage() {
  const { planId } = Route.useParams()
  const navigate = useNavigate()

  // 1. Fetch de datos reales
  const { data: asignaturasApi, isLoading: loadingAsig } =
    usePlanAsignaturas(planId)
  const { data: lineasApi, isLoading: loadingLineas } = usePlanLineas(planId)

  // 2. Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterLinea, setFilterLinea] = useState<string>('all')

  // 3. Procesamiento de datos
  const materias = useMemo(
    () => mapAsignaturas(asignaturasApi),
    [asignaturasApi],
  )
  const lineas = useMemo(() => lineasApi || [], [lineasApi])

  const filteredMaterias = materias.filter((m) => {
    const matchesSearch =
      m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clave.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTipo = filterTipo === 'all' || m.tipo === filterTipo
    const matchesEstado = filterEstado === 'all' || m.estado === filterEstado
    const matchesLinea =
      filterLinea === 'all' || m.lineaCurricularId === filterLinea

    return matchesSearch && matchesTipo && matchesEstado && matchesLinea
  })

  const getLineaNombre = (lineaId: string | null) => {
    if (!lineaId) return 'Sin asignar'
    return lineas.find((l: any) => l.id === lineaId)?.nombre || 'Desconocida'
  }

  if (loadingAsig || loadingLineas) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground text-xl font-bold">
            Materias del Plan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {materias.length} materias en total • {filteredMaterias.length}{' '}
            filtradas
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" /> Clonar
          </Button>
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            <Plus className="mr-2 h-4 w-4" /> Nueva Materia
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Avanzada */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-slate-50 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nombre o clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-muted-foreground mr-1 h-4 w-4" />

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="obligatoria">Obligatoria</SelectItem>
              <SelectItem value="optativa">Optativa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="revisada">Revisada</SelectItem>
              <SelectItem value="aprobada">Aprobada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterLinea} onValueChange={setFilterLinea}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Línea" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las líneas</SelectItem>
              {lineas.map((linea: any) => (
                <SelectItem key={linea.id} value={linea.id}>
                  {linea.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla Pro */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[120px]">Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Créditos</TableHead>
              <TableHead className="text-center">Ciclo</TableHead>
              <TableHead>Línea Curricular</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="text-muted-foreground flex flex-col items-center justify-center">
                    <BookOpen className="mb-2 h-10 w-10 opacity-20" />
                    <p className="font-medium">No se encontraron materias</p>
                    <p className="text-xs">
                      Intenta cambiar los filtros de búsqueda
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterias.map((materia) => (
                <TableRow
                  key={materia.id}
                  className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                  onClick={() =>
                    navigate({
                      to: '/planes/$planId/asignaturas/$asignaturaId',
                      params: {
                        planId,
                        asignaturaId: materia.id, // 👈 puede ser índice, consecutivo o slug
                      },
                      state: {
                        realId: materia.id, // 👈 ID largo oculto
                      } as any,
                    })
                  }
                >
                  <TableCell className="font-mono text-xs font-bold text-slate-400">
                    {materia.clave}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    {materia.nombre}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {materia.creditos}
                  </TableCell>
                  <TableCell className="text-center">
                    {materia.ciclo ? (
                      <Badge variant="outline" className="font-normal">
                        Ciclo {materia.ciclo}
                      </Badge>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {getLineaNombre(materia.lineaCurricularId)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize shadow-sm ${tipoConfig[materia.tipo]?.className}`}
                    >
                      {tipoConfig[materia.tipo]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`capitalize shadow-sm ${statusConfig[materia.estado]?.className}`}
                    >
                      {statusConfig[materia.estado]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
