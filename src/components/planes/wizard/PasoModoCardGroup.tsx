import * as Icons from 'lucide-react'

import type {
  NewPlanWizardState,
  ModoCreacion,
  SubModoClonado,
} from '@/features/planes/new/types'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function PasoModoCardGroup({
  wizard,
  onChange,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
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
          <CardDescription>Plan vacío con estructura mínima.</CardDescription>
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
          <CardDescription>
            Borrador completo a partir de datos base.
          </CardDescription>
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
          <CardDescription>Desde un plan existente o archivos.</CardDescription>
        </CardHeader>
        {wizard.modoCreacion === 'CLONADO' && (
          <CardContent className="flex flex-col gap-3">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange((w) => ({ ...w, subModoClonado: 'INTERNO' }))
              }}
              className={`hover:border-primary/50 hover:bg-accent flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all sm:flex-col ${
                isSubSelected('INTERNO')
                  ? 'border-primary bg-primary/5 ring-primary text-primary ring-1'
                  : 'border-border text-muted-foreground'
              } `}
            >
              <Icons.Database className="mb-1 h-6 w-6" />
              <span className="text-sm font-medium">Del sistema</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange((w) => ({ ...w, subModoClonado: 'TRADICIONAL' }))
              }}
              className={`hover:border-primary/50 hover:bg-accent flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all sm:flex-col ${
                isSubSelected('TRADICIONAL')
                  ? 'border-primary bg-primary/5 ring-primary text-primary ring-1'
                  : 'border-border text-muted-foreground'
              } `}
            >
              <Icons.Upload className="mb-1 h-6 w-6" />
              <span className="text-sm font-medium">Desde archivos</span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
