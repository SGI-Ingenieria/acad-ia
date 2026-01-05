import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/planes/$planId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  return <div>Hello "/planes/{planId}"!</div>
}
