import type { NewPlanWizardState } from '@/features/planes/new/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function PasoResumenCard({ wizard }: { wizard: NewPlanWizardState }) {
  const modo = wizard.modoCreacion
  const sub = wizard.subModoClonado
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
        <CardDescription>
          Verifica la información antes de crear.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre: </span>
            <span className="font-medium">
              {wizard.datosBasicos.nombrePlan || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Facultad/Carrera: </span>
            <span className="font-medium">
              {wizard.datosBasicos.facultadId || '—'} /{' '}
              {wizard.datosBasicos.carreraId || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Nivel: </span>
            <span className="font-medium">
              {wizard.datosBasicos.nivel || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Ciclos: </span>
            <span className="font-medium">
              {wizard.datosBasicos.numCiclos} ({wizard.datosBasicos.tipoCiclo})
            </span>
          </div>
          <div className="mt-2">
            <span className="text-muted-foreground">Modo: </span>
            <span className="font-medium">
              {modo === 'MANUAL' && 'Manual'}
              {modo === 'IA' && 'Generado con IA'}
              {modo === 'CLONADO' &&
                sub === 'INTERNO' &&
                'Clonado desde plan del sistema'}
              {modo === 'CLONADO' &&
                sub === 'TRADICIONAL' &&
                'Importado desde documentos tradicionales'}
            </span>
          </div>
          {wizard.resumen.previewPlan && (
            <div className="bg-muted mt-2 rounded-md p-3">
              <div className="font-medium">Preview IA</div>
              <div className="text-muted-foreground">
                Asignaturas aprox.:{' '}
                {wizard.resumen.previewPlan.numAsignaturasAprox}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
