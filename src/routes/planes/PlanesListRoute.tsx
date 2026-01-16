import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { usePlanes } from '@/data'

export const Route = createFileRoute('/planes/PlanesListRoute')({
  component: RouteComponent,
})

function RouteComponent() {
  const [search, setSearch] = useState('')

  const filters = useMemo(
    () => ({ search, limit: 20, offset: 0, activo: true }),
    [search],
  )

  const { data, isLoading, isError, error } = usePlanes(filters)

  return (
    <div style={{ padding: 16 }}>
      <h1>Planes</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar…"
      />

      {isLoading && <div>Cargando…</div>}
      {isError && <div>Error: {(error as any).message}</div>}

      <ul>
        {(data?.data ?? []).map((p) => (
          <li key={p.id}>
            <pre>{JSON.stringify(p, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}
