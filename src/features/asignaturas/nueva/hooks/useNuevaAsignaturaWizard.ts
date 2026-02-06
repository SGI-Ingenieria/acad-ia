import { useState } from 'react'

import type { AsignaturaPreview, NewSubjectWizardState } from '../types'

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
    resumen: {},
    isLoading: false,
    errorMessage: null,
  })

  const canContinueDesdeMetodo =
    wizard.tipoOrigen === 'MANUAL' ||
    wizard.tipoOrigen === 'IA' ||
    wizard.tipoOrigen === 'CLONADO_INTERNO' ||
    wizard.tipoOrigen === 'CLONADO_TRADICIONAL'

  const canContinueDesdeBasicos =
    !!wizard.datosBasicos.nombre &&
    wizard.datosBasicos.tipo !== null &&
    wizard.datosBasicos.creditos !== null &&
    wizard.datosBasicos.creditos > 0 &&
    !!wizard.datosBasicos.estructuraId

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

  const simularGeneracionIA = async () => {
    setWizard((w) => ({ ...w, isLoading: true }))
    await new Promise((r) => setTimeout(r, 1500))
    setWizard((w) => ({
      ...w,
      isLoading: false,
      resumen: {
        previewAsignatura: {
          nombre: w.datosBasicos.nombre,
          objetivo:
            'Aplicar los fundamentos teóricos para la resolución de problemas...',
          unidades: 5,
          bibliografiaCount: 3,
        } as AsignaturaPreview,
      },
    }))
  }

  const crearAsignatura = async () => {
    await new Promise((r) => setTimeout(r, 1000))
  }

  return {
    wizard,
    setWizard,
    canContinueDesdeMetodo,
    canContinueDesdeBasicos,
    canContinueDesdeDetalles,
    simularGeneracionIA,
    crearAsignatura,
  }
}
