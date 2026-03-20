import { createFileRoute, useParams } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DocumentoSEPTab } from '@/components/asignaturas/detalle/DocumentoSEPTab'
import { useSubject } from '@/data'
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

  const { data: asignatura } = useSubject(asignaturaId)
  const asignaturaFileBaseName = sanitizeFileBaseName(
    asignatura?.nombre ?? 'documento_sep',
  )

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const pdfUrlRef = useRef<string | null>(null)
  const isMountedRef = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const loadPdfPreview = useCallback(async () => {
    try {
      if (isMountedRef.current) setIsLoading(true)

      const pdfBlob = await fetchAsignaturaPdf({
        asignatura_id: asignaturaId,
        convertTo: 'pdf',
      })

      if (!isMountedRef.current) return

      const url = window.URL.createObjectURL(pdfBlob)

      if (pdfUrlRef.current) window.URL.revokeObjectURL(pdfUrlRef.current)
      pdfUrlRef.current = url
      setPdfUrl(url)
    } catch (error) {
      console.error('Error cargando PDF:', error)
    } finally {
      if (isMountedRef.current) setIsLoading(false)
    }
  }, [asignaturaId])

  useEffect(() => {
    isMountedRef.current = true
    loadPdfPreview()

    return () => {
      isMountedRef.current = false
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
    link.download = `${asignaturaFileBaseName}.pdf`
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
    link.download = `${asignaturaFileBaseName}.docx`
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

function sanitizeFileBaseName(input: string): string {
  const text = String(input)
  const withoutControlChars = Array.from(text)
    .filter((ch) => {
      const code = ch.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join('')

  const cleaned = withoutControlChars
    .replace(/[<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')

  return (cleaned || 'documento').slice(0, 150)
}
