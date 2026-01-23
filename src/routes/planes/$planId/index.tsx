import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/planes/$planId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/planes/$planId/materias',
      params,
    })
  },
})
