import { createFileRoute } from '@tanstack/react-router'

import { NuevaAsignaturaModalContainer } from '@/features/asignaturas/new/NuevaAsignaturaModalContainer'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/_lista/nueva',
)({
  component: NuevaAsignaturaModal,
})

function NuevaAsignaturaModal() {
  const { planId } = Route.useParams()
  return <NuevaAsignaturaModalContainer planId={planId} />
}
