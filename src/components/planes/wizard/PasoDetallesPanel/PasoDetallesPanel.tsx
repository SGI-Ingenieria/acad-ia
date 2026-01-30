import { FileDropzone } from './FileDropZone'
import ReferenciasParaIA from './ReferenciasParaIA'

import type { UploadedFile } from './FileDropZone'
import type { NewPlanWizardState } from '@/features/planes/nuevo/types'

import {
  Card,
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
} from '@/features/planes/nuevo/catalogs'

export function PasoDetallesPanel({
  wizard,
  onChange,
  isLoading,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  isLoading: boolean
}) {
  if (wizard.tipoOrigen === 'MANUAL') {
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

  if (wizard.tipoOrigen === 'IA') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="desc">Descripción del enfoque académico</Label>
          <textarea
            id="desc"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Describe el enfoque del programa…"
            value={wizard.iaConfig?.descripcionEnfoqueAcademico || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  descripcionEnfoqueAcademico: e.target.value,
                },
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="notas">
            Instrucciones adicionales para la IA
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              (Opcional)
            </span>
          </Label>
          <textarea
            id="notas"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Lineamientos institucionales, restricciones, etc."
            value={wizard.iaConfig?.instruccionesAdicionalesIA || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  instruccionesAdicionalesIA: e.target.value,
                },
              }))
            }
          />
        </div>
        <ReferenciasParaIA
          selectedArchivoIds={wizard.iaConfig?.archivosReferencia || []}
          selectedRepositorioIds={wizard.iaConfig?.repositoriosReferencia || []}
          uploadedFiles={wizard.iaConfig?.archivosAdjuntos || []}
          onToggleArchivo={(id, checked) =>
            onChange((w) => {
              const prev = w.iaConfig?.archivosReferencia || []
              const next = checked
                ? [...prev, id]
                : prev.filter((x) => x !== id)
              return {
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  archivosReferencia: next,
                },
              }
            })
          }
          onToggleRepositorio={(id, checked) =>
            onChange((w) => {
              const prev = w.iaConfig?.repositoriosReferencia || []
              const next = checked
                ? [...prev, id]
                : prev.filter((x) => x !== id)
              return {
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  repositoriosReferencia: next,
                },
              }
            })
          }
          onFilesChange={(files: Array<UploadedFile>) =>
            onChange(
              (w): NewPlanWizardState => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  archivosAdjuntos: files,
                },
              }),
            )
          }
        />
      </div>
    )
  }

  if (wizard.tipoOrigen === 'CLONADO_INTERNO') {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="clonFacultad">Facultad</Label>
            <select
              id="clonFacultad"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="Facultad"
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
              aria-label="Carrera"
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

  if (wizard.tipoOrigen === 'CLONADO_TRADICIONAL') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="word">Word del plan (obligatorio)</Label>
          {/* <input
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
          /> */}

          <FileDropzone
            acceptedTypes=".doc,.docx"
            maxFiles={1}
            onFilesChange={(files) => {
              const f = files[0] || null
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoWordPlanId: f,
                },
              }))
            }}
          />
        </div>
        <div>
          <Label htmlFor="mapa">Excel del mapa curricular</Label>
          <input
            id="mapa"
            type="file"
            accept=".xls,.xlsx"
            title="Subir mapa curricular"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => {
                const file = e.target.files?.[0] || null
                const next = file
                  ? {
                      id:
                        typeof crypto !== 'undefined' && 'randomUUID' in crypto
                          ? (crypto as any).randomUUID()
                          : `file-${Date.now()}-${Math.random()
                              .toString(36)
                              .substr(2, 9)}`,
                      name: file.name,
                      size: formatFileSize(file.size),
                      type: file.name.split('.').pop() || 'file',
                    }
                  : null
                return {
                  ...w,
                  clonTradicional: {
                    ...(w.clonTradicional || ({} as any)),
                    archivoMapaExcelId: next,
                  },
                }
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="asignaturas">Excel/listado de asignaturas</Label>
          <input
            id="asignaturas"
            type="file"
            accept=".xls,.xlsx,.csv"
            title="Subir listado de asignaturas"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => {
                const file = e.target.files?.[0] || null
                const next = file
                  ? {
                      id:
                        typeof crypto !== 'undefined' && 'randomUUID' in crypto
                          ? (crypto as any).randomUUID()
                          : `file-${Date.now()}-${Math.random()
                              .toString(36)
                              .substr(2, 9)}`,
                      name: file.name,
                      size: formatFileSize(file.size),
                      type: file.name.split('.').pop() || 'file',
                    }
                  : null
                return {
                  ...w,
                  clonTradicional: {
                    ...(w.clonTradicional || ({} as any)),
                    archivoAsignaturasExcelId: next,
                  },
                }
              })
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
