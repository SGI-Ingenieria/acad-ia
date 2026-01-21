export type PlanStatus =
  | 'borrador'
  | 'revision'
  | 'expertos'
  | 'consejo'
  | 'aprobado'
  | 'rechazado'

export type TipoPlan =
  | 'Licenciatura'
  | 'Maestría'
  | 'Doctorado'
  | 'Especialidad'

export type TipoMateria = 'obligatoria' | 'optativa' | 'troncal'

export type MateriaStatus = 'borrador' | 'revisada' | 'aprobada'

export interface Facultad {
  id: string
  nombre: string
  color: string
  icono: string
}

export interface Carrera {
  id: string
  nombre: string
  facultadId: string
}

export interface LineaCurricular {
  id: string
  nombre: string
  orden: number
  color?: string
}

export interface Materia {
  id: string
  clave: string
  nombre: string
  creditos: number
  ciclo: number | null
  lineaCurricularId: string | null
  tipo: TipoMateria
  estado: MateriaStatus
  orden?: number
  hd: number // <--- Añadir
  hi: number // <--- Añadir
  prerrequisitos: Array<string>
}

export interface Plan {
  id: string
  nombre: string
  carrera: Carrera
  facultad: Facultad
  tipoPlan: TipoPlan
  nivel?: string
  modalidad?: string
  duracionCiclos: number
  creditosTotales: number
  fechaCreacion: string
  estadoActual: PlanStatus
}

export interface DatosGeneralesField {
  id: string
  label: string
  value: string
  tipo: 'texto' | 'lista' | 'parrafo'
  requerido: boolean
}

export interface CambioPlan {
  id: string
  fecha: string
  usuario: string
  tab: string
  descripcion: string
  detalle?: string
}

export interface ComentarioFlujo {
  id: string
  usuario: string
  fecha: string
  texto: string
  fase: PlanStatus
}

export interface DocumentoPlan {
  id: string
  fechaGeneracion: string
  version: number
  url?: string
}

export type PlanTab =
  | 'datos-generales'
  | 'mapa-curricular'
  | 'materias'
  | 'flujo'
  | 'ia'
  | 'documento'
  | 'historial'
