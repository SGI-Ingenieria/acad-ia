import * as Icons from 'lucide-react'

import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ARCHIVOS_SISTEMA_MOCK,
  FACULTADES,
  MATERIAS_MOCK,
  PLANES_MOCK,
} from '@/features/asignaturas/nueva/catalogs'

export function PasoConfiguracionPanel({
  wizard,
  onChange,
  onGenerarIA,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
  onGenerarIA: () => void
}) {
  if (wizard.modoCreacion === 'MANUAL') {
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

  if (wizard.modoCreacion === 'IA') {
    return (
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label>Descripción del enfoque</Label>
          <Textarea
            placeholder="Ej. Asignatura teórica-práctica enfocada en patrones de diseño..."
            value={wizard.iaConfig?.descripcionEnfoque}
            onChange={(e) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...w.iaConfig!,
                  descripcionEnfoque: e.target.value,
                },
              }))
            }
            className="min-h-25"
          />
        </div>
        <div className="grid gap-1">
          <Label>Notas adicionales</Label>
          <Textarea
            placeholder="Restricciones, bibliografía sugerida, etc."
            value={wizard.iaConfig?.notasAdicionales}
            onChange={(e) =>
              onChange((w) => ({
                ...w,
                iaConfig: { ...w.iaConfig!, notasAdicionales: e.target.value },
              }))
            }
          />
        </div>

        <div className="grid gap-2">
          <Label>Archivos de contexto (Opcional)</Label>
          <div className="flex flex-col gap-2 rounded-md border p-3">
            {ARCHIVOS_SISTEMA_MOCK.map((file) => (
              <div key={file.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={file.id}
                  checked={wizard.iaConfig?.archivosExistentesIds.includes(
                    file.id,
                  )}
                  onChange={(e) => {
                    const checked = e.target.checked
                    onChange((w) => ({
                      ...w,
                      iaConfig: {
                        ...w.iaConfig!,
                        archivosExistentesIds: checked
                          ? [
                              ...(w.iaConfig?.archivosExistentesIds || []),
                              file.id,
                            ]
                          : w.iaConfig?.archivosExistentesIds.filter(
                              (id) => id !== file.id,
                            ) || [],
                      },
                    }))
                  }}
                />
                <Label htmlFor={file.id} className="font-normal">
                  {file.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onGenerarIA} disabled={wizard.isLoading}>
            {wizard.isLoading ? (
              <>
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Icons.Sparkles className="mr-2 h-4 w-4" /> Generar Preview
              </>
            )}
          </Button>
        </div>

        {wizard.resumen.previewAsignatura && (
          <Card className="bg-muted/50 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Vista previa generada</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              <p>
                <strong>Objetivo:</strong>{' '}
                {wizard.resumen.previewAsignatura.objetivo}
              </p>
              <p className="mt-2">
                Se detectaron {wizard.resumen.previewAsignatura.unidades}{' '}
                unidades temáticas y{' '}
                {wizard.resumen.previewAsignatura.bibliografiaCount} fuentes
                bibliográficas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (wizard.subModoClonado === 'INTERNO') {
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
              onClick={() =>
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, asignaturaOrigenId: m.id },
                }))
              }
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

  if (wizard.subModoClonado === 'TRADICIONAL') {
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
