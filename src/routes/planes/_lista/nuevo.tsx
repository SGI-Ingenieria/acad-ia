import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import { useMemo, useState } from 'react'

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const Route = createFileRoute('/planes/_lista/nuevo')({
  component: NuevoPlanModal,
})

// Tipos del wizard (mock frontend)
type TipoCiclo = 'SEMESTRE' | 'CUATRIMESTRE' | 'TRIMESTRE'
type ModoCreacion = 'MANUAL' | 'IA' | 'CLONADO'
type SubModoClonado = 'INTERNO' | 'TRADICIONAL'

type PlanPreview = {
  nombrePlan: string
  nivel: string
  tipoCiclo: TipoCiclo
  numCiclos: number
  numMateriasAprox?: number
  secciones?: Array<{ id: string; titulo: string; resumen: string }>
}

type NewPlanWizardState = {
  step: 1 | 2 | 3 | 4
  modoCreacion: ModoCreacion | null
  subModoClonado?: SubModoClonado
  datosBasicos: {
    nombrePlan: string
    carreraId: string
    facultadId: string
    nivel: string
    tipoCiclo: TipoCiclo
    numCiclos: number
  }
  clonInterno?: { planOrigenId: string | null }
  clonTradicional?: {
    archivoWordPlanId: string | null
    archivoMapaExcelId: string | null
    archivoMateriasExcelId: string | null
  }
  iaConfig?: {
    descripcionEnfoque: string
    poblacionObjetivo: string
    notasAdicionales: string
    archivosReferencia: Array<string>
  }
  resumen: { previewPlan?: PlanPreview }
  isLoading: boolean
  errorMessage: string | null
}

// Mock de permisos/rol
const auth_get_current_user_role = () => 'JEFE_CARRERA' as const

// Mock catálogos
const FACULTADES = [
  { id: 'ing', nombre: 'Facultad de Ingeniería' },
  {
    id: 'med',
    nombre: 'Facultad de Medicina en medicina en medicina en medicina',
  },
  { id: 'neg', nombre: 'Facultad de Negocios' },
]

const CARRERAS = [
  { id: 'sis', nombre: 'Ing. en Sistemas', facultadId: 'ing' },
  { id: 'ind', nombre: 'Ing. Industrial', facultadId: 'ing' },
  { id: 'medico', nombre: 'Médico Cirujano', facultadId: 'med' },
  { id: 'act', nombre: 'Actuaría', facultadId: 'neg' },
]

const NIVELES = ['Licenciatura', 'Especialidad', 'Maestría', 'Doctorado']
const TIPOS_CICLO: Array<{ value: TipoCiclo; label: string }> = [
  { value: 'SEMESTRE', label: 'Semestre' },
  { value: 'CUATRIMESTRE', label: 'Cuatrimestre' },
  { value: 'TRIMESTRE', label: 'Trimestre' },
]

// Mock planes existentes para clonado interno
const PLANES_EXISTENTES = [
  {
    id: 'plan-2021-sis',
    nombre: 'ISC 2021',
    estado: 'Aprobado',
    anio: 2021,
    facultadId: 'ing',
    carreraId: 'sis',
  },
  {
    id: 'plan-2020-ind',
    nombre: 'I. Industrial 2020',
    estado: 'Aprobado',
    anio: 2020,
    facultadId: 'ing',
    carreraId: 'ind',
  },
  {
    id: 'plan-2019-med',
    nombre: 'Medicina 2019',
    estado: 'Vigente',
    anio: 2019,
    facultadId: 'med',
    carreraId: 'medico',
  },
]

// Definición de pasos con wrapper
const Wizard = defineStepper(
  {
    id: 'modo',
    title: 'Método',
    description: 'Selecciona cómo crearás el plan',
  },
  {
    id: 'basicos',
    title: 'Datos básicos',
    description: 'Nombre, carrera, nivel y ciclos',
  },
  { id: 'detalles', title: 'Detalles', description: 'IA, clonado o archivos' },
  { id: 'resumen', title: 'Resumen', description: 'Confirma y crea el plan' },
)

function NuevoPlanModal() {
  const navigate = useNavigate()

  const [wizard, setWizard] = useState<NewPlanWizardState>({
    step: 1,
    modoCreacion: null,
    datosBasicos: {
      nombrePlan: '',
      carreraId: '',
      facultadId: '',
      nivel: '',
      tipoCiclo: 'SEMESTRE',
      numCiclos: 8,
    },
    clonInterno: { planOrigenId: null },
    clonTradicional: {
      archivoWordPlanId: null,
      archivoMapaExcelId: null,
      archivoMateriasExcelId: null,
    },
    iaConfig: {
      descripcionEnfoque: '',
      poblacionObjetivo: '',
      notasAdicionales: '',
      archivosReferencia: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  })

  const role = auth_get_current_user_role()

  const handleClose = () => {
    navigate({ to: '/planes', resetScroll: false })
  }

  // --- LÓGICA DE VALIDACIÓN Y DATA ---
  const carrerasFiltradas = useMemo(() => {
    const fac = wizard.datosBasicos.facultadId
    return fac ? CARRERAS.filter((c) => c.facultadId === fac) : CARRERAS
  }, [wizard.datosBasicos.facultadId])

  const canContinueDesdeModo =
    wizard.modoCreacion === 'MANUAL' ||
    wizard.modoCreacion === 'IA' ||
    (wizard.modoCreacion === 'CLONADO' && !!wizard.subModoClonado)

  const canContinueDesdeBasicos =
    !!wizard.datosBasicos.nombrePlan &&
    !!wizard.datosBasicos.carreraId &&
    !!wizard.datosBasicos.facultadId &&
    !!wizard.datosBasicos.nivel &&
    wizard.datosBasicos.numCiclos > 0

  const canContinueDesdeDetalles = (() => {
    if (wizard.modoCreacion === 'MANUAL') return true
    if (wizard.modoCreacion === 'IA') {
      return !!wizard.iaConfig?.descripcionEnfoque
    }
    if (wizard.modoCreacion === 'CLONADO') {
      if (wizard.subModoClonado === 'INTERNO') {
        return !!wizard.clonInterno?.planOrigenId
      }
      if (wizard.subModoClonado === 'TRADICIONAL') {
        const t = wizard.clonTradicional
        if (!t) return false
        const tieneWord = !!t.archivoWordPlanId
        const tieneAlMenosUnExcel =
          !!t.archivoMapaExcelId || !!t.archivoMateriasExcelId
        return tieneWord && tieneAlMenosUnExcel
      }
    }
    return false
  })()

  const generarPreviewIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }))
    await new Promise((r) => setTimeout(r, 800))
    const preview: PlanPreview = {
      nombrePlan: wizard.datosBasicos.nombrePlan || 'Plan sin nombre',
      nivel: wizard.datosBasicos.nivel || 'Licenciatura',
      tipoCiclo: wizard.datosBasicos.tipoCiclo,
      numCiclos: wizard.datosBasicos.numCiclos,
      numMateriasAprox: wizard.datosBasicos.numCiclos * 6,
      secciones: [
        { id: 'obj', titulo: 'Objetivos', resumen: 'Borrador de objetivos…' },
        { id: 'perfil', titulo: 'Perfil de egreso', resumen: 'Borrador…' },
      ],
    }
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: { previewPlan: preview },
    }))
  }

  const crearPlan = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }))
    await new Promise((r) => setTimeout(r, 900))
    const nuevoId = (() => {
      if (wizard.modoCreacion === 'MANUAL') return 'plan_new_manual_001'
      if (wizard.modoCreacion === 'IA') return 'plan_new_ai_001'
      if (wizard.subModoClonado === 'INTERNO') return 'plan_new_clone_001'
      return 'plan_new_import_001'
    })()
    navigate({ to: `/planes/${nuevoId}` })
  }
  // ------------------------------------------------

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      {/* FIX LAYOUT:
          1. h-[90vh]: Altura fija del 90% de la ventana.
          2. flex-col gap-0 p-0: Quitamos espacios automáticos para control manual.
      */}
      <DialogContent
        className="flex h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        {role !== 'JEFE_CARRERA' ? (
          // --- VISTA SIN PERMISOS ---
          <>
            <DialogHeader className="flex-none border-b p-6">
              <DialogTitle>Nuevo plan de estudios</DialogTitle>
            </DialogHeader>
            <div className="flex-1 p-6">
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.ShieldAlert className="text-destructive h-5 w-5" />
                    Sin permisos
                  </CardTitle>
                  <CardDescription>
                    No tienes permisos para crear planes de estudio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button variant="secondary" onClick={handleClose}>
                    Volver
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          // --- VISTA WIZARD ---
          <Wizard.Stepper.Provider
            initialStep={Wizard.utils.getFirst().id}
            className="flex h-full flex-col"
          >
            {({ methods }) => {
              // --- LÓGICA PARA MÓVIL (Cálculos) ---
              const currentIndex = Wizard.utils.getIndex(methods.current.id) + 1
              const totalSteps = Wizard.steps.length
              const nextStep = Wizard.steps[currentIndex]
              return (
                <>
                  {/* =========================================================
                      HEADER RESPONSIVO
                      ========================================================= */}
                  <div className="z-10 flex-none border-b bg-white">
                    <div className="flex items-center justify-between p-6 pb-4">
                      <DialogHeader className="p-0">
                        {' '}
                        {/* Quitamos padding interno porque ya lo tiene el div padre */}
                        <DialogTitle /* className="hidden sm:block" */>
                          Nuevo plan de estudios
                        </DialogTitle>
                      </DialogHeader>

                      {/* BOTÓN DE CERRAR (X) */}
                      <button
                        onClick={handleClose}
                        className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
                      >
                        <Icons.X className="h-4 w-4" />
                        <span className="sr-only">Cerrar</span>
                      </button>
                    </div>

                    <div className="px-6 pb-6">
                      {/* OPCIÓN A: MÓVIL (< 640px) 
                          - Usa block sm:hidden
                          - Muestra el CircularProgress y Texto Grande
                      */}
                      <div className="block sm:hidden">
                        <div className="flex items-center gap-5">
                          <CircularProgress
                            current={currentIndex}
                            total={totalSteps}
                          />
                          <div className="flex flex-col justify-center">
                            <h2 className="text-lg font-bold text-slate-900">
                              {/* Usamos el Helper del Tooltip aquí también */}
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

                      {/* OPCIÓN B: DESKTOP (>= 640px)
                          - Usa hidden sm:block
                          - Muestra la navegación original horizontal
                      */}
                      <div className="hidden sm:block">
                        <Wizard.Stepper.Navigation className="border-border/60 rounded-xl border bg-slate-50 p-2">
                          {Wizard.steps.map((step) => (
                            <Wizard.Stepper.Step
                              key={step.id}
                              of={step.id}
                              className="whitespace-nowrap"
                            >
                              <Wizard.Stepper.Title>
                                {/* Envolvemos el título en nuestro componente Tooltip */}
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

                  {/* 2. CONTENIDO (SCROLLEABLE - Meat) 
                    flex-1: Ocupa todo el espacio restante.
                    overflow-y-auto: Scrollea solo esta parte.
                  */}
                  <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    {/* Aquí renderizamos el panel. Quitamos el 'grid' del padre para evitar conflictos de altura */}
                    <div className="mx-auto max-w-3xl">
                      {Wizard.utils.getIndex(methods.current.id) === 0 && (
                        <Wizard.Stepper.Panel>
                          <PasoModo wizard={wizard} onChange={setWizard} />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 1 && (
                        <Wizard.Stepper.Panel>
                          <PasoBasicos
                            wizard={wizard}
                            onChange={setWizard}
                            carrerasFiltradas={carrerasFiltradas}
                          />
                        </Wizard.Stepper.Panel>
                      )}
                      {Wizard.utils.getIndex(methods.current.id) === 2 && (
                        <Wizard.Stepper.Panel>
                          <PasoDetalles
                            wizard={wizard}
                            onChange={setWizard}
                            onGenerarIA={generarPreviewIA}
                            isLoading={wizard.isLoading}
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

                  {/* 3. CONTROLES (FIJO - Bottom Bun) 
                    flex-none: Siempre visible abajo.
                */}
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
                                !canContinueDesdeModo) ||
                              (Wizard.utils.getIndex(methods.current.id) ===
                                1 &&
                                !canContinueDesdeBasicos) ||
                              (Wizard.utils.getIndex(methods.current.id) ===
                                2 &&
                                !canContinueDesdeDetalles)
                            }
                          >
                            Siguiente
                          </Button>
                        ) : (
                          <Button
                            onClick={crearPlan}
                            disabled={wizard.isLoading}
                          >
                            Crear plan
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

function StepWithTooltip({ title, desc }: { title: string; desc: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <span
            className="cursor-help decoration-dotted underline-offset-4 hover:underline"
            onClick={(e) => {
              e.stopPropagation() // Evita que el clic dispare la navegación del stepper si está dentro de un botón
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

// Paso 1: selección de modo
function PasoModo({
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
            {/* USO DE GRID PARA RESPONSIVIDAD:
      - grid-cols-1: En móviles (default) ocupan todo el ancho, uno encima de otro.
      - sm:grid-cols-2: A partir de 640px, se ponen lado a lado con ancho equitativo.
      - gap-3: El "ligero espacio" entre ellos.
  */}

            {/* OPCIÓN 1: INTERNO */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange((w) => ({ ...w, subModoClonado: 'INTERNO' }))
              }}
              className={`hover:border-primary/50 hover:bg-accent flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border p-4 text-center transition-all sm:flex-col ${
                isSubSelected('INTERNO')
                  ? 'border-primary bg-primary/5 ring-primary text-primary ring-1' // Estado Activo
                  : 'border-border text-muted-foreground' // Estado Inactivo
              } `}
            >
              <Icons.Database className="mb-1 h-6 w-6" />
              <span className="text-sm font-medium">Del sistema</span>
            </div>

            {/* OPCIÓN 2: TRADICIONAL */}
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

// Paso 2: datos básicos
function PasoBasicos({
  wizard,
  onChange,
  carrerasFiltradas,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  carrerasFiltradas: typeof CARRERAS
}) {
  return (
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

      {/* <div className="grid gap-1">
        <Label htmlFor="facultad">Facultad</Label>
        <select
          id="facultad"
          className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          value={wizard.datosBasicos.facultadId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            onChange((w) => ({
              ...w,
              datosBasicos: {
                ...w.datosBasicos,
                facultadId: e.target.value,
                carreraId: '',
              },
            }))
          }
        >
          <option value="">Selecciona facultad…</option>
          {FACULTADES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div> */}
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
                carreraId: '', // Mantenemos tu lógica de resetear la carrera
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
                tipoCiclo: value as TipoCiclo,
              },
            }))
          }
        >
          <SelectTrigger
            id="tipoCiclo"
            className="w-full min-w-0 [&>span]:block! [&>span]:truncate!"
          >
            <SelectValue />
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
        />
      </div>
    </div>
  )
}

// Paso 3: detalles por modo
function PasoDetalles({
  wizard,
  onChange,
  onGenerarIA,
  isLoading,
}: {
  wizard: NewPlanWizardState
  onChange: React.Dispatch<React.SetStateAction<NewPlanWizardState>>
  onGenerarIA: () => void
  isLoading: boolean
}) {
  if (wizard.modoCreacion === 'MANUAL') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creación manual</CardTitle>
          <CardDescription>
            Se creará un plan en blanco con estructura mínima.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (wizard.modoCreacion === 'IA') {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="desc">Descripción del enfoque</Label>
          <textarea
            id="desc"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Describe el enfoque del programa…"
            value={wizard.iaConfig?.descripcionEnfoque || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  descripcionEnfoque: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="poblacion">Población objetivo</Label>
          <Input
            id="poblacion"
            placeholder="Ej. Egresados de bachillerato con perfil STEM"
            value={wizard.iaConfig?.poblacionObjetivo || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  poblacionObjetivo: e.target.value,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="notas">Notas adicionales</Label>
          <textarea
            id="notas"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="Lineamientos institucionales, restricciones, etc."
            value={wizard.iaConfig?.notasAdicionales || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onChange((w) => ({
                ...w,
                iaConfig: {
                  ...(w.iaConfig || ({} as any)),
                  notasAdicionales: e.target.value,
                },
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Opcional: se pueden adjuntar recursos IA más adelante.
          </div>
          <Button onClick={onGenerarIA} disabled={isLoading}>
            {isLoading ? 'Generando…' : 'Generar borrador con IA'}
          </Button>
        </div>

        {wizard.resumen.previewPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Preview IA</CardTitle>
              <CardDescription>
                Materias aprox.: {wizard.resumen.previewPlan.numMateriasAprox}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-muted-foreground list-disc pl-5 text-sm">
                {wizard.resumen.previewPlan.secciones?.map((s) => (
                  <li key={s.id}>
                    <span className="text-foreground font-medium">
                      {s.titulo}:
                    </span>{' '}
                    {s.resumen}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'INTERNO'
  ) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="clonFacultad">Facultad</Label>
            <select
              id="clonFacultad"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.facultadId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    facultadId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {FACULTADES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="clonCarrera">Carrera</Label>
            <select
              id="clonCarrera"
              className="bg-background text-foreground ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              value={wizard.datosBasicos.carreraId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onChange((w) => ({
                  ...w,
                  datosBasicos: {
                    ...w.datosBasicos,
                    carreraId: e.target.value,
                  },
                }))
              }
            >
              <option value="">Todas</option>
              {CARRERAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="buscarPlan">Buscar</Label>
            <Input
              id="buscarPlan"
              placeholder="Nombre del plan…"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const term = e.target.value.toLowerCase()
                // Podrías guardar este término en estado local si quisieras.
                void term
              }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {PLANES_EXISTENTES.filter(
            (p) =>
              (!wizard.datosBasicos.facultadId ||
                p.facultadId === wizard.datosBasicos.facultadId) &&
              (!wizard.datosBasicos.carreraId ||
                p.carreraId === wizard.datosBasicos.carreraId),
          ).map((p) => (
            <Card
              key={p.id}
              className={
                p.id === wizard.clonInterno?.planOrigenId
                  ? 'ring-ring ring-2'
                  : ''
              }
              onClick={() =>
                onChange((w) => ({ ...w, clonInterno: { planOrigenId: p.id } }))
              }
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{p.nombre}</span>
                  <span className="text-muted-foreground text-sm">
                    {p.estado} · {p.anio}
                  </span>
                </CardTitle>
                <CardDescription>ID: {p.id}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (
    wizard.modoCreacion === 'CLONADO' &&
    wizard.subModoClonado === 'TRADICIONAL'
  ) {
    return (
      <div className="grid gap-4">
        <div>
          <Label htmlFor="word">Word del plan (obligatorio)</Label>
          <input
            id="word"
            type="file"
            accept=".doc,.docx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoWordPlanId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="mapa">Excel del mapa curricular</Label>
          <input
            id="mapa"
            type="file"
            accept=".xls,.xlsx"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoMapaExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="materias">Excel/listado de materias</Label>
          <input
            id="materias"
            type="file"
            accept=".xls,.xlsx,.csv"
            className="bg-background text-foreground ring-offset-background focus-visible:ring-ring file:bg-secondary block w-full rounded-md border px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange((w) => ({
                ...w,
                clonTradicional: {
                  ...(w.clonTradicional || ({} as any)),
                  archivoMateriasExcelId: e.target.files?.[0]
                    ? `file_${e.target.files[0].name}`
                    : null,
                },
              }))
            }
          />
        </div>
        <div className="text-muted-foreground text-sm">
          Sube al menos Word y uno de los Excel para continuar.
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona un modo</CardTitle>
        <CardDescription>
          Elige una opción en el paso anterior para continuar.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

// Paso 4: resumen
function PasoResumen({ wizard }: { wizard: NewPlanWizardState }) {
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
                Materias aprox.: {wizard.resumen.previewPlan.numMateriasAprox}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
