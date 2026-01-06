import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemaItem } from './TemaItem'

export function UnidadCard({
  numero,
  titulo,
  temas,
}: {
  numero: number
  titulo: string
  temas: {
    id: string
    titulo: string
    horas: number
  }[]
}) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Badge>Unidad {numero}</Badge>
          <h3 className="font-semibold">{titulo}</h3>
        </div>

        <div className="space-y-2">
          {temas.map((tema) => (
            <TemaItem key={tema.id} {...tema} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
