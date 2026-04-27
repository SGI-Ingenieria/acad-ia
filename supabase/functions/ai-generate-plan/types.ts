export type AIGeneratePlanInput = {
  datosBasicos: {
    nombrePlan: string
    carreraId: string
    facultadId?: string
    nivel: string
    tipoCiclo: 'Semestre' | 'Cuatrimestre' | 'Trimestre' | 'Otro'
    numCiclos: number
    estructuraPlanId: string
  }
  iaConfig: {
    descripcionEnfoqueAcademico: string
    instruccionesAdicionalesIA?: string
    archivosReferencia?: Array<string>
    repositoriosIds?: Array<string>
    usarMCP?: boolean
  }
  archivosAdjuntos?: Array<File>
}
