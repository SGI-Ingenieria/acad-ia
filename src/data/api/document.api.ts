// document.api.ts

import { invokeEdge } from '../supabase/invokeEdge'

const EDGE = {
  carbone_io_wrapper: 'carbone-io-wrapper',
} as const

const DOCUMENT_PDF_ASIGNATURA_URL =
  'https://n8n.app.lci.ulsa.mx/webhook/041a68be-7568-46d0-bc08-09ded12d017d'

interface GeneratePdfParams {
  plan_estudio_id: string
}
interface GeneratePdfParamsAsignatura {
  asignatura_id: string
}

export async function fetchPlanPdf({
  plan_estudio_id,
}: GeneratePdfParams): Promise<Blob> {
  return await invokeEdge<Blob>(
    EDGE.carbone_io_wrapper,
    {
      action: 'downloadReport',
      plan_estudio_id,
      body: { convertTo: 'pdf' },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'blob',
    },
  )
}

export async function fetchAsignaturaPdf({
  asignatura_id,
}: GeneratePdfParamsAsignatura): Promise<Blob> {
  const response = await fetch(DOCUMENT_PDF_ASIGNATURA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ asignatura_id }),
  })

  if (!response.ok) {
    throw new Error('Error al generar el PDF')
  }

  // n8n devuelve el archivo → lo tratamos como blob
  return await response.blob()
}
