import { createFileRoute } from '@tanstack/react-router'

import { HistorialTab } from '@/components/asignaturas/detalle/HistorialTab'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/historial',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <HistorialTab />
}
