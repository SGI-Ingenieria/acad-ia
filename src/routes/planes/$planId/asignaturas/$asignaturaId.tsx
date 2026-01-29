import { createFileRoute, notFound } from '@tanstack/react-router'

import MateriaDetailPage from '@/components/asignaturas/detalle/MateriaDetailPage'
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

  return (
    <div>
      <MateriaDetailPage></MateriaDetailPage>
    </div>
  )
}
