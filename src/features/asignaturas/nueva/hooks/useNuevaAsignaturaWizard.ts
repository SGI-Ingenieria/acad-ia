import { useState } from 'react'

import type { NewSubjectWizardState } from '../types'

export function useNuevaAsignaturaWizard(planId: string) {
  const [wizard, setWizard] = useState<NewSubjectWizardState>({
    step: 1,
    plan_estudio_id: planId,
    tipoOrigen: null,
    datosBasicos: {
      nombre: '',
      codigo: '',
      tipo: null,
      creditos: null,
      horasAcademicas: null,
      horasIndependientes: null,
      estructuraId: '',
    },
    sugerencias: [],
    clonInterno: {},
    clonTradicional: {
      archivoWordAsignaturaId: null,
      archivosAdicionalesIds: [],
    },
    iaConfig: {
      descripcionEnfoqueAcademico: '',
      instruccionesAdicionalesIA: '',
      archivosReferencia: [],
      repositoriosReferencia: [],
      archivosAdjuntos: [],
    },
    iaMultiple: {
      ciclo: null,
      enfoque: '',
      cantidadDeSugerencias: 10,
    },
    resumen: {},
    isLoading: false,
    errorMessage: null,
  })

  const canContinueDesdeMetodo =
    wizard.tipoOrigen === 'MANUAL' ||
    wizard.tipoOrigen === 'IA_SIMPLE' ||
    wizard.tipoOrigen === 'IA_MULTIPLE' ||
    wizard.tipoOrigen === 'CLONADO_INTERNO' ||
    wizard.tipoOrigen === 'CLONADO_TRADICIONAL'

  const canContinueDesdeBasicos =
    (!!wizard.datosBasicos.nombre &&
      wizard.datosBasicos.tipo !== null &&
      wizard.datosBasicos.creditos !== null &&
      wizard.datosBasicos.creditos > 0 &&
      !!wizard.datosBasicos.estructuraId) ||
    true

  const canContinueDesdeDetalles = (() => {
    if (wizard.tipoOrigen === 'MANUAL') return true
    if (wizard.tipoOrigen === 'IA') {
      return !!wizard.iaConfig?.descripcionEnfoqueAcademico
    }
    if (wizard.tipoOrigen === 'CLONADO_INTERNO') {
      return !!wizard.clonInterno?.asignaturaOrigenId
    }
    if (wizard.tipoOrigen === 'CLONADO_TRADICIONAL') {
      return !!wizard.clonTradicional?.archivoWordAsignaturaId
    }
    return false
  })()

  return {
    wizard,
    setWizard,
    canContinueDesdeMetodo,
    canContinueDesdeBasicos,
    canContinueDesdeDetalles,
  }
}
