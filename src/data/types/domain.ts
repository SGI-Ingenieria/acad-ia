import type { Enums, Tables } from "../../types/supabase";
import type { Json } from "src/types/supabase";

export type UUID = string;

export type TipoEstructuraPlan = Enums<"tipo_estructura_plan">;
export type NivelPlanEstudio = Enums<"nivel_plan_estudio">;
export type TipoCiclo = Enums<"tipo_ciclo">;

export type TipoOrigen = Enums<"tipo_origen">;

export type TipoAsignatura = Enums<"tipo_asignatura">;

export type TipoBibliografia = "BASICA" | "COMPLEMENTARIA";
export type TipoFuenteBibliografia = "MANUAL" | "BIBLIOTECA";

export type EstadoTareaRevision = "PENDIENTE" | "COMPLETADA" | "OMITIDA";
export type TipoNotificacion =
  | "PLAN_ASIGNADO"
  | "ESTADO_CAMBIADO"
  | "TAREA_ASIGNADA"
  | "COMENTARIO"
  | "OTRA";

export type TipoInteraccionIA = "GENERAR" | "MEJORAR_SECCION" | "CHAT" | "OTRA";

export type ModalidadEducativa = "Escolar" | "No escolarizada" | "Mixta";
export type DisenoCurricular = "Rígido" | "Flexible";

/** Basado en tu schema JSON (va típicamente dentro de planes_estudio.datos) */
export type PlanDatosSep = {
  nivel?: string;
  nombre?: string;
  modalidad_educativa?: ModalidadEducativa;

  antecedente_academico?: string;
  area_de_estudio?: string;
  clave_del_plan_de_estudios?: string;

  diseno_curricular?: DisenoCurricular;

  total_de_ciclos_del_plan_de_estudios?: string;
  duracion_del_ciclo_escolar?: string;
  carga_horaria_a_la_semana?: number;

  fines_de_aprendizaje_o_formacion?: string;
  perfil_de_egreso?: string;

  programa_de_investigacion?: string | null;
  curso_propedeutico?: string | null;

  perfil_de_ingreso?: string;

  administracion_y_operatividad_del_plan_de_estudios?: string | null;
  sustento_teorico_del_modelo_curricular?: string | null;
  justificacion_de_la_propuesta_curricular?: string | null;
  propuesta_de_evaluacion_periodica_del_plan_de_estudios?: string | null;
};

export type Paged<T> = { data: Array<T>; count: number | null };

export type FacultadRow = Tables<"facultades">;
export type CarreraRow = Tables<"carreras">;

export type EstructuraPlanRow = Tables<"estructuras_plan">;

export type EstructuraAsignatura = {
  id: UUID;
  nombre: string;
  version: string | null;
  definicion: Json;
};

export type EstadoPlanRow = Tables<"estados_plan">;
export type PlanEstudioRow = Tables<"planes_estudio">;

export type PlanEstudio = PlanEstudioRow & {
  carreras: (CarreraRow & { facultades: FacultadRow | null }) | null;
  estructuras_plan: EstructuraPlanRow | null;
  estados_plan: EstadoPlanRow | null;
};

export type LineaPlan = {
  id: UUID;
  plan_estudio_id: UUID;
  nombre: string;
  orden: number;
  area: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type Asignatura = {
  id: UUID;
  plan_estudio_id: UUID;
  estructura_id: UUID | null;

  facultad_propietaria_id: UUID | null;

  codigo: string | null;
  nombre: string;

  tipo: TipoAsignatura;
  creditos: number;
  horas_semana: number | null;

  numero_ciclo: number | null;
  linea_plan_id: UUID | null;
  orden_celda: number | null;

  datos: Json;
  contenido_tematico: Json;

  tipo_origen: TipoOrigen | null;
  meta_origen: Json;

  creado_por: UUID | null;
  actualizado_por: UUID | null;

  creado_en: string;
  actualizado_en: string;

  planes_estudio?: PlanEstudio | null;
  estructuras_asignatura?: EstructuraAsignatura | null;
};

export type BibliografiaAsignatura = {
  id: UUID;
  asignatura_id: UUID;
  tipo: TipoBibliografia;
  cita: string;
  tipo_fuente: TipoFuenteBibliografia;
  biblioteca_item_id: string | null;

  creado_por: UUID | null;
  creado_en: string;
  actualizado_en: string;
};

export type CambioPlan = {
  id: UUID;
  plan_estudio_id: UUID;
  cambiado_por: UUID | null;
  cambiado_en: string;
  tipo: "ACTUALIZACION_CAMPO" | "ACTUALIZACION_MAPA" | "OTRO";
  campo: string | null;
  valor_anterior: Json | null;
  valor_nuevo: Json | null;
  interaccion_ia_id: UUID | null;
};

export type CambioAsignatura = {
  id: UUID;
  asignatura_id: UUID;
  cambiado_por: UUID | null;
  cambiado_en: string;
  tipo: "ACTUALIZACION_CAMPO" | "ACTUALIZACION_MAPA" | "OTRO";
  campo: string | null;
  valor_anterior: Json | null;
  valor_nuevo: Json | null;
  fuente: "HUMANO" | "IA" | null;
  interaccion_ia_id: UUID | null;
};

export type InteraccionIA = {
  id: UUID;
  usuario_id: UUID | null;
  plan_estudio_id: UUID | null;
  asignatura_id: UUID | null;

  tipo: TipoInteraccionIA;
  modelo: string | null;
  temperatura: number | null;

  prompt: Json;
  respuesta: Json;

  aceptada: boolean;

  conversacion_id: string | null;
  ids_archivos: Json;
  ids_vector_store: Json;

  creado_en: string;
};

export type TareaRevision = {
  id: UUID;
  plan_estudio_id: UUID;
  asignado_a: UUID;
  rol_id: UUID | null;
  estado_id: UUID | null;
  estatus: EstadoTareaRevision;
  fecha_limite: string | null;
  creado_en: string;
  completado_en: string | null;
};

export type Notificacion = {
  id: UUID;
  usuario_id: UUID;
  tipo: TipoNotificacion;
  payload: Json;
  leida: boolean;
  creado_en: string;
  leida_en: string | null;
};

export type Archivo = {
  id: UUID;
  ruta_storage: string;
  nombre: string;
  mime_type: string | null;
  bytes: number | null;
  subido_por: UUID | null;
  subido_en: string;
  temporal: boolean;
  openai_file_id: string | null;
  notas: string | null;
};
