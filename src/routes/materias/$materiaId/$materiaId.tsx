import { createFileRoute, Link } from '@tanstack/react-router'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Sparkles,
  FileText,
  History,
} from 'lucide-react'

export const Route = createFileRoute('/materias/$materiaId/$materiaId')({
  component: MateriaDetailPage,
})

function MateriaDetailPage() {
  const { materiaId } = Route.useParams()

  return (
    <div className="w-full">
      {/* ================= HEADER ================= */}
      <section className="bg-gradient-to-b from-[#0b1d3a] to-[#0e2a5c] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Link
            to="/materias"
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al plan
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge className="bg-blue-900/50 border border-blue-700">
                IA-401
              </Badge>

              <h1 className="text-3xl font-bold">
                Inteligencia Artificial Aplicada
              </h1>

              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  Ingeniería en Sistemas Computacionales
                </span>

                <span>Facultad de Ingeniería</span>
              </div>

              <p className="text-sm text-blue-300">
                Pertenece al plan:{' '}
                <span className="underline cursor-pointer">
                  Licenciatura en Ingeniería en Sistemas Computacionales 2024
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <Badge variant="secondary">8 créditos</Badge>
              <Badge variant="secondary">7° semestre</Badge>
              <Badge variant="secondary">Sistemas Inteligentes</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TABS ================= */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <Tabs defaultValue="datos">
            <TabsList className="h-auto bg-transparent p-0 gap-6">
              <TabsTrigger value="datos">Datos generales</TabsTrigger>
              <TabsTrigger value="contenido">Contenido temático</TabsTrigger>
              <TabsTrigger value="bibliografia">Bibliografía</TabsTrigger>
              <TabsTrigger value="ia">IA de la materia</TabsTrigger>
              <TabsTrigger value="sep">Documento SEP</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            <Separator className="mt-2" />

            {/* ================= TAB: DATOS GENERALES ================= */}
            <TabsContent value="datos">
              <DatosGenerales />
            </TabsContent>

            <TabsContent value="contenido">
              <EmptyTab title="Contenido temático" />
            </TabsContent>

            <TabsContent value="bibliografia">
              <EmptyTab title="Bibliografía" />
            </TabsContent>

            <TabsContent value="ia">
              <EmptyTab title="IA de la materia" />
            </TabsContent>

            <TabsContent value="sep">
              <EmptyTab title="Documento SEP" />
            </TabsContent>

            <TabsContent value="historial">
              <EmptyTab title="Historial" />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

/* ================= TAB CONTENT ================= */

function DatosGenerales() {
  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <HeaderTab />

      <InfoCard
        title="Objetivo General"
        content="Formar profesionales capaces de diseñar, implementar y evaluar sistemas de inteligencia artificial que resuelvan problemas complejos del mundo real."
      />

      <InfoCard
        title="Competencias a Desarrollar"
        content={
          <ul className="list-disc list-inside space-y-1">
            <li>Diseñar algoritmos de machine learning</li>
            <li>Implementar redes neuronales profundas</li>
            <li>Evaluar modelos de IA considerando métricas</li>
            <li>Aplicar principios éticos en sistemas inteligentes</li>
          </ul>
        }
      />

      <InfoCard
        title="Justificación"
        content="La inteligencia artificial es una de las tecnologías más disruptivas del siglo XXI..."
      />

      <InfoCard
        title="Requisitos y Seriación"
        content="Programación Avanzada (PA-301), Matemáticas Discretas (MAT-201)"
      />

      <InfoCard
        title="Estrategias Didácticas"
        content={
          <ul className="list-disc list-inside space-y-1">
            <li>Aprendizaje basado en proyectos</li>
            <li>Talleres prácticos con datasets reales</li>
            <li>Estudios de caso</li>
          </ul>
        }
      />

      <InfoCard
        title="Sistema de Evaluación"
        content={
          <ul className="list-disc list-inside space-y-1">
            <li>Exámenes parciales: 30%</li>
            <li>Proyecto integrador: 35%</li>
            <li>Prácticas de laboratorio: 20%</li>
            <li>Participación: 15%</li>
          </ul>
        }
      />

      <InfoCard
        title="Perfil del Docente"
        content="Profesional con maestría o doctorado en áreas afines a IA, con experiencia mínima de 3 años."
      />
    </div>
  )
}

function HeaderTab() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">Datos Generales</h2>
        <p className="text-sm text-muted-foreground">
          Información basada en la plantilla SEP Licenciatura
        </p>
      </div>

      <Button size="sm">Guardar todo</Button>
    </div>
  )
}

function InfoCard({
  title,
  content,
}: {
  title: string
  content: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          <Badge variant="outline">Obligatorio</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground">
        {content}
      </CardContent>
    </Card>
  )
}

function EmptyTab({ title }: { title: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      {title} (pendiente)
    </div>
  )
}
