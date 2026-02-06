import { createFileRoute, notFound, useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'

import AsignaturaDetailPage from '@/components/asignaturas/detalle/AsignaturaDetailPage'
import { lateralConfetti } from '@/components/ui/lateral-confetti'
import { NotFoundPage } from '@/components/ui/NotFoundPage'
import { subjects_get } from '@/data/api/subjects.api'
import { qk } from '@/data/query/keys'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId',
)({
  loader: async ({ context: { queryClient }, params: { asignaturaId } }) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: qk.asignatura(asignaturaId),
        queryFn: () => subjects_get(asignaturaId),
      })
    } catch (e: any) {
      // PGRST116: The result contains 0 rows (Supabase Single response error)
      if (e?.code === 'PGRST116') {
        throw notFound()
      }
      throw e
    }
  },
  notFoundComponent: () => {
    return (
      <NotFoundPage
        title="Materia no encontrada"
        message="La asignatura que buscas no existe o fue eliminada."
      />
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  // const { planId, asignaturaId } = Route.useParams()
  const location = useLocation()

  // Confetti al llegar desde creación
  useEffect(() => {
    if ((location.state as any)?.showConfetti) {
      lateralConfetti()
      window.history.replaceState({}, document.title) // Limpiar el estado para que no se repita
    }
  }, [location.state])

  return (
    <div>
      <AsignaturaDetailPage></AsignaturaDetailPage>
    </div>
  )
}
