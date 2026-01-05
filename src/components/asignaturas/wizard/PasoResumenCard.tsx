import * as Icons from 'lucide-react'

import type { NewSubjectWizardState } from '@/features/asignaturas/new/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ESTRUCTURAS_SEP } from '@/features/asignaturas/new/catalogs'

export function PasoResumenCard({ wizard }: { wizard: NewSubjectWizardState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de creación</CardTitle>
        <CardDescription>
          Verifica los datos antes de crear la asignatura.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-muted-foreground">Nombre:</span>
            <div className="font-medium">{wizard.datosBasicos.nombre}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Tipo:</span>
            <div className="font-medium">{wizard.datosBasicos.tipo}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Créditos:</span>
            <div className="font-medium">{wizard.datosBasicos.creditos}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Estructura:</span>
            <div className="font-medium">
              {
                ESTRUCTURAS_SEP.find(
                  (e) => e.id === wizard.datosBasicos.estructuraId,
                )?.label
              }
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-md p-3">
          <span className="text-muted-foreground">Modo de creación:</span>
          <div className="flex items-center gap-2 font-medium">
            {wizard.modoCreacion === 'MANUAL' && (
              <>
                <Icons.Pencil className="h-4 w-4" /> Manual (Vacía)
              </>
            )}
            {wizard.modoCreacion === 'IA' && (
              <>
                <Icons.Sparkles className="h-4 w-4" /> Generada con IA
              </>
            )}
            {wizard.modoCreacion === 'CLONADO' && (
              <>
                <Icons.Copy className="h-4 w-4" /> Clonada
                {wizard.subModoClonado === 'INTERNO'
                  ? ' (Sistema)'
                  : ' (Archivo)'}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
