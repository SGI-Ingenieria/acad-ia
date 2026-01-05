import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import { useState } from 'react'

import { CircularProgress } from '@/components/CircularProgress'
import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/_lista/nueva',
)({
  component: NuevaMateriaModal,
})

// --- TIPOS Y ESTADO ---

type ModoCreacion = 'MANUAL' | 'IA' | 'CLONADO'
type SubModoClonado = 'INTERNO' | 'TRADICIONAL'
type TipoMateria = 'OBLIGATORIA' | 'OPTATIVA' | 'TRONCAL' | 'OTRO'

type MateriaPreview = {
  nombre: string
  objetivo: string
  unidades: number
  bibliografiaCount: number
}

type NewSubjectWizardState = {
  step: 1 | 2 | 3 | 4
  planId: string
  modoCreacion: ModoCreacion | null
  subModoClonado?: SubModoClonado
  datosBasicos: {
    nombre: string
    clave?: string
    tipo: TipoMateria
    creditos: number
    horasSemana?: number
    estructuraId: string
  }
  clonInterno?: {
    facultadId?: string
    carreraId?: string
    planOrigenId?: string
    materiaOrigenId?: string | null
  }
  clonTradicional?: {
    archivoWordMateriaId: string | null
    archivosAdicionalesIds: Array<string>
  }
  iaConfig?: {
    descripcionEnfoque: string
    notasAdicionales: string
    archivosExistentesIds: Array<string>
  }
  resumen: {
    previewMateria?: MateriaPreview
  }
  isLoading: boolean
  errorMessage: string | null
}

// --- MOCKS (Hardcoded Data) ---

const auth_get_current_user_role = () => 'JEFE_CARRERA' as const

const ESTRUCTURAS_SEP = [
  { id: 'sep-lic-2025', label: 'Licenciatura SEP v2025' },
  { id: 'sep-pos-2023', label: 'Posgrado SEP v2023' },
  { id: 'ulsa-int-2024', label: 'Estándar Interno ULSA 2024' },
]

const TIPOS_MATERIA: Array<{ value: TipoMateria; label: string }> = [
  { value: 'OBLIGATORIA', label: 'Obligatoria' },
  { value: 'OPTATIVA', label: 'Optativa' },
  { value: 'TRONCAL', label: 'Troncal / Eje común' },
  { value: 'OTRO', label: 'Otro' },
]

const FACULTADES = [
  { id: 'ing', nombre: 'Facultad de Ingeniería' },
  { id: 'med', nombre: 'Facultad de Medicina' },
  { id: 'neg', nombre: 'Facultad de Negocios' },
]

const CARRERAS = [
  { id: 'sis', nombre: 'Ing. en Sistemas', facultadId: 'ing' },
  { id: 'ind', nombre: 'Ing. Industrial', facultadId: 'ing' },
  { id: 'medico', nombre: 'Médico Cirujano', facultadId: 'med' },
  { id: 'act', nombre: 'Actuaría', facultadId: 'neg' },
]

const PLANES_MOCK = [
  { id: 'p1', nombre: 'Plan 2010 Sistemas', carreraId: 'sis' },
  { id: 'p2', nombre: 'Plan 2016 Sistemas', carreraId: 'sis' },
  { id: 'p3', nombre: 'Plan 2015 Industrial', carreraId: 'ind' },
]

const MATERIAS_MOCK = [
  {
    id: 'm1',
    nombre: 'Programación Orientada a Objetos',
    creditos: 8,
    clave: 'POO-101',
  },
  { id: 'm2', nombre: 'Cálculo Diferencial', creditos: 6, clave: 'MAT-101' },
  { id: 'm3', nombre: 'Ética Profesional', creditos: 4, clave: 'HUM-302' },
  {
    id: 'm4',
    nombre: 'Bases de Datos Avanzadas',
    creditos: 8,
    clave: 'BD-201',
  },
]

const ARCHIVOS_SISTEMA_MOCK = [
  { id: 'doc1', name: 'Sílabo_Base_Ingenieria.pdf' },
  { id: 'doc2', name: 'Competencias_Egreso_2025.docx' },
  { id: 'doc3', name: 'Reglamento_Academico.pdf' },
]

// --- STEPPER CONFIG ---

const Wizard = defineStepper(
  {
    id: 'metodo',
    title: 'Método',
    description: 'Manual, IA o Clonado',
  },
  {
    id: 'basicos',
    title: 'Datos básicos',
    description: 'Nombre y estructura',
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    description: 'Detalles según modo',
  },
  {
    id: 'resumen',
    title: 'Resumen',
    description: 'Confirmar creación',
  },
)

// --- COMPONENTE PRINCIPAL ---

function NuevaMateriaModal() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const role = auth_get_current_user_role()

  const [wizard, setWizard] = useState<NewSubjectWizardState>({
    step: 1,
    planId: planId,
    modoCreacion: null,
    datosBasicos: {
      nombre: '',
      clave: '',
      tipo: 'OBLIGATORIA',
      creditos: 0,
      horasSemana: 0,
      estructuraId: '',
    },
    clonInterno: {},
    clonTradicional: {
      archivoWordMateriaId: null,
      archivosAdicionalesIds: [],
    },
    iaConfig: {
      descripcionEnfoque: '',
      notasAdicionales: '',
      archivosExistentesIds: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  })

  const handleClose = () => {
    // Redirige a la pestaña de materias del plan
    navigate({ to: `/planes/${planId}/asignaturas`, resetScroll: false })
  }

  // --- Validaciones ---
  const canContinueDesdeMetodo =
    wizard.modoCreacion === 'MANUAL' ||
    wizard.modoCreacion === 'IA' ||
    (wizard.modoCreacion === 'CLONADO' && !!wizard.subModoClonado)

  const canContinueDesdeBasicos =
    !!wizard.datosBasicos.nombre &&
    wizard.datosBasicos.creditos > 0 &&
    !!wizard.datosBasicos.estructuraId

  const canContinueDesdeConfig = (() => {
    if (wizard.modoCreacion === 'MANUAL') return true
    if (wizard.modoCreacion === 'IA') {
      return !!wizard.iaConfig?.descripcionEnfoque
    }
    if (wizard.modoCreacion === 'CLONADO') {
      if (wizard.subModoClonado === 'INTERNO') {
        return !!wizard.clonInterno?.materiaOrigenId
      }
      if (wizard.subModoClonado === 'TRADICIONAL') {
        return !!wizard.clonTradicional?.archivoWordMateriaId
      }
    }
    return false
  })()

  // --- Simulaciones de API ---
  const simularGeneracionIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true }))
    await new Promise((r) => setTimeout(r, 1500))
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: {
        previewMateria: {
          nombre: w.datosBasicos.nombre,
          objetivo:
            'Aplicar los fundamentos teóricos para la resolución de problemas...',
          unidades: 5,
          bibliografiaCount: 3,
        },
      },
    }))
  }

  const crearMateria = async () => {
    setWizard((w) => ({ ...w, isLoading: true }))
    await new Promise((r) => setTimeout(r, 1000))
    // Aquí iría la llamada real al backend
    // Toast de éxito...
    handleClose()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="flex h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {role !== 'JEFE_CARRERA' ? (
          <VistaSinPermisos onClose={handleClose} />
        ) : (
          <Wizard.Stepper.Provider
            initialStep={Wizard.utils.getFirst().id}
            className="flex h-full flex-col"
          >
            {({ methods }) => {
              const currentIndex = Wizard.utils.getIndex(methods.current.id) + 1
              const totalSteps = Wizard.steps.length
              const nextStep = Wizard.steps[currentIndex]

              return (
                <>
                  {/* --- HEADER FIJO --- */}
                  <div className="z-10 flex-none border-b bg-white">
                    <div className="flex items-center justify-between p-6 pb-4">
                      <DialogHeader className="p-0">
                        <DialogTitle>Nueva Materia</DialogTitle>
                      </DialogHeader>
                      <button
                        onClick={handleClose}
                        className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
                      >
                        <Icons.X className="h-4 w-4" />
                        <span className="sr-only">Cerrar</span>
                      </button>
                    </div>

                    <div className="px-6 pb-6">
                      {/* VISTA MÓVIL (< 640px) */}
                      <div className="block sm:hidden">
                        <div className="flex items-center gap-5">
                          <CircularProgress
                            current={currentIndex}
                            total={totalSteps}
                          />
                          <div className="flex flex-col justify-center">
                            <h2 className="text-lg font-bold text-slate-900">
                              <StepWithTooltip
                                title={methods.current.title}
                                desc={methods.current.description}
                              />
                            </h2>
                            {nextStep ? (
                              <p className="text-sm text-slate-400">
                                Siguiente: {nextStep.title}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-green-500">
                                ¡Último paso!
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* VISTA DESKTOP (>= 640px) */}
                      <div className="hidden sm:block">
                        <Wizard.Stepper.Navigation className="border-border/60 rounded-xl border bg-slate-50 p-2">
                          {Wizard.steps.map((step) => (
                            <Wizard.Stepper.Step
                              key={step.id}
                              of={step.id}
                              className="whitespace-nowrap"
                            >
                              <Wizard.Stepper.Title>
                                <StepWithTooltip
                                  title={step.title}
                                  desc={step.description}
                                />
                              </Wizard.Stepper.Title>
                            </Wizard.Stepper.Step>
                          ))}
                        </Wizard.Stepper.Navigation>
                      </div>
                    </div>
                  </div>

                  {/* --- CONTENIDO SCROLLEABLE --- */}
                  <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    <div className="mx-auto max-w-3xl">
                      {Wizard.utils.getIndex(methods.current.id) === 0 && (
                        <Wizard.Stepper.Panel>
                          <PasoMetodo wizard={wizard} onChange={setWizard} />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 1 && (
                        <Wizard.Stepper.Panel>
                          <PasoBasicos wizard={wizard} onChange={setWizard} />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 2 && (
                        <Wizard.Stepper.Panel>
                          <PasoConfiguracion
                            wizard={wizard}
                            onChange={setWizard}
                            onGenerarIA={simularGeneracionIA}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 3 && (
                        <Wizard.Stepper.Panel>
                          <PasoResumen wizard={wizard} />
                        </Wizard.Stepper.Panel>
                      )}
                    </div>
                  </div>

                  {/* --- FOOTER FIJO --- */}
                  <div className="flex-none border-t bg-white p-6">
                    <Wizard.Stepper.Controls className="flex items-center justify-between">
                      <div className="flex-1">
                        {wizard.errorMessage && (
                          <span className="text-destructive text-sm font-medium">
                            {wizard.errorMessage}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="secondary"
                          onClick={() => methods.prev()}
                          disabled={
                            Wizard.utils.getIndex(methods.current.id) === 0 ||
                            wizard.isLoading
                          }
                        >
                          Anterior
                        </Button>

                        {Wizard.utils.getIndex(methods.current.id) <
                        Wizard.steps.length - 1 ? (
                          <Button
                            onClick={() => methods.next()}
                            disabled={
                              wizard.isLoading ||
                              (Wizard.utils.getIndex(methods.current.id) ===
                                0 &&
                                !canContinueDesdeMetodo) ||
                              (Wizard.utils.getIndex(methods.current.id) ===
                                1 &&
                                !canContinueDesdeBasicos) ||
                              (Wizard.utils.getIndex(methods.current.id) ===
                                2 &&
                                !canContinueDesdeConfig)
                            }
                          >
                            Siguiente
                          </Button>
                        ) : (
                          <Button
                            onClick={crearMateria}
                            disabled={wizard.isLoading}
                          >
                            {wizard.isLoading ? 'Creando...' : 'Crear Materia'}
                          </Button>
                        )}
                      </div>
                    </Wizard.Stepper.Controls>
                  </div>
                </>
              )
            }}
          </Wizard.Stepper.Provider>
        )}
      </DialogContent>
    </Dialog>
  )
}

// --- SUB-COMPONENTES DE PASOS ---

function PasoMetodo({
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
      {/* 1. MANUAL */}
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
          <CardDescription>Materia vacía con estructura base.</CardDescription>
        </CardHeader>
      </Card>

      {/* 2. CON IA */}
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

      {/* 3. CLONADO */}
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
          <CardDescription>De otra materia o archivo Word.</CardDescription>
        </CardHeader>
        {wizard.modoCreacion === 'CLONADO' && (
          <CardContent>
            <div className="flex flex-col gap-3">
              {/* Opción Interna */}
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

              {/* Opción Tradicional */}
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

function PasoBasicos({
  wizard,
  onChange,
}: {
  wizard: NewSubjectWizardState
  onChange: React.Dispatch<React.SetStateAction<NewSubjectWizardState>>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1 sm:col-span-2">
        <Label htmlFor="nombre">Nombre de la materia</Label>
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
              datosBasicos: { ...w.datosBasicos, tipo: val as TipoMateria },
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
        <Label htmlFor="estructura">Estructura de la materia</Label>
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

function PasoConfiguracion({
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
            La materia se creará vacía. Podrás editar el contenido detallado en
            la siguiente pantalla.
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
            placeholder="Ej. Materia teórica-práctica enfocada en patrones de diseño..."
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
            className="min-h-[100px]"
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

        {wizard.resumen.previewMateria && (
          <Card className="bg-muted/50 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Vista previa generada</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              <p>
                <strong>Objetivo:</strong>{' '}
                {wizard.resumen.previewMateria.objetivo}
              </p>
              <p className="mt-2">
                Se detectaron {wizard.resumen.previewMateria.unidades} unidades
                temáticas y {wizard.resumen.previewMateria.bibliografiaCount}{' '}
                fuentes bibliográficas.
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
        {/* Filtros */}
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

        {/* Lista de materias */}
        <div className="grid max-h-[300px] gap-2 overflow-y-auto">
          {MATERIAS_MOCK.map((m) => (
            <div
              key={m.id}
              onClick={() =>
                onChange((w) => ({
                  ...w,
                  clonInterno: { ...w.clonInterno, materiaOrigenId: m.id },
                }))
              }
              className={`hover:bg-accent flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                wizard.clonInterno?.materiaOrigenId === m.id
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
              {wizard.clonInterno?.materiaOrigenId === m.id && (
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
            Sube el Word de la materia
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
                  archivoWordMateriaId:
                    e.target.files?.[0]?.name || 'mock_file',
                },
              }))
            }
          />
        </div>
        {wizard.clonTradicional?.archivoWordMateriaId && (
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

function PasoResumen({ wizard }: { wizard: NewSubjectWizardState }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de creación</CardTitle>
        <CardDescription>
          Verifica los datos antes de crear la materia.
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

// --- UTILS COMPONENTES ---

function StepWithTooltip({ title, desc }: { title: string; desc: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <span
            className="cursor-help decoration-dotted underline-offset-4 hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen((prev) => !prev)
            }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {title}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-xs">
          <p>{desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function VistaSinPermisos({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DialogHeader className="flex-none border-b p-6">
        <DialogTitle>Nueva Materia</DialogTitle>
      </DialogHeader>
      <div className="flex-1 p-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Icons.ShieldAlert className="h-5 w-5" />
              Sin permisos
            </CardTitle>
            <CardDescription>
              Solo el Jefe de Carrera puede crear materias.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
