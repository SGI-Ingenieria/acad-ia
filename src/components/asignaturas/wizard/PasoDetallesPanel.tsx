import * as Icons from 'lucide-react'

import type { UploadedFile } from '@/components/planes/wizard/PasoDetallesPanel/FileDropZone'
import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

import ReferenciasParaIA from '@/components/planes/wizard/PasoDetallesPanel/ReferenciasParaIA'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  FACULTADES,
  MATERIAS_MOCK,
  PLANES_MOCK,
} from '@/features/asignaturas/nueva/catalogs'

export function PasoDetallesPanel({
  wizard,
  onChange,
  onGenerarIA: _onGenerarIA,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
  onGenerarIA: () => void
}) {
  if (wizard.tipoOrigen === 'MANUAL') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración Manual</CardTitle>
          <CardDescription>
            La asignatura se creará vacía. Podrás editar el contenido detallado
            en la siguiente pantalla.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (wizard.tipoOrigen === 'IA') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label>Descripción del enfoque académico</Label>
          <Textarea
            placeholder="Describe el enfoque, alcance y público objetivo. Ej.: Teórica-práctica enfocada en patrones de diseño, con proyectos semanales."
            value={wizard.iaConfig?.descripcionEnfoqueAcademico}
            onChange={(e) =>
              onChange(
                (w): NewSubjectWizardState => ({
                  ...w,
                  iaConfig: {
                    ...w.iaConfig!,
                    descripcionEnfoqueAcademico: e.target.value,
                  },
                }),
              )
            }
            className="placeholder:text-muted-foreground/70 min-h-25 font-medium not-italic placeholder:font-normal placeholder:italic"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>
            Instrucciones adicionales para la IA
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
              (Opcional)
            </span>
          </Label>
          <Textarea
            placeholder="Opcional: restricciones y preferencias. Ej.: incluye bibliografía en español, evita contenido avanzado, prioriza evaluación por proyectos."
            value={wizard.iaConfig?.instruccionesAdicionalesIA}
            onChange={(e) =>
              onChange(
                (w): NewSubjectWizardState => ({
                  ...w,
                  iaConfig: {
                    ...w.iaConfig!,
                    instruccionesAdicionalesIA: e.target.value,
                  },
                }),
              )
            }
            className="placeholder:text-muted-foreground/70 font-medium not-italic placeholder:font-normal placeholder:italic"
          />
        </div>

        <ReferenciasParaIA
          selectedArchivoIds={wizard.iaConfig?.archivosReferencia || []}
          selectedRepositorioIds={wizard.iaConfig?.repositoriosReferencia || []}
          uploadedFiles={wizard.iaConfig?.archivosAdjuntos || []}
          onToggleArchivo={(id, checked) =>
            onChange((w): NewSubjectWizardState => {
              const prev = w.iaConfig?.archivosReferencia || []
              const next = checked
                ? [...prev, id]
                : prev.filter((a) => a !== id)
              return {
                ...w,
                iaConfig: {
                  ...w.iaConfig!,
                  archivosReferencia: next,
                },
              }
            })
          }
          onToggleRepositorio={(id, checked) =>
            onChange((w): NewSubjectWizardState => {
              const prev = w.iaConfig?.repositoriosReferencia || []
              const next = checked
                ? [...prev, id]
                : prev.filter((r) => r !== id)
              return {
                ...w,
                iaConfig: {
                  ...w.iaConfig!,
                  repositoriosReferencia: next,
                },
              }
            })
          }
          onFilesChange={(files: Array<UploadedFile>) =>
            onChange(
              (w): NewSubjectWizardState => ({
                ...w,
                iaConfig: {
                  ...w.iaConfig!,
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
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <Label>Facultad</Label>
            <Select
              onValueChange={(val) =>
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, facultadId: val },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                {FACULTADES.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan</Label>
            <Select
              onValueChange={(val) =>
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, planOrigenId: val },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {PLANES_MOCK.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Buscar</Label>
            <Input placeholder="Nombre..." />
          </div>
        </div>

        <div className="grid max-h-75 gap-2 overflow-y-auto">
          {MATERIAS_MOCK.map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() =>
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, asignaturaOrigenId: m.id },
                }))
              }
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, asignaturaOrigenId: m.id },
                }))
              }}
              className={`hover:bg-accent flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                wizard.clonInterno?.asignaturaOrigenId === m.id
                  ? 'border-primary bg-primary/5 ring-primary ring-1'
                  : ''
              }`}
            >
              <div>
                <div className="font-medium">{m.nombre}</div>
                <div className="text-muted-foreground text-xs">
                  {m.clave} • {m.creditos} créditos
                </div>
              </div>
              {wizard.clonInterno?.asignaturaOrigenId === m.id && (
                <Icons.CheckCircle2 className="text-primary h-5 w-5" />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (wizard.tipoOrigen === 'CLONADO_TRADICIONAL') {
    return (
      <div className="grid gap-4">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Icons.Upload className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-sm font-medium">
            Sube el Word de la asignatura
          </h3>
          <p className="text-muted-foreground mb-4 text-xs">
            Arrastra el archivo o haz clic para buscar (.doc, .docx)
          </p>
          <Input
            type="file"
            accept=".doc,.docx"
            className="mx-auto max-w-xs"
            onChange={(e) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...w.clonTradicional!,
                  archivoWordAsignaturaId:
                    e.target.files?.[0]?.name || 'mock_file',
                },
              }))
            }
          />
        </div>
        {wizard.clonTradicional?.archivoWordAsignaturaId && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
            <Icons.FileText className="h-4 w-4" />
            Archivo cargado listo para procesar.
          </div>
        )}
      </div>
    )
  }

  return null
}
