import type { TipoCiclo } from "./types";

export const FACULTADES = [
  { id: "ing", nombre: "Facultad de Ingeniería" },
  {
    id: "med",
    nombre: "Facultad de Medicina en medicina en medicina en medicina",
  },
  { id: "neg", nombre: "Facultad de Negocios" },
];

export const CARRERAS = [
  { id: "sis", nombre: "Ing. en Sistemas", facultadId: "ing" },
  { id: "ind", nombre: "Ing. Industrial", facultadId: "ing" },
  { id: "medico", nombre: "Médico Cirujano", facultadId: "med" },
  { id: "act", nombre: "Actuaría", facultadId: "neg" },
];

export const NIVELES = [
  "Licenciatura",
  "Especialidad",
  "Maestría",
  "Doctorado",
];
export const TIPOS_CICLO: Array<{ value: TipoCiclo; label: string }> = [
  { value: "SEMESTRE", label: "Semestre" },
  { value: "CUATRIMESTRE", label: "Cuatrimestre" },
  { value: "TRIMESTRE", label: "Trimestre" },
];

export const PLANES_EXISTENTES = [
  {
    id: "plan-2021-sis",
    nombre: "ISC 2021",
    estado: "Aprobado",
    anio: 2021,
    facultadId: "ing",
    carreraId: "sis",
  },
  {
    id: "plan-2020-ind",
    nombre: "I. Industrial 2020",
    estado: "Aprobado",
    anio: 2020,
    facultadId: "ing",
    carreraId: "ind",
  },
  {
    id: "plan-2019-med",
    nombre: "Medicina 2019",
    estado: "Vigente",
    anio: 2019,
    facultadId: "med",
    carreraId: "medico",
  },
];

export const ARCHIVOS = [
  {
    id: "file-1",
    nombre: "Sílabo POO 2023.docx",
    tipo: "docx",
    tamaño: "245 KB",
  },
  {
    id: "file-2",
    nombre: "Guía de prácticas BD.pdf",
    tipo: "pdf",
    tamaño: "1.2 MB",
  },
  {
    id: "file-3",
    nombre: "Rúbrica evaluación proyectos.xlsx",
    tipo: "xlsx",
    tamaño: "89 KB",
  },
  {
    id: "file-4",
    nombre: "Banco de reactivos IA.docx",
    tipo: "docx",
    tamaño: "567 KB",
  },
  {
    id: "file-5",
    nombre: "Material didáctico Web.pdf",
    tipo: "pdf",
    tamaño: "3.4 MB",
  },
];

export const REPOSITORIOS = [
  {
    id: "repo-1",
    nombre: "Materiales ISC 2024",
    descripcion: "Documentos de referencia para Ingeniería en Sistemas",
    cantidadArchivos: 45,
  },
  {
    id: "repo-2",
    nombre: "Lineamientos SEP",
    descripcion: "Documentos oficiales y normativas SEP actualizadas",
    cantidadArchivos: 12,
  },
  {
    id: "repo-3",
    nombre: "Bibliografía Digital",
    descripcion: "Recursos bibliográficos digitalizados",
    cantidadArchivos: 128,
  },
  {
    id: "repo-4",
    nombre: "Plantillas Institucionales",
    descripcion: "Formatos y plantillas oficiales ULSA",
    cantidadArchivos: 23,
  },
];
