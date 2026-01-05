import { useMemo, useState } from "react";

import { CARRERAS } from "../catalogs";

import type { NewPlanWizardState, PlanPreview } from "../types";

export function useNuevoPlanWizard() {
  const [wizard, setWizard] = useState<NewPlanWizardState>({
    step: 1,
    modoCreacion: null,
    datosBasicos: {
      nombrePlan: "",
      carreraId: "",
      facultadId: "",
      nivel: "",
      tipoCiclo: "SEMESTRE",
      numCiclos: 8,
    },
    clonInterno: { planOrigenId: null },
    clonTradicional: {
      archivoWordPlanId: null,
      archivoMapaExcelId: null,
      archivoMateriasExcelId: null,
    },
    iaConfig: {
      descripcionEnfoque: "",
      poblacionObjetivo: "",
      notasAdicionales: "",
      archivosReferencia: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  });

  const carrerasFiltradas = useMemo(() => {
    const fac = wizard.datosBasicos.facultadId;
    return fac ? CARRERAS.filter((c) => c.facultadId === fac) : CARRERAS;
  }, [wizard.datosBasicos.facultadId]);

  const canContinueDesdeModo = wizard.modoCreacion === "MANUAL" ||
    wizard.modoCreacion === "IA" ||
    (wizard.modoCreacion === "CLONADO" && !!wizard.subModoClonado);

  const canContinueDesdeBasicos = !!wizard.datosBasicos.nombrePlan &&
    !!wizard.datosBasicos.carreraId &&
    !!wizard.datosBasicos.facultadId &&
    !!wizard.datosBasicos.nivel &&
    wizard.datosBasicos.numCiclos > 0;

  const canContinueDesdeDetalles = (() => {
    if (wizard.modoCreacion === "MANUAL") return true;
    if (wizard.modoCreacion === "IA") {
      return !!wizard.iaConfig?.descripcionEnfoque;
    }
    if (wizard.modoCreacion === "CLONADO") {
      if (wizard.subModoClonado === "INTERNO") {
        return !!wizard.clonInterno?.planOrigenId;
      }
      if (wizard.subModoClonado === "TRADICIONAL") {
        const t = wizard.clonTradicional;
        if (!t) return false;
        const tieneWord = !!t.archivoWordPlanId;
        const tieneAlMenosUnExcel = !!t.archivoMapaExcelId ||
          !!t.archivoMateriasExcelId;
        return tieneWord && tieneAlMenosUnExcel;
      }
    }
    return false;
  })();

  const generarPreviewIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }));
    await new Promise((r) => setTimeout(r, 800));
    const preview: PlanPreview = {
      nombrePlan: wizard.datosBasicos.nombrePlan || "Plan sin nombre",
      nivel: wizard.datosBasicos.nivel || "Licenciatura",
      tipoCiclo: wizard.datosBasicos.tipoCiclo,
      numCiclos: wizard.datosBasicos.numCiclos,
      numMateriasAprox: wizard.datosBasicos.numCiclos * 6,
      secciones: [
        { id: "obj", titulo: "Objetivos", resumen: "Borrador de objetivos…" },
        { id: "perfil", titulo: "Perfil de egreso", resumen: "Borrador…" },
      ],
    };
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: { previewPlan: preview },
    }));
  };

  return {
    wizard,
    setWizard,
    carrerasFiltradas,
    canContinueDesdeModo,
    canContinueDesdeBasicos,
    canContinueDesdeDetalles,
    generarPreviewIA,
  };
}
