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
