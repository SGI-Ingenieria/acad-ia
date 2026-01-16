import { TanStackDevtools } from '@tanstack/react-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import Header from '../components/Header'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Header />
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),

  errorComponent: ({ error, reset }) => {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">
          ¡Ups! Algo salió mal
        </h2>
        <p className="max-w-md text-gray-600">
          Ocurrió un error inesperado al cargar esta sección.
        </p>

        {/* Opcional: Mostrar el detalle técnico en desarrollo */}
        <pre className="max-w-full overflow-auto rounded border border-gray-300 bg-gray-100 p-4 text-left text-xs">
          {error.message}
        </pre>

        <button
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  },
})
