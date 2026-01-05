import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/asignaturas/_lista')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="bg-background min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
        <Outlet />
      </div>
    </main>
  )
}
