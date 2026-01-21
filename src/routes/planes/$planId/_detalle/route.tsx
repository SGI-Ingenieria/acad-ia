import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import {
  ChevronLeft,
  GraduationCap,
  Clock,
  Hash,
  CalendarDays,
  Rocket,
  BookOpen,
  CheckCircle2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/planes/$planId/_detalle')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header Superior con Sombra (Volver a planes) */}
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

      {/* 2. Contenido Principal con Padding */}
      <div className="mx-auto max-w-[1600px] space-y-8 p-8">
        {/* Header del Plan y Badges */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Plan de Estudios 2024
            </h1>
            <p className="mt-1 text-lg font-medium text-slate-500">
              Ingeniería en Sistemas Computacionales
            </p>
          </div>

          {/* Badges de la derecha */}
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="gap-1 border-blue-100 bg-blue-50 px-3 text-blue-700"
            >
              <Rocket size={12} /> Ingeniería
            </Badge>
            <Badge
              variant="secondary"
              className="gap-1 border-orange-100 bg-orange-50 px-3 text-orange-700"
            >
              <BookOpen size={12} /> Licenciatura
            </Badge>
            <Badge className="gap-1 border-teal-200 bg-teal-50 px-3 text-teal-700 hover:bg-teal-100">
              <CheckCircle2 size={12} /> En Revisión
            </Badge>
          </div>
        </div>

        {/* 3. Cards de Información (Nivel, Duración, etc.) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <InfoCard
            icon={<GraduationCap className="text-slate-400" />}
            label="Nivel"
            value="Superior"
          />
          <InfoCard
            icon={<Clock className="text-slate-400" />}
            label="Duración"
            value="9 Semestres"
          />
          <InfoCard
            icon={<Hash className="text-slate-400" />}
            label="Créditos"
            value="320"
          />
          <InfoCard
            icon={<CalendarDays className="text-slate-400" />}
            label="Creación"
            value="14 ene 2024"
          />
        </div>

        {/* 4. Navegación de Tabs */}
        <div className="scrollbar-hide overflow-x-auto border-b">
          <nav className="flex min-w-max gap-8">
            <Tab to="/planes/$planId/datos" params={{ planId }}>
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

        {/* 5. Contenido del Tab */}
        <main className="animate-in fade-in pt-2 duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Sub-componente para las tarjetas de información
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 p-4 shadow-sm">
      <div className="rounded-lg border bg-white p-2 shadow-sm">{icon}</div>
      <div>
        <p className="mb-1 text-[10px] leading-none font-bold tracking-wider text-slate-400 uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  )
}

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
      activeProps={{
        className: 'border-teal-600 text-teal-700 font-bold',
      }}
    >
      {children}
    </Link>
  )
}
