import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/asignaturas/$asignaturaId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/asignaturas/$asignaturaId"!</div>
}
