import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute('/planes2/$planId/flujo')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header Informativo (Opcional, si no viene del layout padre) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold italic">Flujo de Aprobación</h1>
          <p className="text-sm text-muted-foreground">Gestiona el proceso de revisión y aprobación del plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO IZQUIERDO: Timeline del Flujo */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Estado: Completado */}
          <div className="relative flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-green-100 p-1 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="w-px flex-1 bg-green-200 mt-2" />
            </div>
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-lg">Borrador</CardTitle>
                  <p className="text-xs text-muted-foreground">14 de enero de 2024</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Completado</Badge>
              </CardHeader>
              <CardContent className="text-sm border-t pt-3">
                <p className="font-semibold text-muted-foreground mb-2">Comentarios</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Documento inicial creado</li>
                  <li>Estructura base definida</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Estado: En Curso (Actual) */}
          <div className="relative flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-blue-100 p-1 text-blue-600 ring-2 ring-blue-500 ring-offset-2">
                <Clock className="h-6 w-6" />
              </div>
              <div className="w-px flex-1 bg-slate-200 mt-2" />
            </div>
            <Card className="flex-1 border-blue-500 bg-blue-50/10">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-lg text-blue-700">En Revisión</CardTitle>
                  <p className="text-xs text-muted-foreground">19 de febrero de 2024</p>
                </div>
                <Badge variant="default" className="bg-blue-500">En curso</Badge>
              </CardHeader>
              <CardContent className="text-sm border-t border-blue-100 pt-3">
                <p className="font-semibold text-muted-foreground mb-2">Comentarios</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Revisión de objetivo general pendiente</li>
                  <li>Mapa curricular aprobado preliminarmente</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Estado: Pendiente */}
          <div className="relative flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-slate-100 p-1 text-slate-400">
                <Circle className="h-6 w-6" />
              </div>
            </div>
            <Card className="flex-1 opacity-60 grayscale-[0.5]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-lg">Revisión Expertos</CardTitle>
                <Badge variant="outline">Pendiente</Badge>
              </CardHeader>
            </Card>
          </div>

        </div>

        {/* LADO DERECHO: Formulario de Transición */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Transición de Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Estado actual</p>
                  <p className="font-bold">En Revisión</p>
                </div>
                <div className="h-px flex-1 bg-slate-300 mx-4" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Siguiente</p>
                  <p className="font-bold text-primary">Revisión Expertos</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comentario de transición</label>
                <Textarea 
                  placeholder="Agrega un comentario para la transición..." 
                  className="min-h-[120px]"
                />
              </div>

              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Avanzar a Revisión Expertos
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}