import {
  createFileRoute,
  Outlet,
  Link,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { useSubject, useUpdateAsignatura } from '@/data'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  component: AsignaturaLayout,
})

function EditableHeaderField({
  value,
  onSave,
  className,
}: {
  value: string | number
  onSave: (val: string) => void
  className?: string
}) {
  const textValue = String(value)

  // Manejador para cuando el usuario termina de editar (pierde el foco)
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    const newValue = e.currentTarget.innerText
    if (newValue !== textValue) {
      onSave(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur() // Forzamos el guardado al presionar Enter
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      contentEditable
      suppressContentEditableWarning={true} // Evita el warning de React por tener hijos y contentEditable
      spellCheck={false}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`inline-block cursor-text rounded-sm px-1 transition-all hover:bg-white/10 focus:bg-white/20 focus:ring-2 focus:ring-blue-400/50 focus:outline-none ${className ?? ''} `}
    >
      {textValue}
    </span>
  )
}
interface DatosPlan {
  nombre?: string
}

function AsignaturaLayout() {
  const routerState = useRouterState()
  const state = routerState.location.state as any
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { data: asignaturaApi, isLoading: loadingAsig } =
    useSubject(asignaturaId)
  // 1. Asegúrate de tener estos estados en tu componente principal

  const updateAsignatura = useUpdateAsignatura()

  // Dentro de AsignaturaDetailPage
  const [headerData, setHeaderData] = useState({
    codigo: '',
    nombre: '',
    creditos: 0,
    ciclo: 0,
  })

  // Sincronizar cuando llegue la API
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
      key === 'ciclo'
        ? { numero_ciclo: value }
        : {
            [key]: value,
          }

    updateAsignatura.mutate({
      asignaturaId,
      patch,
    })
  }

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  if (loadingAsig) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1d3a] text-white">
        Cargando asignatura...
      </div>
    )
  }

  // Si no hay datos y no está cargando, algo falló
  if (!asignaturaApi) return null

  return (
    <div>
      <section className="bg-gradient-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            to="/planes/$planId/asignaturas"
            params={{ planId }}
            className="mb-4 flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al plan
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              {/* CÓDIGO EDITABLE */}
              <Badge className="border border-blue-700 bg-blue-900/50">
                <EditableHeaderField
                  value={headerData.codigo}
                  onSave={(val) => handleUpdateHeader('codigo', val)}
                />
              </Badge>

              {/* NOMBRE EDITABLE */}
              <h1 className="text-3xl font-bold">
                <EditableHeaderField
                  value={headerData.nombre}
                  onSave={(val) => handleUpdateHeader('nombre', val)}
                />
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span className="text-blue-100">
                    {(asignaturaApi.planes_estudio?.datos as DatosPlan)
                      .nombre || ''}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <span className="text-blue-100">
                    {(asignaturaApi.planes_estudio?.datos as DatosPlan)
                      .nombre ?? ''}
                  </span>
                </span>
              </div>

              <p className="text-sm text-blue-300">
                Pertenece al plan:{' '}
                <span className="cursor-pointer underline">
                  {asignaturaApi.planes_estudio?.nombre}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {/* CRÉDITOS EDITABLES */}
              <Badge variant="secondary" className="gap-1">
                <span className="inline-flex max-w-fit">
                  <EditableHeaderField
                    value={headerData.creditos}
                    onSave={(val) =>
                      handleUpdateHeader('creditos', parseInt(val) || 0)
                    }
                  />
                </span>
                <span>créditos</span>
              </Badge>

              {/* SEMESTRE EDITABLE */}
              <Badge variant="secondary" className="gap-1">
                <EditableHeaderField
                  value={headerData.ciclo}
                  onSave={(val) =>
                    handleUpdateHeader('ciclo', parseInt(val) || 0)
                  }
                />
                <span>° ciclo</span>
              </Badge>

              <Badge variant="secondary">{asignaturaApi.tipo}</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}

      <nav className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex justify-center gap-8">
            {[
              { label: 'Datos', to: '' },
              { label: 'Contenido', to: 'contenido' },
              { label: 'Bibliografía', to: 'bibliografia' },
              { label: 'IA', to: 'asignaturaIa' },
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
                  className={`border-b-2 py-3 text-sm font-medium ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </div>
    </div>
  )
}
