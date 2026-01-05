import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { ChevronLeft, GraduationCap, Clock, Hash, CalendarDays, Rocket, BookOpen, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const Route = createFileRoute('/planes2/$planId')({
  component: PlanLayout,
})

function PlanLayout() {
  const { planId } = Route.useParams()

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header Superior con Sombra (Volver a planes) */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-2">
          <Link 
            to="/planes2" 
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors w-fit"
          >
            <ChevronLeft size={14} /> Volver a planes
          </Link>
        </div>
      </div>

      {/* 2. Contenido Principal con Padding */}
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* Header del Plan y Badges */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Plan de Estudios 2024</h1>
            <p className="text-lg text-slate-500 font-medium mt-1">
              Ingeniería en Sistemas Computacionales
            </p>
          </div>
          
          {/* Badges de la derecha */}
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 gap-1 px-3">
              <Rocket size={12} /> Ingeniería
            </Badge>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 gap-1 px-3">
              <BookOpen size={12} /> Licenciatura
            </Badge>
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 gap-1 px-3 hover:bg-teal-100">
              <CheckCircle2 size={12} /> En Revisión
            </Badge>
          </div>
        </div>

        {/* 3. Cards de Información (Nivel, Duración, etc.) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard icon={<GraduationCap className="text-slate-400" />} label="Nivel" value="Superior" />
          <InfoCard icon={<Clock className="text-slate-400" />} label="Duración" value="9 Semestres" />
          <InfoCard icon={<Hash className="text-slate-400" />} label="Créditos" value="320" />
          <InfoCard icon={<CalendarDays className="text-slate-400" />} label="Creación" value="14 ene 2024" />
        </div>

        {/* 4. Navegación de Tabs */}
        <div className="border-b overflow-x-auto scrollbar-hide">
          <nav className="flex gap-8 min-w-max">
            <Tab to="/planes2/$planId" params={{ planId }}>Datos Generales</Tab>
            <Tab to="/planes2/$planId/mapa" params={{ planId }}>Mapa Curricular</Tab>
            <Tab to="/planes2/$planId/materias" params={{ planId }}>Materias</Tab>
            <Tab to="/planes2/$planId/flujo" params={{ planId }}>Flujo y Estados</Tab>
            <Tab to="/planes2/$planId/iaplan" params={{ planId }}>IA del Plan</Tab>
            <Tab to="/planes2/$planId/documento" params={{ planId }}>Documento</Tab>
            <Tab to="/planes2/$planId/historial" params={{ planId }}>Historial</Tab>
          </nav>
        </div>

        {/* 5. Contenido del Tab */}
        <main className="pt-2 animate-in fade-in duration-500">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Sub-componente para las tarjetas de información
function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-sm">
      <div className="p-2 bg-white rounded-lg border shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  )
}

function Tab({ 
      to, 
      params, 
      children 
    }: { 
      to: string; 
      params?: any; 
      children: React.ReactNode 
    }) {
  return (
    <Link
      to={to}
      params={params}
      className="pb-3 text-sm font-medium text-slate-500 border-b-2 border-transparent hover:text-slate-800 transition-all"
      activeProps={{
        className: 'border-teal-600 text-teal-700 font-bold',
      }}
    >
      {children}
    </Link>
  )
}