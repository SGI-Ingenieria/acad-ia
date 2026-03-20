import { createFileRoute, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DocumentoSEPTab } from '@/components/asignaturas/detalle/DocumentoSEPTab'
import { fetchAsignaturaPdf } from '@/data/api/document.api'

export const Route = createFileRoute(
  '/planes/$planId/asignaturas/$asignaturaId/documento',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { asignaturaId } = useParams({
    from: '/planes/$planId/asignaturas/$asignaturaId/documento',
  })

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const pdfUrlRef = useRef<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const loadPdfPreview = useCallback(async () => {
    try {
      setIsLoading(true)

      const pdfBlob = await fetchAsignaturaPdf({
        asignatura_id: asignaturaId,
        convertTo: 'pdf',
      })

      const url = window.URL.createObjectURL(pdfBlob)

      setPdfUrl((prev) => {
        if (prev) window.URL.revokeObjectURL(prev)
        pdfUrlRef.current = url
        return url
      })
    } catch (error) {
      console.error('Error cargando PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }, [asignaturaId])

  useEffect(() => {
    loadPdfPreview()

    return () => {
      if (pdfUrlRef.current) window.URL.revokeObjectURL(pdfUrlRef.current)
    }
  }, [loadPdfPreview])

  const handleDownloadPdf = async () => {
    const pdfBlob = await fetchAsignaturaPdf({
      asignatura_id: asignaturaId,
      convertTo: 'pdf',
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

  const handleDownloadWord = async () => {
    const docBlob = await fetchAsignaturaPdf({
      asignatura_id: asignaturaId,
    })

    const url = window.URL.createObjectURL(docBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'documento_sep.docx'
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
      onDownloadPdf={handleDownloadPdf}
      onDownloadWord={handleDownloadWord}
      onRegenerate={handleRegenerate}
      isRegenerating={isRegenerating}
    />
  )
}
