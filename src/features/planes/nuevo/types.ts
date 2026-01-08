export type TipoCiclo = "SEMESTRE" | "CUATRIMESTRE" | "TRIMESTRE";
export type ModoCreacion = "MANUAL" | "IA" | "CLONADO";
export type SubModoClonado = "INTERNO" | "TRADICIONAL";

export type PlanPreview = {
  nombrePlan: string;
  nivel: string;
  tipoCiclo: TipoCiclo;
  numCiclos: number;
  numAsignaturasAprox?: number;
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
    tipoCiclo: TipoCiclo | "";
    numCiclos: number | undefined;
    // Selección de plantillas (obligatorias)
    plantillaPlanId?: string;
    plantillaPlanVersion?: string;
    plantillaMapaId?: string;
    plantillaMapaVersion?: string;
  };
  clonInterno?: { planOrigenId: string | null };
  clonTradicional?: {
    archivoWordPlanId:
      | {
        id: string;
        name: string;
        size: string;
        type: string;
      }
      | null;
    archivoMapaExcelId: {
      id: string;
      name: string;
      size: string;
      type: string;
    } | null;
    archivoAsignaturasExcelId: {
      id: string;
      name: string;
      size: string;
      type: string;
    } | null;
  };
  iaConfig?: {
    descripcionEnfoque: string;
    poblacionObjetivo: string;
    notasAdicionales: string;
    archivosReferencia: Array<string>;
    repositoriosReferencia?: Array<string>;
    archivosAdjuntos?: Array<
      { id: string; name: string; size: string; type: string }
    >;
  };
  resumen: { previewPlan?: PlanPreview };
  isLoading: boolean;
  errorMessage: string | null;
};
