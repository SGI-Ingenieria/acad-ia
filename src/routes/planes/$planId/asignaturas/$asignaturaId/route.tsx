import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  GraduationCap,
  Pencil,
  Hash,
  BookOpen,
  CalendarDays,
  Tag,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { useSubject, useUpdateAsignatura } from '@/data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  component: AsignaturaLayout,
})

// --- 1. COMPONENTE PARA EDITAR EL TÍTULO (h1) ---
function InlineEditTitle({
  value,
  onSave,
}: {
  value: string
  onSave: (val: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(value)

  useEffect(() => setTempVal(value), [value])

  const handleSave = () => {
    setIsEditing(false)
    if (tempVal.trim() && tempVal !== value) onSave(tempVal.trim())
    else setTempVal(value) // Revertir si está vacío
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        value={tempVal}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') {
            setTempVal(value)
            setIsEditing(false)
          }
        }}
        className="bg-background text-foreground border-primary focus:ring-primary/20 w-full rounded-md border-2 px-2 py-1 text-3xl font-bold shadow-sm outline-none focus:ring-4"
      />
    )
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="group text-foreground hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 text-3xl font-bold transition-colors"
    >
      {value}
      <Pencil className="text-muted-foreground hover:text-primary h-5 w-5 opacity-0 transition-all group-hover:opacity-100" />
    </h1>
  )
}

// --- 2. COMPONENTE PARA EDITAR LOS BADGES (Código, Créditos, Semestre) ---
function InlineEditBadge({
  icon,
  label,
  value,
  suffix = '',
  type = 'text',
  onSave,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  type?: 'text' | 'number'
  onSave: (val: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempVal, setTempVal] = useState(value)

  useEffect(() => setTempVal(value), [value])

  const handleSave = () => {
    setIsEditing(false)
    if (String(tempVal).trim() !== String(value)) {
      onSave(String(tempVal))
    }
  }

  if (isEditing) {
    return (
      <div className="bg-background border-primary ring-primary/20 flex h-8 items-center gap-2 rounded-md border px-3 shadow-sm ring-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}:
        </span>
        <input
          autoFocus
          type={type}
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') {
              setTempVal(value)
              setIsEditing(false)
            }
          }}
          className="text-foreground w-16 bg-transparent text-sm font-semibold outline-none"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="border-border bg-muted/30 hover:border-primary/40 hover:bg-muted group flex h-8 items-center gap-2 rounded-md border px-3 text-sm transition-all"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}:
      </span>
      <span className="text-foreground font-semibold">
        {value} {suffix}
      </span>
      <Pencil className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

interface DatosPlan {
  nombre?: string
}

function AsignaturaLayout() {
  const location = useLocation()
  const { asignaturaId, planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })

  const { data: asignaturaApi, isLoading: loadingAsig } =
    useSubject(asignaturaId)
  const updateAsignatura = useUpdateAsignatura()

  const [headerData, setHeaderData] = useState({
    codigo: '',
    nombre: '',
    creditos: 0,
    ciclo: 0,
  })

  useEffect(() => {
    if (asignaturaApi) {
      setHeaderData({
        codigo: asignaturaApi.codigo ?? '',
        nombre: asignaturaApi.nombre,
        creditos: asignaturaApi.creditos,
        ciclo: asignaturaApi.numero_ciclo ?? 0,
      })
    }
  }, [asignaturaApi])

  const handleUpdateHeader = (key: string, value: string | number) => {
    const newData = { ...headerData, [key]: value }
    setHeaderData(newData)

    const patch: Record<string, any> =
      key === 'ciclo' ? { numero_ciclo: value } : { [key]: value }

    updateAsignatura.mutate({ asignaturaId, patch })
  }

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  useEffect(() => {
    if ((location.state as any)?.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  if (loadingAsig) {
    return (
      <div className="bg-background text-foreground flex h-screen items-center justify-center">
        Cargando asignatura...
      </div>
    )
  }

  if (!asignaturaApi) return null

  return (
    <div className="bg-background min-h-screen">
      {/* HEADER DE LA ASIGNATURA */}
      <section className="bg-card border-border border-b pt-6 pb-8">
        <div className="mx-auto px-4 md:px-6 lg:px-8">
          <Link
            to="/planes/$planId/asignaturas"
            params={{ planId }}
            className="text-muted-foreground hover:text-foreground mb-4 flex w-fit items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al plan
          </Link>

          <div className="flex flex-col gap-4">
            {/* Título Editable */}
            <div className="-ml-2">
              <InlineEditTitle
                value={headerData.nombre}
                onSave={(val) => handleUpdateHeader('nombre', val)}
              />
            </div>

            {/* Fila de Metadatos Alineados */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Badge Estático del Tipo */}
              <Badge
                variant="secondary"
                className="flex h-8 items-center gap-1.5 px-3"
              >
                <Tag size={12} className="opacity-70" />
                {asignaturaApi.tipo}
              </Badge>

              {/* Badges Editables */}
              <InlineEditBadge
                icon={<Hash size={14} />}
                label="Código"
                value={headerData.codigo}
                onSave={(val) => handleUpdateHeader('codigo', val)}
              />

              <InlineEditBadge
                icon={<BookOpen size={14} />}
                label="Créditos"
                type="number"
                value={headerData.creditos}
                onSave={(val) =>
                  handleUpdateHeader('creditos', parseInt(val) || 0)
                }
              />

              <InlineEditBadge
                icon={<CalendarDays size={14} />}
                label="Semestre"
                type="number"
                value={headerData.ciclo}
                suffix="°"
                onSave={(val) =>
                  handleUpdateHeader('ciclo', parseInt(val) || 0)
                }
              />
            </div>

            {/* Subtítulo de contexto */}
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Pertenece al plan:</span>
              <span className="text-foreground font-medium">
                {(asignaturaApi.planes_estudio as DatosPlan).nombre || ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TABS NAVEGACIÓN */}
      <nav className="bg-background/80 border-border sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto px-4 py-1 md:px-6 lg:px-8">
          <div className="scrollbar-hide flex items-center justify-start gap-8 overflow-x-auto whitespace-nowrap md:justify-start">
            {[
              { label: 'Datos', to: '' },
              { label: 'Contenido', to: 'contenido' },
              { label: 'Bibliografía', to: 'bibliografia' },
              { label: 'IA', to: 'iaasignatura' },
              { label: 'Documento SEP', to: 'documento' },
              { label: 'Historial', to: 'historial' },
            ].map((tab) => {
              const isActive =
                tab.to === ''
                  ? pathname === `/planes/${planId}/asignaturas/${asignaturaId}`
                  : pathname.includes(tab.to)

              return (
                <Link
                  key={tab.label}
                  to={
                    (tab.to === ''
                      ? '/planes/$planId/asignaturas/$asignaturaId'
                      : `/planes/$planId/asignaturas/$asignaturaId/${tab.to}`) as any
                  }
                  from="/planes/$planId/asignaturas/$asignaturaId"
                  params={{ planId, asignaturaId }}
                  className={cn(
                    'shrink-0 border-b-2 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary font-bold'
                      : 'text-muted-foreground hover:border-border hover:text-foreground border-transparent',
                  )}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="mx-auto p-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  )
}
