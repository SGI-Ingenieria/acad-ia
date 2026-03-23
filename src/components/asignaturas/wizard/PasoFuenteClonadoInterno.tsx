import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useDebounce } from 'use-debounce'

import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

import Pagination03 from '@/components/shadcn-studio/pagination/pagination-03'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabaseBrowser, useCatalogosPlanes, usePlanes } from '@/data'
import { cn } from '@/lib/utils'

type SourceSubjectRow = {
  id: string
  nombre: string
  codigo: string | null
  creditos: number
  tipo: any
  plan_estudio_id: string
  estructura_id: string | null
}

const ALL = '__all__'

const normalizeLikeTerm = (term: string) =>
  term.trim().replace(/[(),]/g, ' ').replace(/\s+/g, ' ')

export function PasoFuenteClonadoInterno({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
}) {
  const pageSize = 20

  const facultadId = wizard.clonInterno?.facultadId ?? null
  const carreraId = wizard.clonInterno?.carreraId ?? null
  const planOrigenId = wizard.clonInterno?.planOrigenId ?? null
  const search = wizard.clonInterno?.search ?? ''
  const page = Math.max(1, wizard.clonInterno?.page ?? 1)

  const [debouncedSearch] = useDebounce(search, 350)

  const { data: catalogos } = useCatalogosPlanes()

  const carrerasOptions = useMemo(() => {
    const raw = catalogos?.carreras ?? []
    return facultadId ? raw.filter((c) => c.facultad_id === facultadId) : raw
  }, [catalogos?.carreras, facultadId])

  const planesQuery = usePlanes({
    search: '',
    facultadId: facultadId ?? 'todas',
    carreraId: carreraId ?? 'todas',
    estadoId: 'todos',
    limit: 500,
    offset: 0,
  } as any)

  const needPlansForFilter = Boolean((facultadId || carreraId) && !planOrigenId)
  const plansForFilter = planesQuery.data?.data ?? []

  const { data: subjectsPaged, isLoading: subjectsLoading } = useQuery({
    queryKey: [
      'asignaturas',
      'clone-source',
      {
        facultadId,
        carreraId,
        planOrigenId,
        search: debouncedSearch,
        page,
        pageSize,
        planIdsKey: needPlansForFilter
          ? plansForFilter.map((p) => p.id).join(',')
          : null,
      },
    ],
    enabled: !needPlansForFilter || !planesQuery.isLoading,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const supabase = supabaseBrowser()

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let q = supabase
        .from('asignaturas')
        .select(
          'id,nombre,codigo,creditos,tipo,plan_estudio_id,estructura_id',
          {
            count: 'exact',
          },
        )
        .order('nombre', { ascending: true })

      if (planOrigenId) {
        q = q.eq('plan_estudio_id', planOrigenId)
      } else if (needPlansForFilter) {
        const planIds = plansForFilter.map((p) => p.id)
        if (!planIds.length) {
          return { data: [] as Array<SourceSubjectRow>, count: 0 }
        }
        q = q.in('plan_estudio_id', planIds)
      }

      const term = normalizeLikeTerm(debouncedSearch)
      if (term) {
        // PostgREST OR syntax
        q = q.or(`nombre.ilike.%${term}%,codigo.ilike.%${term}%`)
      }

      q = q.range(from, to)

      const { data, error, count } = await q
      if (error) throw new Error(error.message)

      return {
        data: data as unknown as Array<SourceSubjectRow>,
        count: count ?? 0,
      }
    },
  })

  const subjects = subjectsPaged?.data ?? []
  const total = subjectsPaged?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    // clamp page if results shrink
    if (page > pageCount) {
      onChange((w) => ({
        ...w,
        clonInterno: { ...(w.clonInterno ?? {}), page: pageCount },
      }))
    }
  }, [onChange, page, pageCount])

  const patchClonInterno = (
    patch: Partial<NonNullable<NewSubjectWizardState['clonInterno']>>,
  ) =>
    onChange((w) => ({
      ...w,
      clonInterno: { ...(w.clonInterno ?? {}), ...patch },
    }))

  const hasAnyFilter = Boolean(
    facultadId || carreraId || planOrigenId || search.trim().length,
  )

  const clearDisabled = !hasAnyFilter

  const selectedId = wizard.clonInterno?.asignaturaOrigenId ?? null

  const resetSelection = () => patchClonInterno({ asignaturaOrigenId: null })

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fuente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <Label>Facultad</Label>
              <Select
                value={facultadId ?? ALL}
                onValueChange={(val) => {
                  const next = val === ALL ? null : val
                  patchClonInterno({
                    facultadId: next,
                    carreraId: null,
                    planOrigenId: null,
                    page: 1,
                  })
                  resetSelection()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {(catalogos?.facultades ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Carrera</Label>
              <Select
                value={carreraId ?? ALL}
                onValueChange={(val) => {
                  const next = val === ALL ? null : val
                  patchClonInterno({
                    carreraId: next,
                    planOrigenId: null,
                    page: 1,
                  })
                  resetSelection()
                }}
                disabled={!facultadId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={facultadId ? 'Todas' : 'Selecciona facultad'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {carrerasOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <Label>Plan</Label>
              <Select
                value={planOrigenId ?? ALL}
                onValueChange={(val) => {
                  const next = val === ALL ? null : val
                  patchClonInterno({ planOrigenId: next, page: 1 })
                  resetSelection()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {(planesQuery.data?.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <Label>Buscar</Label>
              <Input
                placeholder="Nombre o código..."
                value={search}
                onChange={(e) =>
                  patchClonInterno({ search: e.target.value, page: 1 })
                }
              />
            </div>
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  patchClonInterno({
                    facultadId: null,
                    carreraId: null,
                    planOrigenId: null,
                    search: '',
                    page: 1,
                    asignaturaOrigenId: null,
                  })
                }}
                disabled={clearDisabled}
              >
                <Icons.X className="mr-2 h-4 w-4" />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <div className="text-muted-foreground text-xs">
          Selecciona una asignatura fuente (solo una).
        </div>

        <div className="grid max-h-80 gap-2 overflow-y-auto">
          {subjectsLoading ? (
            <div className="text-muted-foreground text-sm">
              Cargando asignaturas…
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No hay asignaturas con esos filtros.
            </div>
          ) : (
            subjects.map((m) => {
              const active = String(selectedId) === String(m.id)
              return (
                <label
                  key={m.id}
                  className={cn(
                    'hover:bg-accent flex cursor-pointer items-center justify-between rounded-md border p-3 text-left',
                    active && 'border-primary bg-primary/5 ring-primary ring-1',
                  )}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="asignaturaFuente"
                    checked={active}
                    onChange={() =>
                      patchClonInterno({ asignaturaOrigenId: m.id, page })
                    }
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.nombre}</div>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {(m.codigo ? m.codigo : '—') +
                        ' • ' +
                        String(m.creditos) +
                        ' créditos'}
                    </div>
                  </div>
                  {active ? (
                    <Icons.CheckCircle2 className="text-primary h-5 w-5 flex-none" />
                  ) : (
                    <span className="h-5 w-5 flex-none" aria-hidden />
                  )}
                </label>
              )
            })
          )}
        </div>

        {pageCount > 1 ? (
          <Pagination03
            page={page}
            pageCount={pageCount}
            onPageChange={(nextPage) => patchClonInterno({ page: nextPage })}
          />
        ) : null}
      </div>
    </div>
  )
}
