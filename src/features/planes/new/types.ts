export type TipoCiclo = "SEMESTRE" | "CUATRIMESTRE" | "TRIMESTRE";
export type ModoCreacion = "MANUAL" | "IA" | "CLONADO";
export type SubModoClonado = "INTERNO" | "TRADICIONAL";

export type PlanPreview = {
  nombrePlan: string;
  nivel: string;
  tipoCiclo: TipoCiclo;
  numCiclos: number;
  numMateriasAprox?: number;
  secciones?: Array<{ id: string; titulo: string; resumen: string }>;
};

export type NewPlanWizardState = {
  step: 1 | 2 | 3 | 4;
  modoCreacion: ModoCreacion | null;
  subModoClonado?: SubModoClonado;
  datosBasicos: {
    nombrePlan: string;
    carreraId: string;
    facultadId: string;
    nivel: string;
    tipoCiclo: TipoCiclo;
    numCiclos: number;
  };
  clonInterno?: { planOrigenId: string | null };
  clonTradicional?: {
    archivoWordPlanId: string | null;
    archivoMapaExcelId: string | null;
    archivoMateriasExcelId: string | null;
  };
  iaConfig?: {
    descripcionEnfoque: string;
    poblacionObjetivo: string;
    notasAdicionales: string;
    archivosReferencia: Array<string>;
  };
  resumen: { previewPlan?: PlanPreview };
  isLoading: boolean;
  errorMessage: string | null;
};
