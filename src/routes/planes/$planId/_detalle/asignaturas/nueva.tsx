import { createFileRoute } from '@tanstack/react-router'

import { NuevaAsignaturaModalContainer } from '@/features/asignaturas/nueva/NuevaAsignaturaModalContainer'

export const Route = createFileRoute(
  '/planes/$planId/_detalle/asignaturas/nueva',
)({
  component: NuevaAsignaturaModal,
})

function NuevaAsignaturaModal() {
  const { planId } = Route.useParams()
  console.log('planId desde nueva', planId)
  return <NuevaAsignaturaModalContainer planId={planId} />
}
