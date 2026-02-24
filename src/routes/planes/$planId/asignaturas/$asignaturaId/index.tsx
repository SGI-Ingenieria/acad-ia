import { createFileRoute } from '@tanstack/react-router'

import AsignaturaDetailPage from '@/components/asignaturas/detalle/AsignaturaDetailPage'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/',
)({
  component: DatosGeneralesPage,
})

function DatosGeneralesPage() {
  return <AsignaturaDetailPage />
}
