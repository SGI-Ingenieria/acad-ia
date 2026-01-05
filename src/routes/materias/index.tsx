import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Sparkles,
  FileText,
  Library,
  LayoutTemplate,
  History,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'

export const Route = createFileRoute('/materias/')({
  component: MateriasLandingPage,
})

function MateriasLandingPage() {
  return (
    <div className="w-full">
      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="max-w-7xl mx-auto px-6 py-28">
          <div className="flex items-center gap-2 mb-6 text-sm text-blue-200">
            <GraduationCap className="w-5 h-5 text-yellow-400" />
            <span>SISTEMA DE GESTIÓN CURRICULAR</span>
          </div>

          <h1 className="text-5xl font-bold mb-6">
            Universidad La Salle
          </h1>

          <p className="max-w-xl text-lg text-blue-100 mb-10">
            Diseña, documenta y mejora programas de estudio con herramientas
            de inteligencia artificial integradas y cumplimiento normativo SEP.
          </p>

          <Button
            size="lg"
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
          >
            Ver materia de ejemplo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-2xl font-semibold mb-14">
            Características principales
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<BookOpen />}
              title="Gestión de Materias"
              description="Edita datos generales, contenido temático y bibliografía con una interfaz intuitiva."
            />

            <FeatureCard
              icon={<Sparkles />}
              title="IA Integrada"
              description="Usa inteligencia artificial para mejorar objetivos, competencias y alinear con perfiles de egreso."
            />

            <FeatureCard
              icon={<FileText />}
              title="Documentos SEP"
              description="Genera automáticamente documentos oficiales para la Secretaría de Educación Pública."
            />

            <FeatureCard
              icon={<Library />}
              title="Biblioteca Digital"
              description="Busca y vincula recursos del repositorio de Biblioteca La Salle directamente."
            />

            <FeatureCard
              icon={<LayoutTemplate />}
              title="Plantillas Flexibles"
              description="Adapta la estructura de materias según plantillas SEP o institucionales."
            />

            <FeatureCard
              icon={<History />}
              title="Historial Completo"
              description="Rastrea todos los cambios con historial detallado por usuario y fecha."
            />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h3 className="text-xl font-semibold mb-4">
            Explora la vista de detalle de materia
          </h3>

          <p className="text-muted-foreground mb-8">
            Navega por las diferentes pestañas para ver cómo funciona el sistema
            de gestión curricular.
          </p>

          <Button size="lg" className="bg-[#0e2a5c] hover:bg-[#0b1d3a]">
            Ir a Inteligencia Artificial Aplicada
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}

/* ================= FEATURE CARD ================= */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="w-10 h-10 rounded-md bg-yellow-100 text-yellow-600 flex items-center justify-center">
          {icon}
        </div>

        <h4 className="font-semibold">{title}</h4>

        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
