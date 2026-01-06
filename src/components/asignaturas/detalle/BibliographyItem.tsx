import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Pencil, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onSave: (value: string) => void
}

export function BibliographyItem({ value, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function handleCancel() {
    setDraft(value)
    setIsEditing(false)
  }

  function handleSave() {
    onSave(draft)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition',
        isEditing
          ? 'border-yellow-400 bg-yellow-50'
          : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-yellow-500 mt-1" />

        <div className="flex-1">
          {!isEditing ? (
            <>
              <p className="text-sm leading-relaxed">{value}</p>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </>
          ) : (
            <>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[90px]"
              />

              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>

                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSave}
                >
                  Guardar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
