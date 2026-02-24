import { FileCheck, Download, RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DocumentoSEPTabProps {
  pdfUrl: string | null
  isLoading: boolean
  onDownload: () => void
  onRegenerate: () => void
  isRegenerating: boolean
}

export function DocumentoSEPTab({
  pdfUrl,
  isLoading,
  onDownload,
  onRegenerate,
  isRegenerating,
}: DocumentoSEPTabProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleRegenerate = () => {
    setShowConfirmDialog(false)
    onRegenerate()
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-foreground flex items-center gap-2 text-2xl font-semibold">
            <FileCheck className="text-accent h-6 w-6" />
            Documento SEP
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Previsualización del documento oficial generado
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pdfUrl && !isLoading && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}

          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
          >
            <AlertDialogTrigger asChild>
              <Button disabled={isRegenerating}>
                {isRegenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isRegenerating ? 'Generando...' : 'Regenerar documento'}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Regenerar documento SEP?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se generará una nueva versión del documento con la información
                  actual.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerate}>
                  Regenerar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* PDF Preview */}
      <Card className="h-[800px] overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            className="h-full w-full border-none"
            title="Documento SEP"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            No se pudo cargar el documento.
          </div>
        )}
      </Card>
    </div>
  )
}
