import { createFileRoute, Outlet, Link, notFound } from '@tanstack/react-router'
import {
  ChevronLeft,
  GraduationCap,
  Clock,
  Hash,
  CalendarDays,
  Save,
} from 'lucide-react'
import { useState, useEffect, forwardRef } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotFoundPage } from '@/components/ui/NotFoundPage'
import { Skeleton } from '@/components/ui/skeleton'
import { plans_get } from '@/data/api/plans.api'
import { usePlan } from '@/data/hooks/usePlans'
import { qk } from '@/data/query/keys'

export const Route = createFileRoute('/planes/$planId/_detalle')({
  loader: async ({ context: { queryClient }, params: { planId } }) => {
    try {
      console.log('loader')

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Evita el salto de línea
      e.currentTarget.blur() // Quita el foco, lo que dispara el onBlur y "guarda" en el estado
    }
  }

  const handleSave = () => {
    console.log('Guardando en DB...', { nombrePlan, nivelPlan })
    // Aquí iría tu mutation
    setIsDirty(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Botón Flotante de Guardar */}
      {isDirty && (
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed right-8 bottom-8 z-50 duration-300">
          <Button
            onClick={handleSave}
            className="gap-2 rounded-full bg-teal-600 px-6 shadow-xl hover:bg-teal-700"
          >
            <Save size={16} /> Guardar cambios del Plan
          </Button>
        </div>
      )}
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
        {/* Header del Plan */}
        {isLoading ? (
          /* ===== SKELETON ===== */
          <div className="mx-auto max-w-400 p-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <DatosGeneralesSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
              <div>
                <h1 className="flex items-baseline gap-2 text-3xl font-bold tracking-tight text-slate-900">
                  <span>{nivelPlan} en</span>
                  <span
                    role="textbox"
                    tabIndex={0}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false} // Quita el subrayado rojo de error ortográfico
                    onKeyDown={handleKeyDown}
                    onBlur={(e) =>
                      setNombrePlan(e.currentTarget.textContent || '')
                    }
                    className="cursor-text border-b border-transparent decoration-transparent transition-colors outline-none select-text hover:border-slate-300 focus:border-teal-500"
                    style={{
                      WebkitTextDecoration: 'none',
                      textDecoration: 'none',
                    }} // Doble seguridad contra subrayados
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
                {/* <Badge className="gap-1 border-teal-200 bg-teal-50 px-3 text-teal-700 hover:bg-teal-100">
              <CheckCircle2 size={12} /> {data?.estados_plan?.etiqueta}
            </Badge> */}
                <Badge
                  className={`gap-1 border-teal-200 bg-teal-50 px-3 text-teal-700 hover:bg-teal-100`}
                >
                  {data?.estados_plan?.etiqueta}
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* 3. Cards de Información con Context Menu */}
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
                    setIsDirty(true)
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
            value={data?.creado_en?.split('T')[0]} // Cortamos la fecha para que no sea tan larga
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
            <Tab to="/planes/$planId/materias" params={{ planId }}>
              Materias
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
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      params={params}
      className="border-b-2 border-transparent pb-3 text-sm font-medium text-slate-500 transition-all hover:text-slate-800"
      activeProps={{ className: 'border-teal-600 text-teal-700 font-bold' }}
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
