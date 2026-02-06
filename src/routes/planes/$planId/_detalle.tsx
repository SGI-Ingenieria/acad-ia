import { createFileRoute, Outlet, Link, notFound } from '@tanstack/react-router'
import {
  ChevronLeft,
  GraduationCap,
  Clock,
  Hash,
  CalendarDays,
} from 'lucide-react'
import { useState, useEffect, forwardRef } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotFoundPage } from '@/components/ui/NotFoundPage'
import { Skeleton } from '@/components/ui/skeleton'
import { plans_get } from '@/data/api/plans.api'
import { usePlan, useUpdatePlanFields } from '@/data/hooks/usePlans'
import { qk } from '@/data/query/keys'

export const Route = createFileRoute('/planes/$planId/_detalle')({
  loader: async ({ context: { queryClient }, params: { planId } }) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: qk.plan(planId),
        queryFn: () => plans_get(planId),
      })
    } catch (e: any) {
      // PGRST116: The result contains 0 rows
      if (e?.code === 'PGRST116') {
        throw notFound()
      }
      throw e
    }
  },
  notFoundComponent: () => {
    return (
      <NotFoundPage
        title="Plan de Estudios no encontrado"
        message="El plan de estudios que intentas consultar no existe o no tienes permisos para verlo."
      />
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  const { data, isLoading } = usePlan(planId)
  const { mutate } = useUpdatePlanFields()

  // Estados locales para manejar la edición "en vivo" antes de persistir
  const [nombrePlan, setNombrePlan] = useState('')
  const [nivelPlan, setNivelPlan] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (data) {
      setNombrePlan(data.nombre || '')
      setNivelPlan(data.nivel || '')
    }
  }, [data])

  const niveles = [
    'Licenciatura',
    'Maestría',
    'Doctorado',
    'Diplomado',
    'Especialidad',
  ]

  const persistChange = (patch: any) => {
    mutate({ planId, patch })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur() // Esto disparará el onBlur automáticamente
    }
  }

  const handleBlurNombre = (e: React.FocusEvent<HTMLSpanElement>) => {
    const nuevoNombre = e.currentTarget.textContent || ''
    setNombrePlan(nuevoNombre)

    // Solo guardamos si el valor es realmente distinto al de la base de datos
    if (nuevoNombre !== data?.nombre) {
      persistChange({ nombre: nuevoNombre })
    }
  }

  const handleSelectNivel = (n: string) => {
    setNivelPlan(n)
    // Guardamos inmediatamente al seleccionar
    if (n !== data?.nivel) {
      persistChange({ nivel: n })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header Superior */}
      <div className="sticky top-0 z-20 border-b bg-white/50 shadow-sm backdrop-blur-sm">
        <div className="px-6 py-2">
          <Link
            to="/planes"
            className="flex w-fit items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-800"
          >
            <ChevronLeft size={14} /> Volver a planes
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-400 space-y-8 p-8">
        {/* 2. Header del Plan */}
        {isLoading ? (
          /* ===== SKELETON ===== */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <DatosGeneralesSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
            <div>
              <h1 className="flex items-baseline gap-2 text-3xl font-bold tracking-tight text-slate-900">
                <span>{nivelPlan} en</span>
                <span
                  role="textbox"
                  tabIndex={0}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    const nuevoNombre = e.currentTarget.textContent || ''
                    setNombrePlan(nuevoNombre)
                    if (nuevoNombre !== data?.nombre) {
                      mutate({ planId, patch: { nombre: nuevoNombre } })
                    }
                  }}
                  className="cursor-text border-b border-transparent transition-colors outline-none select-text hover:border-slate-300 focus:border-teal-500"
                  style={{ textDecoration: 'none' }}
                >
                  {nombrePlan}
                </span>
              </h1>
              <p className="mt-1 text-lg font-medium text-slate-500">
                {data?.carreras?.facultades?.nombre}{' '}
                {data?.carreras?.nombre_corto}
              </p>
            </div>

            <div className="flex gap-2">
              <Badge className="gap-1 border-teal-200 bg-teal-50 px-3 text-teal-700 hover:bg-teal-100">
                {data?.estados_plan?.etiqueta}
              </Badge>
            </div>
          </div>
        )}

        {/* 3. Cards de Información */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InfoCard
                icon={<GraduationCap className="text-slate-400" />}
                label="Nivel"
                value={nivelPlan}
                isEditable
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48">
              {niveles.map((n) => (
                <DropdownMenuItem
                  key={n}
                  onClick={() => {
                    setNivelPlan(n)
                    if (n !== data?.nivel) {
                      mutate({ planId, patch: { nivel: n } })
                    }
                  }}
                >
                  {n}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <InfoCard
            icon={<Clock className="text-slate-400" />}
            label="Duración"
            value={`${data?.numero_ciclos || 0} Ciclos`}
          />
          <InfoCard
            icon={<Hash className="text-slate-400" />}
            label="Créditos"
            value="320"
          />
          <InfoCard
            icon={<CalendarDays className="text-slate-400" />}
            label="Creación"
            value={data?.creado_en?.split('T')[0]}
          />
        </div>

        {/* 4. Navegación de Tabs */}
        <div className="scrollbar-hide overflow-x-auto border-b">
          <nav className="flex min-w-max gap-8">
            <Tab to="/planes/$planId/" params={{ planId }}>
              Datos Generales
            </Tab>
            <Tab to="/planes/$planId/mapa" params={{ planId }}>
              Mapa Curricular
            </Tab>
            <Tab to="/planes/$planId/asignaturas" params={{ planId }}>
              Asignaturas
            </Tab>
            <Tab to="/planes/$planId/flujo" params={{ planId }}>
              Flujo y Estados
            </Tab>
            <Tab to="/planes/$planId/iaplan" params={{ planId }}>
              IA del Plan
            </Tab>
            <Tab to="/planes/$planId/documento" params={{ planId }}>
              Documento
            </Tab>
            <Tab to="/planes/$planId/historial" params={{ planId }}>
              Historial
            </Tab>
          </nav>
        </div>

        <main className="animate-in fade-in pt-2 duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const InfoCard = forwardRef<
  HTMLDivElement,
  {
    icon: React.ReactNode
    label: string
    value: string | number | undefined
    isEditable?: boolean
  } & React.HTMLAttributes<HTMLDivElement>
>(function InfoCard(
  { icon, label, value, isEditable, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      {...props}
      className={`flex h-18 w-full items-center gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm transition-all ${
        isEditable
          ? 'cursor-pointer hover:border-teal-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40'
          : ''
      } ${className ?? ''}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-700">
          {value || '---'}
        </p>
      </div>
    </div>
  )
})

function Tab({
  to,
  params,
  children,
}: {
  to: string
  params?: any
  search?: any
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      params={params}
      className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition-all hover:text-slate-800"
      activeProps={{ className: 'border-teal-600 text-teal-700 font-bold' }}
      activeOptions={{
        exact: true,
      }}
    >
      {children}
    </Link>
  )
}

function DatosGeneralesSkeleton() {
  return (
    <div className="rounded-xl border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* Content */}
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-9/12" />
      </div>
    </div>
  )
}
