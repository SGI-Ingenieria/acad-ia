import * as Icons from 'lucide-react'

import type { NewSubjectWizardState } from '@/features/asignaturas/nueva/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePlan, useSubjectEstructuras } from '@/data'
import { formatFileSize } from '@/features/planes/utils/format-file-size'

export function PasoResumenCard({ wizard }: { wizard: NewSubjectWizardState }) {
  const { data: plan } = usePlan(wizard.plan_estudio_id)
  const { data: estructuras } = useSubjectEstructuras()

  const estructuraNombre = (() => {
    const estructuraId = wizard.datosBasicos.estructuraId
    if (!estructuraId) return '—'
    const hit = estructuras?.find((e) => e.id === estructuraId)
    return hit?.nombre ?? estructuraId
  })()

  const modoLabel = (() => {
    if (wizard.tipoOrigen === 'MANUAL') return 'Manual (Vacía)'
    if (wizard.tipoOrigen === 'IA') return 'Generada con IA'
    if (wizard.tipoOrigen === 'CLONADO_INTERNO') return 'Clonada (Sistema)'
    if (wizard.tipoOrigen === 'CLONADO_TRADICIONAL') return 'Clonada (Archivo)'
    return '—'
  })()

  const creditosText =
    typeof wizard.datosBasicos.creditos === 'number' &&
    Number.isFinite(wizard.datosBasicos.creditos)
      ? wizard.datosBasicos.creditos.toFixed(2)
      : '—'

  const archivosRef = wizard.iaConfig?.archivosReferencia ?? []
  const repositoriosRef = wizard.iaConfig?.repositoriosReferencia ?? []
  const adjuntos = wizard.iaConfig?.archivosAdjuntos ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de creación</CardTitle>
        <CardDescription>
          Verifica los datos antes de crear la asignatura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 text-sm">
          <div className="grid gap-2">
            <div>
              <span className="text-muted-foreground">Plan de estudios: </span>
              <span className="font-medium">
                {plan?.nombre || wizard.plan_estudio_id || '—'}
              </span>
            </div>
            {plan?.carreras?.nombre ? (
              <div>
                <span className="text-muted-foreground">Carrera: </span>
                <span className="font-medium">{plan.carreras.nombre}</span>
              </div>
            ) : null}
          </div>

          <div className="bg-muted rounded-md p-3">
            <span className="text-muted-foreground">Tipo de origen: </span>
            <span className="inline-flex items-center gap-2 font-medium">
              {wizard.tipoOrigen === 'MANUAL' && (
                <Icons.Pencil className="h-4 w-4" />
              )}
              {wizard.tipoOrigen === 'IA' && (
                <Icons.Sparkles className="h-4 w-4" />
              )}
              {(wizard.tipoOrigen === 'CLONADO_INTERNO' ||
                wizard.tipoOrigen === 'CLONADO_TRADICIONAL') && (
                <Icons.Copy className="h-4 w-4" />
              )}
              {modoLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <span className="text-muted-foreground">Nombre: </span>
              <span className="font-medium">
                {wizard.datosBasicos.nombre || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Código: </span>
              <span className="font-medium">
                {wizard.datosBasicos.codigo || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo: </span>
              <span className="font-medium">
                {wizard.datosBasicos.tipo || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Créditos: </span>
              <span className="font-medium">{creditosText}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Estructura: </span>
              <span className="font-medium">{estructuraNombre}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Horas académicas: </span>
              <span className="font-medium">
                {wizard.datosBasicos.horasAcademicas ?? '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Horas independientes:{' '}
              </span>
              <span className="font-medium">
                {wizard.datosBasicos.horasIndependientes ?? '—'}
              </span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-3">
            <div className="font-medium">Configuración IA</div>
            <div className="mt-2 grid gap-2">
              <div>
                <span className="text-muted-foreground">
                  Enfoque académico:{' '}
                </span>
                <span className="font-medium">
                  {wizard.iaConfig?.descripcionEnfoqueAcademico || '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Instrucciones adicionales:{' '}
                </span>
                <span className="font-medium">
                  {wizard.iaConfig?.instruccionesAdicionalesIA || '—'}
                </span>
              </div>

              <div className="mt-2">
                <div className="font-medium">Archivos de referencia</div>
                {archivosRef.length ? (
                  <ul className="text-muted-foreground list-disc pl-5 text-xs">
                    {archivosRef.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground text-xs">—</div>
                )}
              </div>

              <div>
                <div className="font-medium">Repositorios de referencia</div>
                {repositoriosRef.length ? (
                  <ul className="text-muted-foreground list-disc pl-5 text-xs">
                    {repositoriosRef.map((id) => (
                      <li key={id}>{id}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground text-xs">—</div>
                )}
              </div>

              <div>
                <div className="font-medium">Archivos adjuntos</div>
                {adjuntos.length ? (
                  <ul className="text-muted-foreground list-disc pl-5 text-xs">
                    {adjuntos.map((f) => (
                      <li key={f.id}>
                        <span className="text-foreground">{f.file.name}</span>{' '}
                        <span>· {formatFileSize(f.file.size)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground text-xs">—</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
