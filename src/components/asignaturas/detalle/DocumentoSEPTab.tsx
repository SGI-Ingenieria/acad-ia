import {
  FileText,
  Download,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'

import type {
  DocumentoAsignatura,
  Asignatura,
  AsignaturaStructure,
} from '@/types/asignatura'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
// import { toast } from 'sonner';
// import { format } from 'date-fns';
// import { es } from 'date-fns/locale';

interface DocumentoSEPTabProps {
  documento: DocumentoAsignatura | null
  asignatura: Asignatura
  estructura: AsignaturaStructure
  datosGenerales: Record<string, any>
  onRegenerate: () => void
  isRegenerating: boolean
}

export function DocumentoSEPTab({
  documento,
  asignatura,
  datosGenerales,
  estructura,
  onRegenerate,
  isRegenerating,
}: DocumentoSEPTabProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Check completeness
  const camposObligatorios = estructura.campos.filter((c) => c.obligatorio)
  const camposCompletos = camposObligatorios.filter((c) =>
    datosGenerales[c.id]?.trim(),
  )
  const completeness = Math.round(
    (camposCompletos.length / camposObligatorios.length) * 100,
  )
  const isComplete = completeness === 100

  const handleRegenerate = () => {
    setShowConfirmDialog(false)
    onRegenerate()
    // toast.success('Regenerando documento...');
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-foreground flex items-center gap-2 text-2xl font-semibold">
            <FileCheck className="text-accent h-6 w-6" />
            Documento SEP
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Previsualización del documento oficial para la SEP
          </p>
        </div>
        <div className="flex items-center gap-2">
          {documento?.estado === 'listo' && (
            <Button
              variant="outline"
              onClick={
                () =>
                  console.log(
                    'descargando',
                  ) /* toast.info('Descarga iniciada')*/
              }
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          )}
          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
          >
            <AlertDialogTrigger asChild>
              <Button disabled={isRegenerating || !isComplete}>
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
                  Se creará una nueva versión del documento con los datos
                  actuales de la asignatura. La versión anterior quedará en el
                  historial.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Document preview */}
        <div className="lg:col-span-2">
          <Card className="card-elevated h-[700px] overflow-hidden">
            {documento?.estado === 'listo' ? (
              <div className="bg-muted/30 flex h-full flex-col">
                {/* Simulated document header */}
                <div className="bg-card border-b p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="text-primary h-5 w-5" />
                      <span className="text-foreground font-medium">
                        Programa de Estudios - {asignatura.clave}
                      </span>
                    </div>
                    <Badge variant="outline">Versión {documento.version}</Badge>
                  </div>
                </div>

                {/* Document content simulation */}
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="bg-card mx-auto max-w-2xl space-y-6 rounded-lg p-8 shadow-lg">
                    {/* Header */}
                    <div className="border-b pb-6 text-center">
                      <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                        Secretaría de Educación Pública
                      </p>
                      <h1 className="font-display text-primary mb-1 text-2xl font-bold">
                        {asignatura.nombre}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Clave: {asignatura.clave} | Créditos:{' '}
                        {asignatura.creditos || 'N/A'}
                      </p>
                    </div>

                    {/* Datos de la institución */}
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Carrera:</strong> {asignatura.carrera}
                      </p>
                      <p>
                        <strong>Facultad:</strong> {asignatura.facultad}
                      </p>
                      <p>
                        <strong>Plan de estudios:</strong>{' '}
                        {asignatura.planNombre}
                      </p>
                      {asignatura.ciclo && (
                        <p>
                          <strong>Ciclo:</strong> {asignatura.ciclo}
                        </p>
                      )}
                    </div>

                    {/* Campos del documento */}
                    {estructura.campos.map((campo) => {
                      const valor = datosGenerales[campo.id]
                      if (!valor) return null
                      return (
                        <div key={campo.id} className="space-y-2">
                          <h3 className="text-foreground border-b pb-1 font-semibold">
                            {campo.nombre}
                          </h3>
                          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {valor}
                          </p>
                        </div>
                      )
                    })}

                    {/* Footer */}
                    <div className="text-muted-foreground mt-8 border-t pt-6 text-center text-xs">
                      <p>
                        Documento generado el{' '}
                        {/* format(documento.fechaGeneracion, "d 'de' MMMM 'de' yyyy", { locale: es })*/}
                      </p>
                      <p className="mt-1">Universidad La Salle</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : documento?.estado === 'generando' ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="text-accent mx-auto mb-4 h-12 w-12 animate-spin" />
                  <p className="text-muted-foreground">
                    Generando documento...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <FileText className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    No hay documento generado aún
                  </p>
                  {!isComplete && (
                    <div className="bg-warning/10 text-warning-foreground rounded-lg p-4 text-sm">
                      <AlertTriangle className="mr-2 inline h-4 w-4" />
                      Completa todos los campos obligatorios para generar el
                      documento
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Estado del documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {documento && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Versión
                    </span>
                    <Badge variant="outline">{documento.version}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Generado
                    </span>
                    <span className="text-sm">
                      {/* format(documento.fechaGeneracion, "d MMM yyyy, HH:mm", { locale: es })*/}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Estado
                    </span>
                    <Badge
                      className={cn(
                        documento.estado === 'listo' &&
                          'bg-success text-success-foreground',
                        documento.estado === 'generando' &&
                          'bg-info text-info-foreground',
                        documento.estado === 'error' &&
                          'bg-destructive text-destructive-foreground',
                      )}
                    >
                      {documento.estado === 'listo' && 'Listo'}
                      {documento.estado === 'generando' && 'Generando'}
                      {documento.estado === 'error' && 'Error'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Completeness */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Completitud de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Campos obligatorios
                  </span>
                  <span className="font-medium">
                    {camposCompletos.length}/{camposObligatorios.length}
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      completeness === 100 ? 'bg-success' : 'bg-accent',
                    )}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p
                  className={cn(
                    'text-xs',
                    completeness === 100
                      ? 'text-success'
                      : 'text-muted-foreground',
                  )}
                >
                  {completeness === 100
                    ? 'Todos los campos obligatorios están completos'
                    : `Faltan ${camposObligatorios.length - camposCompletos.length} campos por completar`}
                </p>
              </div>

              {/* Missing fields */}
              {!isComplete && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium">
                    Campos faltantes:
                  </p>
                  {camposObligatorios
                    .filter((c) => !datosGenerales[c.id]?.trim())
                    .map((campo) => (
                      <div
                        key={campo.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <AlertTriangle className="text-warning h-3 w-3" />
                        <span className="text-foreground">{campo.nombre}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Requisitos SEP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full',
                      datosGenerales['objetivo_general']
                        ? 'bg-success/20'
                        : 'bg-muted',
                    )}
                  >
                    {datosGenerales['objetivo_general'] && (
                      <Check className="text-success h-3 w-3" />
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    Objetivo general definido
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full',
                      datosGenerales['competencias']
                        ? 'bg-success/20'
                        : 'bg-muted',
                    )}
                  >
                    {datosGenerales['competencias'] && (
                      <Check className="text-success h-3 w-3" />
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    Competencias especificadas
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div
                    className={cn(
                      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full',
                      datosGenerales['evaluacion']
                        ? 'bg-success/20'
                        : 'bg-muted',
                    )}
                  >
                    {datosGenerales['evaluacion'] && (
                      <Check className="text-success h-3 w-3" />
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    Criterios de evaluación
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
