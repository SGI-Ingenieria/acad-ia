import { createFileRoute, useParams } from '@tanstack/react-router'
import {
  FileText,
  Download,
  RefreshCcw,
  ExternalLink,
  CheckCircle2,
  Clock,
  FileJson,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchPlanPdf } from '@/data/api/document.api'

export const Route = createFileRoute('/planes/$planId/_detalle/documento')({
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = useParams({ from: '/planes/$planId/_detalle/documento' })
  const handleDownloadPdf = async () => {
    console.log('entre aqui ')

    try {
      const pdfBlob = await fetchPlanPdf({
        plan_estudio_id: planId,
      })

      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'plan_estudios.pdf'
      document.body.appendChild(link)
      link.click()

      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert('No se pudo generar el PDF')
    }
  }
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50/30 p-6">
      {/* HEADER DE ACCIONES */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Documento del Plan
          </h1>
          <p className="text-muted-foreground text-sm">
            Vista previa y descarga del documento oficial
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCcw size={16} /> Regenerar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} /> Descargar Word
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-teal-700 hover:bg-teal-800"
            onClick={handleDownloadPdf}
          >
            <Download size={16} /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* TARJETAS DE ESTADO */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          icon={<CheckCircle2 className="text-green-500" />}
          label="Estado"
          value="Generado"
        />
        <StatusCard
          icon={<Clock className="text-blue-500" />}
          label="Última generación"
          value="28 Ene 2024, 11:30"
        />
        <StatusCard
          icon={<FileJson className="text-orange-500" />}
          label="Versión"
          value="v1.2"
        />
      </div>

      {/* CONTENEDOR DEL DOCUMENTO (Visor) */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b bg-slate-100/50 p-2 px-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <FileText size={14} />
            Plan_Estudios_ISC_2024.pdf
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            Abrir en nueva pestaña <ExternalLink size={12} />
          </Button>
        </div>

        <CardContent className="flex min-h-[800px] justify-center bg-slate-200/50 p-0 py-8">
          {/* SIMULACIÓN DE HOJA DE PAPEL */}
          <div className="relative min-h-[1000px] w-full max-w-[800px] border bg-white p-12 shadow-2xl md:p-16">
            {/* Contenido del Plan */}
            <div className="mb-12 text-center">
              <p className="mb-1 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Universidad Tecnológica
              </p>
              <h2 className="text-2xl font-bold text-slate-800">
                Plan de Estudios 2024
              </h2>
              <h3 className="text-lg font-semibold text-teal-700">
                Ingeniería en Sistemas Computacionales
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Facultad de Ingeniería
              </p>
            </div>

            <div className="space-y-8 text-slate-700">
              <section>
                <h4 className="mb-2 text-sm font-bold">1. Objetivo General</h4>
                <p className="text-justify text-sm leading-relaxed">
                  Formar profesionales altamente capacitados en el desarrollo de
                  soluciones tecnológicas innovadoras, con sólidos conocimientos
                  en programación, bases de datos, redes y seguridad
                  informática.
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-bold">2. Perfil de Ingreso</h4>
                <p className="text-justify text-sm leading-relaxed">
                  Egresados de educación media superior con conocimientos
                  básicos de matemáticas, razonamiento lógico y habilidades de
                  comunicación. Interés por la tecnología y la resolución de
                  problemas.
                </p>
              </section>

              <section>
                <h4 className="mb-2 text-sm font-bold">3. Perfil de Egreso</h4>
                <p className="text-justify text-sm leading-relaxed">
                  Profesional capaz de diseñar, desarrollar e implementar
                  sistemas de software de calidad, administrar infraestructuras
                  de red y liderar proyectos tecnológicos multidisciplinarios.
                </p>
              </section>
            </div>

            {/* Marca de agua o decoración lateral (opcional) */}
            <div className="absolute top-0 left-0 h-full w-1 bg-slate-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente pequeño para las tarjetas de estado superior
function StatusCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="rounded-full border bg-slate-50 p-2">{icon}</div>
        <div>
          <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-700">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
