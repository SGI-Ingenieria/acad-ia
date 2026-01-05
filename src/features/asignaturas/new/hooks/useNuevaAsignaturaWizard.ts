import { useState } from "react";

import type { AsignaturaPreview, NewSubjectWizardState } from "../types";

export function useNuevaAsignaturaWizard(planId: string) {
  const [wizard, setWizard] = useState<NewSubjectWizardState>({
    step: 1,
    planId,
    modoCreacion: null,
    datosBasicos: {
      nombre: "",
      clave: "",
      tipo: "OBLIGATORIA",
      creditos: 0,
      horasSemana: 0,
      estructuraId: "",
    },
    clonInterno: {},
    clonTradicional: {
      archivoWordAsignaturaId: null,
      archivosAdicionalesIds: [],
    },
    iaConfig: {
      descripcionEnfoque: "",
      notasAdicionales: "",
      archivosExistentesIds: [],
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  });

  const canContinueDesdeMetodo = wizard.modoCreacion === "MANUAL" ||
    wizard.modoCreacion === "IA" ||
    (wizard.modoCreacion === "CLONADO" && !!wizard.subModoClonado);

  const canContinueDesdeBasicos = !!wizard.datosBasicos.nombre &&
    wizard.datosBasicos.creditos > 0 &&
    !!wizard.datosBasicos.estructuraId;

  const canContinueDesdeConfig = (() => {
    if (wizard.modoCreacion === "MANUAL") return true;
    if (wizard.modoCreacion === "IA") {
      return !!wizard.iaConfig?.descripcionEnfoque;
    }
    if (wizard.modoCreacion === "CLONADO") {
      if (wizard.subModoClonado === "INTERNO") {
        return !!wizard.clonInterno?.asignaturaOrigenId;
      }
      if (wizard.subModoClonado === "TRADICIONAL") {
        return !!wizard.clonTradicional?.archivoWordAsignaturaId;
      }
    }
    return false;
  })();

  const simularGeneracionIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true }));
    await new Promise((r) => setTimeout(r, 1500));
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: {
        previewAsignatura: {
          nombre: w.datosBasicos.nombre,
          objetivo:
            "Aplicar los fundamentos teóricos para la resolución de problemas...",
          unidades: 5,
          bibliografiaCount: 3,
        } as AsignaturaPreview,
      },
    }));
  };

  const crearAsignatura = async (onCreated: () => void) => {
    setWizard((w) => ({ ...w, isLoading: true }));
    await new Promise((r) => setTimeout(r, 1000));
    onCreated();
  };

  return {
    wizard,
    setWizard,
    canContinueDesdeMetodo,
    canContinueDesdeBasicos,
    canContinueDesdeConfig,
    simularGeneracionIA,
    crearAsignatura,
  };
}
