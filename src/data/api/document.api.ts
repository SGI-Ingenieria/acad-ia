// document.api.ts

const DOCUMENT_PDF_URL =
  'https://n8n.app.lci.ulsa.mx/webhook/62ca84ec-0adb-4006-aba1-32282d27d434'

interface GeneratePdfParams {
  plan_estudio_id: string
}

export async function fetchPlanPdf({
  plan_estudio_id,
}: GeneratePdfParams): Promise<Blob> {
  const response = await fetch(DOCUMENT_PDF_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_estudio_id }),
  })

  if (!response.ok) {
    throw new Error('Error al generar el PDF')
  }

  // n8n devuelve el archivo → lo tratamos como blob
  return await response.blob()
}
