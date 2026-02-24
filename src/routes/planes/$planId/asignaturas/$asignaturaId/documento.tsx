import { createFileRoute, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { DocumentoSEPTab } from '@/components/asignaturas/detalle/DocumentoSEPTab'
import { fetchPlanPdf } from '@/data/api/document.api'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/documento',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId/documento',
  })

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const loadPdfPreview = useCallback(async () => {
    try {
      setIsLoading(true)

      const pdfBlob = await fetchPlanPdf({
        plan_estudio_id: planId,
      })

      const url = window.URL.createObjectURL(pdfBlob)

      setPdfUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        return url
      })
    } catch (error) {
      console.error('Error cargando PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }, [planId])

  useEffect(() => {
    loadPdfPreview()

    return () => {
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl)
    }
  }, [loadPdfPreview])

  const handleDownload = async () => {
    const pdfBlob = await fetchPlanPdf({
      plan_estudio_id: planId,
    })

    const url = window.URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'documento_sep.pdf'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true)

      await loadPdfPreview()
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <DocumentoSEPTab
      pdfUrl={pdfUrl}
      isLoading={isLoading}
      onDownload={handleDownload}
      onRegenerate={handleRegenerate}
      isRegenerating={isRegenerating}
    />
  )
}
