import type { NewPlanWizardState } from '@/features/planes/new/types'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CARRERAS,
  FACULTADES,
  PLANES_EXISTENTES,
} from '@/features/planes/new/catalogs'

export function PasoDetallesPanel({
  wizard,
  onChange,
  onGenerarIA,
  isLoading,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  onGenerarIA: () => void
  isLoading: boolean
}) {
  if (wizard.modoCreacion === 'MANUAL') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creación manual</CardTitle>
          <CardDescription>
            Se creará un plan en blanco con estructura mínima.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (wizard.modoCreacion === 'IA') {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="desc">Descripción del enfoque</Label>
          <textarea
            id="desc"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Describe el enfoque del programa…"
            value={wizard.iaConfig?.descripcionEnfoque || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  descripcionEnfoque: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="poblacion">Población objetivo</Label>
          <Input
            id="poblacion"
            placeholder="Ej. Egresados de bachillerato con perfil STEM"
            value={wizard.iaConfig?.poblacionObjetivo || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  poblacionObjetivo: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="notas">Notas adicionales</Label>
          <textarea
            id="notas"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Lineamientos institucionales, restricciones, etc."
            value={wizard.iaConfig?.notasAdicionales || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  notasAdicionales: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Opcional: se pueden adjuntar recursos IA más adelante.
          </div>
          <Button onClick={onGenerarIA} disabled={isLoading}>
            {isLoading ? 'Generando…' : 'Generar borrador con IA'}
          </Button>
        </div>

        {wizard.resumen.previewPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Preview IA</CardTitle>
              <CardDescription>
                Asignaturas aprox.:{' '}
                {wizard.resumen.previewPlan.numAsignaturasAprox}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground list-disc pl-5 text-sm">
                {wizard.resumen.previewPlan.secciones?.map((s) => (
                  <li key={s.id}>
                    <span className="text-foreground font-medium">
                      {s.titulo}:
                    </span>{' '}
                    {s.resumen}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'INTERNO'
  ) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="clonFacultad">Facultad</Label>
            <select
              id="clonFacultad"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.facultadId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    facultadId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {FACULTADES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="clonCarrera">Carrera</Label>
            <select
              id="clonCarrera"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.carreraId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    carreraId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {CARRERAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="buscarPlan">Buscar</Label>
            <Input
              id="buscarPlan"
              placeholder="Nombre del plan…"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const term = e.target.value.toLowerCase()
                void term
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {PLANES_EXISTENTES.filter(
            (p) =>
              (!wizard.datosBasicos.facultadId ||
                p.facultadId === wizard.datosBasicos.facultadId) &&
              (!wizard.datosBasicos.carreraId ||
                p.carreraId === wizard.datosBasicos.carreraId),
          ).map((p) => (
            <Card
              key={p.id}
              className={
                p.id === wizard.clonInterno?.planOrigenId
                  ? 'ring-ring ring-2'
                  : ''
              }
              onClick={() =>
                onChange((w) => ({ ...w, clonInterno: { planOrigenId: p.id } }))
              }
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.nombre}</span>
                  <span className="text-muted-foreground text-sm">
                    {p.estado} · {p.anio}
                  </span>
                </CardTitle>
                <CardDescription>ID: {p.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'TRADICIONAL'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="word">Word del plan (obligatorio)</Label>
          <input
            id="word"
            type="file"
            accept=".doc,.docx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoWordPlanId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="mapa">Excel del mapa curricular</Label>
          <input
            id="mapa"
            type="file"
            accept=".xls,.xlsx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoMapaExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="asignaturas">Excel/listado de asignaturas</Label>
          <input
            id="asignaturas"
            type="file"
            accept=".xls,.xlsx,.csv"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoAsignaturasExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div className="text-muted-foreground text-sm">
          Sube al menos Word y uno de los Excel para continuar.
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona un modo</CardTitle>
        <CardDescription>
          Elige una opción en el paso anterior para continuar.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
