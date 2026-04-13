import {
  createFileRoute,
  Outlet,
  Link,
  useLocation,
  useParams,
  useRouterState,
} from '@tanstack/react-router'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AlertaConflicto } from '@/components/asignaturas/detalle/mapa/AlertaConflicto'
import { Badge } from '@/components/ui/badge'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { usePlanAsignaturas, useSubject, useUpdateAsignatura } from '@/data'

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
  const location = useLocation()
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId',
  })
  const { planId } = useParams({
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

    updateAsignatura.mutate({
      asignaturaId,
      patch,
    })
  }

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  // Confetti al llegar desde creación IA
  useEffect(() => {
    if ((location.state as any)?.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

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
      <section className="bg-linear-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="mx-auto p-4 py-10 md:px-6 lg:px-8">
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
                  Pertenece al plan:{' '}
                  <span className="text-blue-100">
                    {(asignaturaApi.planes_estudio as DatosPlan | undefined)
                      ?.nombre ?? ''}
                  </span>
                </span>
              </div>
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
                  className={`shrink-0 border-b-2 py-4 text-sm font-medium transition-colors ${
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

      <div className="mx-auto p-4 py-8 md:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  )
}
