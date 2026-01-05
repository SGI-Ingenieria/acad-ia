import * as Icons from 'lucide-react'

import type {
  ModoCreacion,
  NewSubjectWizardState,
  SubModoClonado,
} from '@/features/asignaturas/new/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function PasoMetodoCardGroup({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
}) {
  const isSelected = (m: ModoCreacion) => wizard.modoCreacion === m
  const isSubSelected = (s: SubModoClonado) => wizard.subModoClonado === s

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card
        className={isSelected('MANUAL') ? 'ring-ring ring-2' : ''}
        onClick={() =>
          onChange((w) => ({
            ...w,
            modoCreacion: 'MANUAL',
            subModoClonado: undefined,
          }))
        }
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Pencil className="text-primary h-5 w-5" /> Manual
          </CardTitle>
          <CardDescription>
            Asignatura vacía con estructura base.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={isSelected('IA') ? 'ring-ring ring-2' : ''}
        onClick={() =>
          onChange((w) => ({
            ...w,
            modoCreacion: 'IA',
            subModoClonado: undefined,
          }))
        }
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Sparkles className="text-primary h-5 w-5" /> Con IA
          </CardTitle>
          <CardDescription>Generar contenido automático.</CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={isSelected('CLONADO') ? 'ring-ring ring-2' : ''}
        onClick={() => onChange((w) => ({ ...w, modoCreacion: 'CLONADO' }))}
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Copy className="text-primary h-5 w-5" /> Clonado
          </CardTitle>
          <CardDescription>De otra asignatura o archivo Word.</CardDescription>
        </CardHeader>
        {wizard.modoCreacion === 'CLONADO' && (
          <CardContent>
            <div className="flex flex-col gap-3">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange((w) => ({ ...w, subModoClonado: 'INTERNO' }))
                }}
                className={`hover:border-primary/50 hover:bg-accent flex cursor-pointer items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                  isSubSelected('INTERNO')
                    ? 'bg-primary/5 text-primary ring-primary border-primary ring-1'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Icons.Database className="h-6 w-6 flex-none" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Del sistema</span>
                  <span className="text-xs opacity-70">
                    Buscar en otros planes
                  </span>
                </div>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange((w) => ({ ...w, subModoClonado: 'TRADICIONAL' }))
                }}
                className={`hover:border-primary/50 hover:bg-accent flex cursor-pointer items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                  isSubSelected('TRADICIONAL')
                    ? 'bg-primary/5 text-primary ring-primary border-primary ring-1'
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Icons.Upload className="h-6 w-6 flex-none" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Desde archivos</span>
                  <span className="text-xs opacity-70">
                    Subir Word existente
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
