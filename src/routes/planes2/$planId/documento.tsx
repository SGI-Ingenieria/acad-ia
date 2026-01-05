import { createFileRoute } from '@tanstack/react-router'
import { 
  FileText, 
  Download, 
  RefreshCcw, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  FileJson 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const Route = createFileRoute('/planes2/$planId/documento')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50/30 min-h-screen">
      
      {/* HEADER DE ACCIONES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Documento del Plan</h1>
          <p className="text-sm text-muted-foreground">Vista previa y descarga del documento oficial</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCcw size={16} /> Regenerar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} /> Descargar Word
          </Button>
          <Button size="sm" className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Download size={16} /> Descargar PDF
          </Button>
        </div>
      </div>

      {/* TARJETAS DE ESTADO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-100/50 p-2 border-b flex justify-between items-center px-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <FileText size={14} />
            Plan_Estudios_ISC_2024.pdf
          </div>
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
            Abrir en nueva pestaña <ExternalLink size={12} />
          </Button>
        </div>
        
        <CardContent className="p-0 bg-slate-200/50 flex justify-center py-8 min-h-[800px]">
          {/* SIMULACIÓN DE HOJA DE PAPEL */}
          <div className="bg-white w-full max-w-[800px] shadow-2xl p-12 md:p-16 min-h-[1000px] border relative">
            
            {/* Contenido del Plan */}
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Universidad Tecnológica</p>
              <h2 className="text-2xl font-bold text-slate-800">Plan de Estudios 2024</h2>
              <h3 className="text-lg text-teal-700 font-semibold">Ingeniería en Sistemas Computacionales</h3>
              <p className="text-xs text-slate-500 mt-1">Facultad de Ingeniería</p>
            </div>

            <div className="space-y-8 text-slate-700">
              <section>
                <h4 className="font-bold text-sm mb-2">1. Objetivo General</h4>
                <p className="text-sm leading-relaxed text-justify">
                  Formar profesionales altamente capacitados en el desarrollo de soluciones tecnológicas innovadoras, con sólidos conocimientos en programación, bases de datos, redes y seguridad informática.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sm mb-2">2. Perfil de Ingreso</h4>
                <p className="text-sm leading-relaxed text-justify">
                  Egresados de educación media superior con conocimientos básicos de matemáticas, razonamiento lógico y habilidades de comunicación. Interés por la tecnología y la resolución de problemas.
                </p>
              </section>

              <section>
                <h4 className="font-bold text-sm mb-2">3. Perfil de Egreso</h4>
                <p className="text-sm leading-relaxed text-justify">
                  Profesional capaz de diseñar, desarrollar e implementar sistemas de software de calidad, administrar infraestructuras de red y liderar proyectos tecnológicos multidisciplinarios.
                </p>
              </section>
            </div>

            {/* Marca de agua o decoración lateral (opcional) */}
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente pequeño para las tarjetas de estado superior
function StatusCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 rounded-full bg-slate-50 border">
          {icon}
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">{label}</p>
          <p className="text-sm font-semibold text-slate-700">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}