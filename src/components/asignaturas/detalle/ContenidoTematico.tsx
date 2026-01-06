import { Button } from '@/components/ui/button'
import { UnidadCard } from './contenido-tematico/UnidadCard'


export function ContenidoTematico() {
  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contenido Temático</h2>
          <p className="text-sm text-muted-foreground">
            Unidades, temas y subtemas de la materia
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">Nueva unidad</Button>
          <Button>Guardar</Button>
        </div>
      </div>

      <UnidadCard
        numero={1}
        titulo="Fundamentos de Inteligencia Artificial"
        temas={[
          {
            id: 't1',
            titulo: 'Tipos de IA y aplicaciones',
            horas: 6,
          },
          {
            id: 't2',
            titulo: 'Ética en IA',
            horas: 3,
          },
        ]}
      />
    </div>
  )
}
