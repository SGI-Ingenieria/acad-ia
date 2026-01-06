export type ModoCreacion = "MANUAL" | "IA" | "CLONADO";
export type SubModoClonado = "INTERNO" | "TRADICIONAL";
export type TipoAsignatura = "OBLIGATORIA" | "OPTATIVA" | "TRONCAL" | "OTRO";

export type AsignaturaPreview = {
  nombre: string;
  objetivo: string;
  unidades: number;
  bibliografiaCount: number;
};

export type NewSubjectWizardState = {
  step: 1 | 2 | 3 | 4;
  planId: string;
  modoCreacion: ModoCreacion | null;
  subModoClonado?: SubModoClonado;
  datosBasicos: {
    nombre: string;
    clave?: string;
    tipo: TipoAsignatura;
    creditos: number;
    horasSemana?: number;
    estructuraId: string;
  };
  clonInterno?: {
    facultadId?: string;
    carreraId?: string;
    planOrigenId?: string;
    asignaturaOrigenId?: string | null;
  };
  clonTradicional?: {
    archivoWordAsignaturaId: string | null;
    archivosAdicionalesIds: Array<string>;
  };
  iaConfig?: {
    descripcionEnfoque: string;
    notasAdicionales: string;
    archivosExistentesIds: Array<string>;
  };
  resumen: {
    previewAsignatura?: AsignaturaPreview;
  };
  isLoading: boolean;
  errorMessage: string | null;
};
