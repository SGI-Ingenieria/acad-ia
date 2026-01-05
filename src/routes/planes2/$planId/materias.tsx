import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/planes2/$planId/materias')({
  component: Materias,
})

type Materia = {
  id: string;
  clave: string
  nombre: string
  creditos: number
  hd: number
  hi: number
  ciclo: string
  linea: string
  tipo: 'Obligatoria' | 'Optativa' | 'Troncal'
  estado: 'Aprobada' | 'Revisada' | 'Borrador'
}

const MATERIAS: Materia[] = [
  {
    id: "1",
    clave: 'MAT101',
    nombre: 'Cálculo Diferencial',
    creditos: 8,
    hd: 4,
    hi: 4,
    ciclo: 'Ciclo 1',
    linea: 'Formación Básica',
    tipo: 'Obligatoria',
    estado: 'Aprobada',
  },
  {
    id: "2",
    clave: 'FIS101',
    nombre: 'Física Mecánica',
    creditos: 6,
    hd: 3,
    hi: 3,
    ciclo: 'Ciclo 1',
    linea: 'Formación Básica',
    tipo: 'Obligatoria',
    estado: 'Aprobada',
  },
  {
    id: "3",
    clave: 'PRO101',
    nombre: 'Fundamentos de Programación',
    creditos: 8,
    hd: 4,
    hi: 4,
    ciclo: 'Ciclo 1',
    linea: 'Ciencias de la Computación',
    tipo: 'Obligatoria',
    estado: 'Revisada',
  },
  {
    id: "4",
    clave: 'EST101',
    nombre: 'Estructura de Datos',
    creditos: 6,
    hd: 3,
    hi: 3,
    ciclo: 'Ciclo 2',
    linea: 'Ciencias de la Computación',
    tipo: 'Obligatoria',
    estado: 'Borrador',
  },
]

function Materias() {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'Todas' | Materia['tipo']>('Todas')

  const materiasFiltradas = MATERIAS.filter((m) => {
    const okFiltro = filtro === 'Todas' || m.tipo === filtro
    const okSearch =
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.clave.toLowerCase().includes(search.toLowerCase())

    return okFiltro && okSearch
  })

  const totalCreditos = materiasFiltradas.reduce(
    (acc, m) => acc + m.creditos,
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Materias del Plan</h2>
          <p className="text-sm text-muted-foreground">
            {materiasFiltradas.length} materias · {totalCreditos} créditos
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">Clonar de mi Facultad</Button>
          <Button variant="outline">Clonar de otra Facultad</Button>
          <Button className="bg-emerald-700 hover:bg-emerald-800">
            + Nueva Materia
          </Button>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nombre o clave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <div className="flex gap-2">
          {['Todas', 'Obligatoria', 'Optativa', 'Troncal'].map((t) => (
            <Button
              key={t}
              variant={filtro === t ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFiltro(t as any)}
            >
              {t === 'Obligatoria' ? 'Obligatorias' : t}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-center">Créditos</TableHead>
              <TableHead className="text-center">HD</TableHead>
              <TableHead className="text-center">HI</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Línea</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {materiasFiltradas.map((m) => (
              <TableRow key={m.clave}>
                <TableCell className="text-muted-foreground">
                  {m.clave}
                </TableCell>
                <TableCell className="font-medium">{m.nombre}</TableCell>
                <TableCell className="text-center">{m.creditos}</TableCell>
                <TableCell className="text-center">{m.hd}</TableCell>
                <TableCell className="text-center">{m.hi}</TableCell>
                <TableCell>{m.ciclo}</TableCell>
                <TableCell>{m.linea}</TableCell>

                <TableCell>
                  <Badge variant="secondary">{m.tipo}</Badge>
                </TableCell>

                <TableCell>
                  <Badge
                  variant="secondary"
                  className={
                    m.estado === 'Aprobada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : m.estado === 'Revisada'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }
                >
                  {m.estado}
                </Badge>

                </TableCell>

                <TableCell className="text-center">
                  <Button variant="ghost" size="icon">
                    ✏️
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {materiasFiltradas.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-6 text-muted-foreground"
                >
                  No se encontraron materias
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
