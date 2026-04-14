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

import { AlertaConflicto } from '@/components/asignaturas/detalle/mapa/AlertaConflicto'
import { Badge } from '@/components/ui/badge'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { useSubject, useUpdateAsignatura, usePlanAsignaturas } from '@/data'
import { cn } from '@/lib/utils'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  component: AsignaturaLayout,
})

// --- 1. COMPONENTE PARA EDITAR EL TÍTULO SOBRE FONDO AZUL ---
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
        // Input estilizado para fondo oscuro: borde blanco sutil, texto blanco
        className="focus:ring-primary/40 w-full rounded-md border-2 border-white/20 bg-transparent px-2 py-1 text-3xl font-bold text-white shadow-sm outline-none focus:ring-4"
      />
    )
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      // Texto blanco por defecto, fondo blanco sutil al hover
      className="group flex cursor-pointer items-center gap-3 rounded-md px-2 py-1 text-3xl font-bold text-white transition-colors hover:bg-white/5"
    >
      {value}
      {/* Lápiz blanco sutil */}
      <Pencil className="h-5 w-5 text-white/50 opacity-0 transition-all group-hover:opacity-100 hover:text-white" />
    </h1>
  )
}

// --- 2. COMPONENTE PARA EDITAR LOS BADGES SOBRE FONDO AZUL ---
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
      // Contenedor del input con estética de badge oscuro
      <div className="focus:ring-primary/40 flex h-8 items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 shadow-sm ring-1 focus-within:ring-2">
        <span className="text-xs font-medium tracking-wider text-white/60 uppercase">
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
          // Texto blanco dentro del input
          className="w-16 bg-transparent text-sm font-semibold text-white outline-none"
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      // Badge oscuro: borde blanco sutil, texto blanco, fondo más claro al hover
      className="group flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white transition-all hover:border-white/20 hover:bg-white/10"
    >
      {/* Ícono blanco sutil */}
      <span className="text-white/70">{icon}</span>
      <span className="text-xs font-medium tracking-wider text-white/60 uppercase">
        {label}:
      </span>
      <span className="font-semibold text-white">
        {value} {suffix}
      </span>
      {/* Lápiz blanco sutil */}
      <Pencil className="h-3 w-3 text-white/50 opacity-0 transition-opacity group-hover:opacity-100" />
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
  const { data: todasLasAsignaturas } = usePlanAsignaturas(planId)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    resolve: (value: boolean) => void
    mensaje: string
  } | null>(null)
  const validarConInterrupcion = async (
    nuevoCiclo: number,
  ): Promise<boolean> => {
    if (!todasLasAsignaturas || !asignaturaApi) return true

    const materiasConflicto = todasLasAsignaturas.filter((a) => {
      const esPrerrequisitoConflictivo =
        asignaturaApi.prerrequisito_asignatura_id === a.id &&
        (a.numero_ciclo ?? 0) >= nuevoCiclo

      const esDependienteConflictiva =
        a.prerrequisito_asignatura_id === asignaturaApi.id &&
        (a.numero_ciclo ?? 0) <= nuevoCiclo

      return esPrerrequisitoConflictivo || esDependienteConflictiva
    })

    if (materiasConflicto.length === 0) return true

    const listaNombres = materiasConflicto.map((m) => m.nombre)

    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        resolve,
        mensaje: JSON.stringify({
          main: `Mover "${asignaturaApi.nombre}" al ciclo ${nuevoCiclo} genera conflictos con:`,
          materias: listaNombres,
        }),
      })
    })
  }

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

  const handleUpdateHeader = async (key: string, value: string | number) => {
    // 1. Si es ciclo, validamos antes de hacer nada
    if (key === 'ciclo') {
      const nuevoCiclo = Number(value)
      const acepto = await validarConInterrupcion(nuevoCiclo)

      setConfirmState(null) // Cerramos el modal tras la respuesta

      if (!acepto) {
        // Revertimos el estado local al valor de la API si cancela
        setHeaderData((prev) => ({
          ...prev,
          ciclo: asignaturaApi?.numero_ciclo ?? 0,
        }))
        return
      }
    }

    // 2. Si no es ciclo o si aceptó el conflicto, procedemos
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
      {/* HEADER DE LA ASIGNATURA CON TU FONDO AZUL HARDCODEADO */}
      <section className="border-border border-b bg-[#0b1d3a] pt-6 pb-8">
        <div className="mx-auto px-4 md:px-6 lg:px-8">
          <Link
            to="/planes/$planId/asignaturas"
            params={{ planId }}
            // Enlace blanco sutil
            className="mb-4 flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al plan
          </Link>

          <div className="flex flex-col gap-4">
            {/* Título Editable (Texto blanco controlado dentro del componente) */}
            <div className="-ml-2">
              <InlineEditTitle
                value={headerData.nombre}
                onSave={(val) => handleUpdateHeader('nombre', val)}
              />
            </div>

            {/* Fila de Metadatos Alineados */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Badge Estático del Tipo (Estilo oscuro sutil) */}
              <Badge
                variant="outline"
                className="flex h-8 cursor-default items-center gap-1.5 border-white/10 bg-white/5 px-3 text-white"
              >
                <Tag size={12} className="text-white/70" />
                {asignaturaApi.tipo}
              </Badge>

              {/* Badges Editables (Texto blanco controlado dentro de los componentes) */}
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

            {/* Subtítulo de contexto (Texto blanco sutil) */}
            <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
              <GraduationCap className="h-4 w-4 shrink-0 text-white/60" />
              <span>Pertenece al plan:</span>
              <span className="font-medium text-white">
                {(asignaturaApi.planes_estudio as DatosPlan).nombre || ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TABS NAVEGACIÓN (Se mantiene semántico para el cuerpo de la página) 
      <nav className="border-border bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto px-4 py-1 md:px-6 lg:px-8">
          <div className="scrollbar-hide flex items-center justify-start gap-8 overflow-x-auto whitespace-nowrap md:justify-start">
          */}
      {confirmState && (
        <AlertaConflicto
          isOpen={confirmState.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              confirmState.resolve(false)
              setConfirmState(null)
            }
          }}
          onConfirm={() => confirmState.resolve(true)}
          titulo="Conflicto de Seriación"
          descripcion={confirmState.mensaje}
        />
      )}

      {/* TABS */}

      <nav className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto p-4 py-2 md:px-6 lg:px-8">
          {/* CAMBIOS CLAVE:
        1. overflow-x-auto: Permite scroll horizontal.
        2. scrollbar-hide: (Opcional) para que no se vea la barra fea.
        3. justify-start md:justify-center: Alineado a la izquierda en móvil para que el scroll funcione, centrado en desktop.
    */}
          <div className="no-scrollbar flex items-center justify-start gap-8 overflow-x-auto whitespace-nowrap md:justify-start">
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
