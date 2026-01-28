import { createFileRoute, Outlet, notFound } from '@tanstack/react-router'

import { NotFoundPage } from '@/components/ui/NotFoundPage'
import { plans_get } from '@/data/api/plans.api'
import { qk } from '@/data/query/keys'

export const Route = createFileRoute('/planes/$planId/asignaturas')({
  loader: async ({ context: { queryClient }, params: { planId } }) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: qk.plan(planId),
        queryFn: () => plans_get(planId),
      })
    } catch (e: any) {
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
  component: AsignaturasLayout,
})

function AsignaturasLayout() {
  return <Outlet />
}
