import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  BookOpenText,
  Calculator,
  FlaskConical,
  Laptop,
  PencilRuler,
  Plus,
  Scale,
  Stethoscope,
} from 'lucide-react'

import PlanEstudiosCard from '@/components/planes/PlanEstudiosCard'

export const Route = createFileRoute('/planes')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="bg-background min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                <BookOpenText className="h-5 w-5" strokeWidth={2} />
              </div>

              <div>
                <h1 className="font-display text-foreground text-2xl font-bold">
                  Planes de Estudio
                </h1>
                <p className="text-muted-foreground text-sm">
                  Gestiona los planes curriculares de tu institución
                </p>
              </div>
            </div>

            <button
              type="button"
              className={
                'ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center gap-2 rounded-md px-8 text-sm font-medium whitespace-nowrap shadow-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0'
              }
              aria-label="Nuevo plan de estudios"
              title="Nuevo plan de estudios"
            >
              <Plus className="" />
              Nuevo plan de estudios
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <PlanEstudiosCard
              Icono={Laptop}
              nombrePrograma="Ingeniería en Sistemas Computacionales"
              nivel="Licenciatura"
              ciclos="8 semestres"
              facultad="Facultad de Ingeniería"
              estado="Revisión expertos"
              claseColorEstado="bg-amber-600"
              colorFacultad="#2563eb"
              onClick={() => console.log('Navegar a Sistemas...')}
            />

            <PlanEstudiosCard
              Icono={Stethoscope}
              nombrePrograma="Médico Cirujano"
              nivel="Licenciatura"
              ciclos="10 semestres"
              facultad="Facultad de Medicina"
              estado="Aprobado"
              claseColorEstado="bg-emerald-600"
              colorFacultad="#dc2626"
            />

            <PlanEstudiosCard
              Icono={Calculator}
              nombrePrograma="Licenciatura en Actuaría"
              nivel="Licenciatura"
              ciclos="9 semestres"
              facultad="Facultad de Negocios"
              estado="Aprobado"
              claseColorEstado="bg-emerald-600"
              colorFacultad="#059669"
              onClick={() => console.log('Ver Actuaría')}
            />

            <PlanEstudiosCard
              Icono={PencilRuler}
              nombrePrograma="Licenciatura en Arquitectura"
              nivel="Licenciatura"
              ciclos="10 semestres"
              facultad="Facultad Mexicana de Arquitectura, Diseño y Comunicación"
              estado="En proceso"
              claseColorEstado="bg-orange-500"
              colorFacultad="#ea580c"
              onClick={() => console.log('Ver Arquitectura')}
            />

            <PlanEstudiosCard
              Icono={Activity}
              nombrePrograma="Licenciatura en Fisioterapia"
              nivel="Licenciatura"
              ciclos="8 semestres"
              facultad="Escuela de Altos Estudios en Salud"
              estado="Revisión expertos"
              claseColorEstado="bg-amber-600"
              colorFacultad="#0891b2"
              onClick={() => console.log('Ver Fisioterapia')}
            />

            <PlanEstudiosCard
              Icono={Scale}
              nombrePrograma="Licenciatura en Derecho"
              nivel="Licenciatura"
              ciclos="10 semestres"
              facultad="Facultad de Derecho"
              estado="Pendiente"
              claseColorEstado="bg-yellow-500"
              colorFacultad="#7c3aed"
              onClick={() => console.log('Ver Derecho')}
            />

            <PlanEstudiosCard
              Icono={FlaskConical}
              nombrePrograma="Químico Farmacéutico Biólogo"
              nivel="Licenciatura"
              ciclos="9 semestres"
              facultad="Facultad de Ciencias Químicas"
              estado="Actualización"
              claseColorEstado="bg-lime-600"
              colorFacultad="#65a30d"
              onClick={() => console.log('Ver QFB')}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
