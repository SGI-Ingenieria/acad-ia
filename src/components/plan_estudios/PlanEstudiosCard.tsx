import { ArrowRight, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils' // Asegúrate de tener tu utilidad cn

interface PlanEstudiosCardProps {
  /** El componente del ícono importado de lucide-react (ej. BookOpen) */
  Icono: LucideIcon
  nombrePrograma: string
  nivel: string
  ciclos: string | number // Acepta "8" o "8 semestres"
  facultad: string
  estado: string
  /** Código hex o variable CSS (ej. "#ef4444" o "var(--primary)") */
  claseColorEstado?: string
  colorFacultad: string
  /** Opcional: para manejar el click en la tarjeta */
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
        'group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden border-l-4 transition-all hover:shadow-lg',
      )}
      // Aplicamos el color de la facultad dinámicamente al borde y un fondo muy sutil
      style={{
        borderLeftColor: colorFacultad,
        backgroundColor: `color-mix(in srgb, ${colorFacultad}, transparent 95%)`, // Truco CSS moderno para fondo tintado
      }}
    >
      <CardHeader className="pb-2">
        {/* Ícono con el color de la facultad */}
        <div
          className="mb-2 w-fit rounded-md p-2"
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

      <CardContent className="text-muted-foreground space-y-1 pb-4 text-sm">
        <p className="text-foreground font-medium">
          {nivel} • {ciclos}
        </p>
        <p>{facultad}</p>
      </CardContent>

      <CardFooter className="bg-background/50 flex items-center justify-between border-t px-6 py-3 backdrop-blur-sm">
        <Badge className={`text-sm font-semibold ${claseColorEstado}`}>
          {estado}
        </Badge>
        {/* <span className="text-foreground/80 text-sm font-semibold">
          {estado}
        </span> */}

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
