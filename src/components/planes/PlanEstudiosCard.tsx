import { ArrowRight } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlanEstudiosCardProps {
  Icono: LucideIcon
  nombrePrograma: string
  nivel: string
  ciclos: string | number
  facultad: string
  estado: string
  claseColorEstado?: string
  colorFacultad: string
  onClick?: () => void
}

export default function PlanEstudiosCard({
  Icono,
  nombrePrograma,
  nivel,
  ciclos,
  facultad,
  estado,
  claseColorEstado = '',
  colorFacultad,
  onClick,
}: PlanEstudiosCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden transition-all hover:shadow-lg',
      )}
    >
      <div className="flex flex-grow flex-col">
        <CardHeader className="pb-2">
          {/* Círculo del ícono con el color de la facultad */}
          <div
            className="mb-2 w-fit rounded-full p-2.5"
            style={{
              backgroundColor: `color-mix(in srgb, ${colorFacultad}, transparent 85%)`,
            }}
          >
            <Icono size={24} style={{ color: colorFacultad }} />
          </div>

          {/* Título del Programa */}
          <h4 className="line-clamp-2 text-lg leading-tight font-bold tracking-tight">
            {nombrePrograma}
          </h4>
        </CardHeader>

        <CardContent className="text-muted-foreground space-y-1 text-sm">
          <p className="text-foreground font-medium">
            {nivel} • {ciclos}
          </p>
          <p>{facultad}</p>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-0 pb-6">
        <Badge className={cn('text-sm font-semibold', claseColorEstado)}>
          {estado}
        </Badge>

        {/* Flecha animada */}
        <div
          className="rounded-full p-1 transition-transform duration-300 group-hover:translate-x-1"
          style={{ color: colorFacultad }}
        >
          <ArrowRight size={20} />
        </div>
      </CardFooter>
    </Card>
  )
}
