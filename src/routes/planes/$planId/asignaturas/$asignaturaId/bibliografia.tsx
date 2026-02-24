import { createFileRoute } from '@tanstack/react-router'

import { BibliographyItem } from '@/components/asignaturas/detalle/BibliographyItem'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/bibliografia',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <BibliographyItem />
}
