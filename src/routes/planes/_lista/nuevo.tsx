import { createFileRoute } from '@tanstack/react-router'

import NuevoPlanModalContainer from '@/features/planes/new/NuevoPlanModalContainer'

export const Route = createFileRoute('/planes/_lista/nuevo')({
  component: NuevoPlanModalContainer,
})
