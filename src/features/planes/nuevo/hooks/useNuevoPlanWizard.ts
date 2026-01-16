import { useState } from "react";

import type { NewPlanWizardState, PlanPreview } from "../types";
import type { NivelPlanEstudio, TipoCiclo } from "@/data/types/domain";

export function useNuevoPlanWizard() {
  const [wizard, setWizard] = useState<NewPlanWizardState>({
    step: 1,
    tipoOrigen: null,
    datosBasicos: {
      nombrePlan: "",
      carreraId: "",
      facultadId: "",
      nivel: "",
      tipoCiclo: "",
      numCiclos: undefined,
      estructuraPlanId: null,
    },
    // datosBasicos: {
    //   nombrePlan: "Medicina",
    //   carreraId: "medico",
    //   facultadId: "med",
    //   nivel: "Licenciatura",
    //   tipoCiclo: "SEMESTRE",
    //   numCiclos: 8,
    //   plantillaPlanId: "sep-2025",
    //   plantillaPlanVersion: "v2025.2 (Vigente)",
    //   plantillaMapaId: "sep-2017-xlsx",
    //   plantillaMapaVersion: "v2017.0",
    // },
    clonInterno: { planOrigenId: null },
    clonTradicional: {
      archivoWordPlanId: null,
      archivoMapaExcelId: null,
      archivoAsignaturasExcelId: null,
    },
    iaConfig: {
      descripcionEnfoque: "",
      notasAdicionales: "",
      archivosReferencia: [],
      repositoriosReferencia: [],
      archivosAdjuntos: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  });

  const canContinueDesdeModo = wizard.tipoOrigen === "MANUAL" ||
    wizard.tipoOrigen === "IA" ||
    (wizard.tipoOrigen === "CLONADO_INTERNO" ||
      wizard.tipoOrigen === "CLONADO_TRADICIONAL");

  const canContinueDesdeBasicos = !!wizard.datosBasicos.nombrePlan &&
    !!wizard.datosBasicos.carreraId &&
    !!wizard.datosBasicos.facultadId &&
    !!wizard.datosBasicos.nivel &&
    (wizard.datosBasicos.numCiclos !== undefined &&
      wizard.datosBasicos.numCiclos > 0) &&
    // Requerir ambas plantillas (plan y mapa) con versión
    !!wizard.datosBasicos.estructuraPlanId;

  const canContinueDesdeDetalles = (() => {
    if (wizard.tipoOrigen === "MANUAL") return true;
    if (wizard.tipoOrigen === "IA") {
      // Requerimos descripción del enfoque y notas adicionales
      return !!wizard.iaConfig?.descripcionEnfoque &&
        !!wizard.iaConfig.notasAdicionales;
    }
    if (wizard.tipoOrigen === "CLONADO_INTERNO") {
      return !!wizard.clonInterno?.planOrigenId;
    }
    if (wizard.tipoOrigen === "CLONADO_TRADICIONAL") {
      const t = wizard.clonTradicional;
      if (!t) return false;
      const tieneWord = !!t.archivoWordPlanId;
      const tieneAlMenosUnExcel = !!t.archivoMapaExcelId ||
        !!t.archivoAsignaturasExcelId;
      return tieneWord && tieneAlMenosUnExcel;
    }
    return false;
  })();

  const generarPreviewIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true, errorMessage: null }));
    await new Promise((r) => setTimeout(r, 800));
    // Ensure preview has the stricter types required by `PlanPreview`.
    let tipoCicloSafe: TipoCiclo;
    if (wizard.datosBasicos.tipoCiclo === "") {
      tipoCicloSafe = "Semestre";
    } else {
      tipoCicloSafe = wizard.datosBasicos.tipoCiclo;
    }
    const numCiclosSafe: number =
      typeof wizard.datosBasicos.numCiclos === "number"
        ? wizard.datosBasicos.numCiclos
        : 1;

    const preview: PlanPreview = {
      nombrePlan: wizard.datosBasicos.nombrePlan || "Plan sin nombre",
      nivel: wizard.datosBasicos.nivel as NivelPlanEstudio,
      tipoCiclo: tipoCicloSafe,
      numCiclos: numCiclosSafe,
      numAsignaturasAprox: numCiclosSafe * 6,
      secciones: [
        { id: "obj", titulo: "Objetivos", resumen: "Borrador de objetivos…" },
        { id: "perfil", titulo: "Perfil de egreso", resumen: "Borrador…" },
      ],
    };
    setWizard((w: NewPlanWizardState) => ({
      ...w,
      isLoading: false,
      resumen: { previewPlan: preview },
    }));
  };

  return {
    wizard,
    setWizard,
    canContinueDesdeModo,
    canContinueDesdeBasicos,
    canContinueDesdeDetalles,
    generarPreviewIA,
  };
}
