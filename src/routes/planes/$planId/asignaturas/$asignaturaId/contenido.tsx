import { createFileRoute } from '@tanstack/react-router'

import { ContenidoTematico } from '@/components/asignaturas/detalle/ContenidoTematico'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/contenido',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <ContenidoTematico />
}
