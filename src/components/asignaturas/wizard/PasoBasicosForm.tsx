import type {
  NewSubjectWizardState,
  TipoAsignatura,
} from '@/features/asignaturas/new/types'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ESTRUCTURAS_SEP,
  TIPOS_MATERIA,
} from '@/features/asignaturas/new/catalogs'

export function PasoBasicosForm({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="nombre">Nombre de la asignatura</Label>
        <Input
          id="nombre"
          placeholder="Ej. Matemáticas Discretas"
          value={wizard.datosBasicos.nombre}
          onChange={(e) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, nombre: e.target.value },
            }))
          }
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="clave">Clave (Opcional)</Label>
        <Input
          id="clave"
          placeholder="Ej. MAT-101"
          value={wizard.datosBasicos.clave || ''}
          onChange={(e) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, clave: e.target.value },
            }))
          }
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          value={wizard.datosBasicos.tipo}
          onValueChange={(val) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, tipo: val as TipoAsignatura },
            }))
          }
        >
          <SelectTrigger
            id="tipo"
            className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_MATERIA.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1">
        <Label htmlFor="creditos">Créditos</Label>
        <Input
          id="creditos"
          type="number"
          min={0}
          value={wizard.datosBasicos.creditos}
          onChange={(e) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                creditos: Number(e.target.value || 0),
              },
            }))
          }
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="horas">Horas / Semana</Label>
        <Input
          id="horas"
          type="number"
          min={0}
          value={wizard.datosBasicos.horasSemana || 0}
          onChange={(e) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                horasSemana: Number(e.target.value || 0),
              },
            }))
          }
        />
      </div>

      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="estructura">Estructura de la asignatura</Label>
        <Select
          value={wizard.datosBasicos.estructuraId}
          onValueChange={(val) =>
            onChange((w) => ({
              ...w,
              datosBasicos: { ...w.datosBasicos, estructuraId: val },
            }))
          }
        >
          <SelectTrigger
            id="estructura"
            className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
          >
            <SelectValue placeholder="Selecciona plantilla..." />
          </SelectTrigger>
          <SelectContent>
            {ESTRUCTURAS_SEP.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">
          Define los campos requeridos (ej. Objetivos, Temario, Evaluación).
        </p>
      </div>
    </div>
  )
}
