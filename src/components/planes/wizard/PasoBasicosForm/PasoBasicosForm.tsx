import { TemplateSelectorCard } from './TemplateSelectorCard'

import type { CARRERAS } from '@/features/planes/nuevo/catalogs'
import type { NewPlanWizardState } from '@/features/planes/nuevo/types'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  FACULTADES,
  NIVELES,
  TIPOS_CICLO,
  PLANTILLAS_ANEXO_1,
  PLANTILLAS_ANEXO_2,
} from '@/features/planes/nuevo/catalogs'

export function PasoBasicosForm({
  wizard,
  onChange,
  carrerasFiltradas,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  carrerasFiltradas: typeof CARRERAS
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1 sm:col-span-2">
          <Label htmlFor="nombrePlan">Nombre del plan</Label>
          <Input
            id="nombrePlan"
            placeholder="Ej. Ingeniería en Sistemas 2026"
            value={wizard.datosBasicos.nombrePlan}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                datosBasicos: { ...w.datosBasicos, nombrePlan: e.target.value },
              }))
            }
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="facultad">Facultad</Label>
          <Select
            value={wizard.datosBasicos.facultadId}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  facultadId: value,
                  carreraId: '',
                },
              }))
            }
          >
            <SelectTrigger
              id="facultad"
              className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
            >
              <SelectValue placeholder="Selecciona facultad…" />
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

        <div className="grid gap-1">
          <Label htmlFor="carrera">Carrera</Label>
          <Select
            value={wizard.datosBasicos.carreraId}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: { ...w.datosBasicos, carreraId: value },
              }))
            }
            disabled={!wizard.datosBasicos.facultadId}
          >
            <SelectTrigger
              id="carrera"
              className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
            >
              <SelectValue placeholder="Selecciona carrera…" />
            </SelectTrigger>
            <SelectContent>
              {carrerasFiltradas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="nivel">Nivel</Label>
          <Select
            value={wizard.datosBasicos.nivel}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: { ...w.datosBasicos, nivel: value },
              }))
            }
          >
            <SelectTrigger
              id="nivel"
              className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
            >
              <SelectValue placeholder="Selecciona nivel…" />
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="tipoCiclo">Tipo de ciclo</Label>
          <Select
            value={wizard.datosBasicos.tipoCiclo}
            onValueChange={(value) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  tipoCiclo: value as any,
                },
              }))
            }
          >
            <SelectTrigger
              id="tipoCiclo"
              className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
            >
              <SelectValue placeholder="Selecciona tipo de ciclo…" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CICLO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="numCiclos">Número de ciclos</Label>
          <Input
            id="numCiclos"
            type="number"
            min={1}
            value={wizard.datosBasicos.numCiclos}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                datosBasicos: {
                  ...w.datosBasicos,
                  numCiclos: Number(e.target.value || 1),
                },
              }))
            }
            placeholder="1"
          />
        </div>
      </div>
      <Separator className="my-3" />
      <div className="grid gap-4 sm:grid-cols-2">
        <TemplateSelectorCard
          cardTitle="Plantilla de plan de estudios"
          cardDescription="Selecciona el Word para tu nuevo plan."
          templatesData={PLANTILLAS_ANEXO_1}
        />
        <TemplateSelectorCard
          cardTitle="Mapa curricular"
          cardDescription="Selecciona el Excel para tu mapa curricular."
          templatesData={PLANTILLAS_ANEXO_2}
        />
      </div>
    </div>
  )
}
