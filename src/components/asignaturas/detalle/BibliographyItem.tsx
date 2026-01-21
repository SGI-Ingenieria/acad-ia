import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Library,
  Edit3,
  Save,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useSubjectBibliografia } from '@/data/hooks/useSubjects'
//import { toast } from 'sonner';
//import { mockLibraryResources } from '@/data/mockMateriaData';

export const mockLibraryResources = [
  {
    id: 'lib-1',
    titulo: 'Deep Learning',
    autor: 'Goodfellow, I., Bengio, Y., & Courville, A.',
    editorial: 'MIT Press',
    anio: 2016,
    isbn: '9780262035613',
    disponible: true,
  },
  {
    id: 'lib-2',
    titulo: 'Artificial Intelligence: A Modern Approach',
    autor: 'Russell, S., & Norvig, P.',
    editorial: 'Pearson',
    anio: 2020,
    isbn: '9780134610993',
    disponible: true,
  },
  {
    id: 'lib-3',
    titulo: 'Hands-On Machine Learning',
    autor: 'Aurélien Géron',
    editorial: "O'Reilly Media",
    anio: 2019,
    isbn: '9781492032649',
    disponible: false,
  },
]

// --- Interfaces ---
export interface BibliografiaEntry {
  id: string
  tipo: 'BASICA' | 'COMPLEMENTARIA'
  cita: string
  tipo_fuente?: 'MANUAL' | 'BIBLIOTECA'
  biblioteca_item_id?: string | null
  fuenteBibliotecaId?: string
  fuenteBiblioteca?: any
}

interface BibliografiaTabProps {
  bibliografia: BibliografiaEntry[]
  onSave: (bibliografia: BibliografiaEntry[]) => void
  isSaving: boolean
}

export function BibliographyItem({
  bibliografia,
  onSave,
  isSaving,
}: BibliografiaTabProps) {
  const { data: bibliografia2, isLoading: loadinmateria } =
    useSubjectBibliografia('9d4dda6a-488f-428a-8a07-38081592a641')
  const [entries, setEntries] = useState<BibliografiaEntry[]>(bibliografia)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLibraryDialogOpen, setIsLibraryDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newEntryType, setNewEntryType] = useState<'BASICA' | 'COMPLEMENTARIA'>(
    'BASICA',
  )

  useEffect(() => {
    if (bibliografia2 && Array.isArray(bibliografia2)) {
      setEntries(bibliografia2)
    } else if (bibliografia) {
      // Fallback a la prop inicial si la API no devuelve nada
      setEntries(bibliografia)
    }
  }, [bibliografia2, bibliografia])

  const basicaEntries = entries.filter((e) => e.tipo === 'BASICA')
  const complementariaEntries = entries.filter(
    (e) => e.tipo === 'COMPLEMENTARIA',
  )
  console.log(bibliografia2)

  const handleAddManual = (cita: string) => {
    const newEntry: BibliografiaEntry = {
      id: `manual-${Date.now()}`,
      tipo: newEntryType,
      cita,
    }
    setEntries([...entries, newEntry])
    setIsAddDialogOpen(false)
    //toast.success('Referencia manual añadida');
  }

  const handleAddFromLibrary = (
    resource: any,
    tipo: 'BASICA' | 'COMPLEMENTARIA',
  ) => {
    const cita = `${resource.autor} (${resource.anio}). ${resource.titulo}. ${resource.editorial}.`
    const newEntry: BibliografiaEntry = {
      id: `lib-ref-${Date.now()}`,
      tipo,
      cita,
      fuenteBibliotecaId: resource.id,
      fuenteBiblioteca: resource,
    }
    setEntries([...entries, newEntry])
    setIsLibraryDialogOpen(false)
    //toast.success('Añadido desde biblioteca');
  }

  const handleUpdateCita = (id: string, cita: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, cita } : e)))
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 py-10 duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Bibliografía
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {basicaEntries.length} básica • {complementariaEntries.length}{' '}
            complementaria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={isLibraryDialogOpen}
            onOpenChange={setIsLibraryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Library className="mr-2 h-4 w-4" /> Buscar en biblioteca
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <LibrarySearchDialog
                onSelect={handleAddFromLibrary}
                existingIds={entries.map((e) => e.fuenteBibliotecaId || '')}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Añadir manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddManualDialog
                tipo={newEntryType}
                onTypeChange={setNewEntryType}
                onAdd={handleAddManual}
              />
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => onSave(entries)}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />{' '}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        {/* BASICA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-blue-600" />
            <h3 className="font-semibold text-slate-800">
              Bibliografía Básica
            </h3>
          </div>
          <div className="grid gap-3">
            {basicaEntries.map((entry) => (
              <BibliografiaCard
                key={entry.id}
                entry={entry}
                isEditing={editingId === entry.id}
                onEdit={() => setEditingId(entry.id)}
                onStopEditing={() => setEditingId(null)}
                onUpdateCita={handleUpdateCita}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        </section>

        {/* COMPLEMENTARIA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-slate-400" />
            <h3 className="font-semibold text-slate-800">
              Bibliografía Complementaria
            </h3>
          </div>
          <div className="grid gap-3">
            {complementariaEntries.map((entry) => (
              <BibliografiaCard
                key={entry.id}
                entry={entry}
                isEditing={editingId === entry.id}
                onEdit={() => setEditingId(entry.id)}
                onStopEditing={() => setEditingId(null)}
                onUpdateCita={handleUpdateCita}
                onDelete={() => setDeleteId(entry.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar referencia?</AlertDialogTitle>
            <AlertDialogDescription>
              La referencia será quitada del plan de estudios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEntries(entries.filter((e) => e.id !== deleteId))
                setDeleteId(null)
              }}
              className="bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- Subcomponentes ---

function BibliografiaCard({
  entry,
  isEditing,
  onEdit,
  onStopEditing,
  onUpdateCita,
  onDelete,
}: any) {
  const [localCita, setLocalCita] = useState(entry.cita)

  return (
    <Card
      className={cn(
        'group transition-all hover:shadow-md',
        isEditing && 'ring-2 ring-blue-500',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <BookOpen
            className={cn(
              'mt-1 h-5 w-5',
              entry.tipo === 'BASICA' ? 'text-blue-600' : 'text-slate-400',
            )}
          />
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={localCita}
                  onChange={(e) => setLocalCita(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={onStopEditing}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600"
                    onClick={() => {
                      onUpdateCita(entry.id, localCita)
                      onStopEditing()
                    }}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div onClick={onEdit} className="cursor-pointer">
                <p className="text-sm leading-relaxed text-slate-700">
                  {entry.cita}
                </p>
                {entry.fuenteBiblioteca && (
                  <div className="mt-2 flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-[10px] text-slate-600"
                    >
                      Biblioteca
                    </Badge>
                    {entry.fuenteBiblioteca.disponible && (
                      <Badge className="border-emerald-100 bg-emerald-50 text-[10px] text-emerald-700">
                        Disponible
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {!isEditing && (
            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                onClick={onEdit}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-500"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AddManualDialog({ tipo, onTypeChange, onAdd }: any) {
  const [cita, setCita] = useState('')
  return (
    <div className="space-y-4 py-4">
      <DialogHeader>
        <DialogTitle>Referencia Manual</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Tipo
        </label>
        <Select value={tipo} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASICA">Básica</SelectItem>
            <SelectItem value="COMPLEMENTARIA">Complementaria</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase">
          Cita APA
        </label>
        <Textarea
          value={cita}
          onChange={(e) => setCita(e.target.value)}
          placeholder="Autor, A. (Año). Título..."
          className="min-h-[120px]"
        />
      </div>
      <Button
        onClick={() => onAdd(cita)}
        disabled={!cita.trim()}
        className="w-full bg-blue-600"
      >
        Añadir a la lista
      </Button>
    </div>
  )
}

function LibrarySearchDialog({ onSelect, existingIds }: any) {
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState<'BASICA' | 'COMPLEMENTARIA'>('BASICA')
  const filtered = mockLibraryResources.filter(
    (r) =>
      !existingIds.includes(r.id) &&
      r.titulo.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4 py-2">
      <DialogHeader>
        <DialogTitle>Catálogo de Biblioteca</DialogTitle>
      </DialogHeader>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className="pl-10"
          />
        </div>
        <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASICA">Básica</SelectItem>
            <SelectItem value="COMPLEMENTARIA">Complem.</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
        {filtered.map((res) => (
          <div
            key={res.id}
            onClick={() => onSelect(res, tipo)}
            className="group flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {res.titulo}
              </p>
              <p className="text-xs text-slate-500">{res.autor}</p>
            </div>
            <Plus className="h-4 w-4 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
