import { Pencil } from 'lucide-react'
import { EditTemaDialog } from './EditTemaDialog'

export function TemaItem({
  id,
  titulo,
  horas,
}: {
  id: string
  titulo: string
  horas: number
}) {
  return (
    <EditTemaDialog
      temaId={id}
      defaultValue={titulo}
      horas={horas}
    >
      <button className="w-full flex items-center justify-between rounded-md border px-4 py-2 text-left hover:bg-gray-50">
        <span>{titulo}</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{horas} hrs</span>
          <Pencil className="w-4 h-4" />
        </div>
      </button>
    </EditTemaDialog>
  )
}
