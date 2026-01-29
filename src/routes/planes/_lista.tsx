import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import { useState, useMemo } from 'react'
import { useDebounce } from 'use-debounce'

// Componentes
import BarraBusqueda from '@/components/planes/BarraBusqueda'
import Filtro from '@/components/planes/Filtro'
import PlanEstudiosCard from '@/components/planes/PlanEstudiosCard'
// Hooks y Utils (ajusta las rutas de importación)
import { usePlanes, useCatalogosPlanes } from '@/data/hooks/usePlans'
import { getIconByName } from '@/features/planes/utils/icon-utils'

export const Route = createFileRoute('/planes/_lista')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  // 1. Estados de Filtros
  const [search, setSearch] = useState('')
  // Debounce para evitar llamadas excesivas a la API
  const [debouncedSearch] = useDebounce(search, 500)

  const [facultadSel, setFacultadSel] = useState<string>('todas')
  const [carreraSel, setCarreraSel] = useState<string>('todas')
  const [estadoSel, setEstadoSel] = useState<string>('todos')

  // Paginación (opcional si la implementas en UI)
  const [page, setPage] = useState(0)
  const pageSize = 12

  // 2. Carga de datos remotos
  const { data: catalogos } = useCatalogosPlanes()

  // Limpiamos el texto de búsqueda (quitar acentos) para enviarlo limpio a la API
  // O lo puedes limpiar en el servicio. Aquí lo enviamos tal cual viene del debounce.
  // Nota: Si usaste la solución "unaccent" en BD, envía el texto tal cual, postgres lo maneja.
  const cleanSearchTerm = debouncedSearch.trim()

  const {
    data: planesData,
    isLoading,
    isError,
  } = usePlanes({
    search: cleanSearchTerm,
    facultadId: facultadSel,
    carreraId: carreraSel,
    estadoId: estadoSel,
    limit: pageSize,
    offset: page * pageSize,
  })

  // 3. Preparación de Opciones para Selects (Derived State)
  const facultadesOptions = useMemo(
    () => [
      { value: 'todas', label: 'Todas las facultades' },
      ...(catalogos?.facultades.map((f) => ({
        value: f.id,
        label: f.nombre,
      })) ?? []),
    ],
    [catalogos?.facultades],
  )

  const carrerasOptions = useMemo(() => {
    // Filtramos las carreras del catálogo base según la facultad seleccionada
    const rawCarreras = catalogos?.carreras ?? []
    const filtered =
      facultadSel === 'todas'
        ? rawCarreras
        : rawCarreras.filter((c) => c.facultad_id === facultadSel)

    return [
      { value: 'todas', label: 'Todas las carreras' },
      ...filtered.map((c) => ({ value: c.id, label: c.nombre })),
    ]
  }, [catalogos?.carreras, facultadSel])

  const estadosOptions = useMemo(
    () => [
      { value: 'todos', label: 'Todos los estados' },
      ...(catalogos?.estados.map((e) => ({ value: e.id, label: e.etiqueta })) ??
        []),
    ],
    [catalogos?.estados],
  )

  // 4. Handlers
  const resetFilters = () => {
    setSearch('')
    setFacultadSel('todas')
    setCarreraSel('todas')
    setEstadoSel('todos')
    setPage(0)
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(0) // Resetear página al buscar
  }

  // Renderizado condicional básico
  if (isError)
    return <div className="p-8 text-red-500">Error cargando planes.</div>

  return (
    <main className="bg-background min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* Header y Botón Nuevo */}
          <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <Icons.BookOpenText className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h1 className="font-display text-foreground text-2xl font-bold">
                  Planes de Estudio
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gestiona los planes curriculares de tu institución
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('planId')

                navigate({ to: '/planes/nuevo', resetScroll: false })
              }}
              className="ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-sm font-medium shadow-md transition-colors"
            >
              <Icons.Plus /> Nuevo plan de estudios
            </button>
          </div>

          {/* Barra de Filtros */}
          <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <BarraBusqueda
                value={search}
                onChange={handleSearchChange}
                placeholder="Buscar por programa..."
              />
            </div>
            <div className="flex flex-col items-stretch justify-between gap-2 lg:flex-row lg:items-center">
              <div className="w-full lg:w-44">
                <Filtro
                  options={facultadesOptions}
                  value={facultadSel}
                  onChange={(v) => {
                    setFacultadSel(v)
                    setCarreraSel('todas')
                    setPage(0)
                  }}
                  placeholder="Facultad"
                />
              </div>
              <div className="w-full lg:w-44">
                <Filtro
                  options={carrerasOptions}
                  value={carreraSel}
                  onChange={(v) => {
                    setCarreraSel(v)
                    setPage(0)
                  }}
                  placeholder="Carrera"
                  disabled={facultadSel === 'todas'}
                />
              </div>
              <div className="w-full lg:w-44">
                <Filtro
                  options={estadosOptions}
                  value={estadoSel}
                  onChange={(v) => {
                    setEstadoSel(v)
                    setPage(0)
                  }}
                  placeholder="Estado"
                />
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium shadow-md transition-colors"
              >
                <Icons.X className="h-4 w-4" /> Limpiar
              </button>
            </div>
          </div>

          {/* Grid de Resultados */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Skeleton básico o Spinner */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 w-full animate-pulse rounded-xl bg-gray-100/50"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {planesData?.data.map((plan) => {
                // Mapeo de datos: DB -> Props Componente
                const facultad = plan.carreras?.facultades
                const estado = plan.estados_plan

                // NOTA: El color del estado no viene en BD por defecto,
                // puedes crear un mapa de colores o agregar columna 'color' a tabla 'estados_plan'
                // Aquí uso un fallback simple.
                const estadoColor = estado?.es_final
                  ? 'bg-emerald-600'
                  : 'bg-amber-600'

                return (
                  <PlanEstudiosCard
                    key={plan.id}
                    Icono={getIconByName(facultad?.icono ?? null)}
                    nombrePrograma={plan.nombre}
                    nivel={plan.nivel}
                    ciclos={`${plan.numero_ciclos} ${plan.tipo_ciclo.toLowerCase()}s`}
                    facultad={facultad?.nombre ?? 'Sin Facultad'}
                    estado={estado?.etiqueta ?? 'Desconocido'}
                    claseColorEstado={estadoColor}
                    colorFacultad={facultad?.color ?? '#000000'}
                    onClick={() =>
                      navigate({
                        to: '/planes/$planId',
                        params: {
                          planId: plan.id,
                        },
                        state: {
                          realId: plan.id, // 👈 ID largo oculto
                        } as any,
                      })
                    }
                  />
                )
              })}

              {planesData?.data.length === 0 && (
                <div className="text-muted-foreground col-span-full py-10 text-center">
                  No se encontraron planes con estos filtros.
                </div>
              )}
            </div>
          )}
        </div>
        <Outlet />
      </div>
    </main>
  )
}
