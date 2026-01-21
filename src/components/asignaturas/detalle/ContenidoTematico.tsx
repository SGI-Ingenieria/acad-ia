import { useEffect, useState } from 'react'
import {
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Clock,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
//import { toast } from 'sonner';

export interface Tema {
  id: string
  nombre: string
  descripcion?: string
  horasEstimadas?: number
}

export interface UnidadTematica {
  id: string
  nombre: string
  numero: number
  temas: Tema[]
}

const initialData: UnidadTematica[] = [
  {
    id: 'u1',
    numero: 1,
    nombre: 'Fundamentos de Inteligencia Artificial',
    temas: [
      { id: 't1', nombre: 'Tipos de IA y aplicaciones', horasEstimadas: 6 },
      { id: 't2', nombre: 'Ética en IA', horasEstimadas: 3 },
    ],
  },
]

// Estructura que viene de tu JSON/API
interface ContenidoApi {
  unidad: number
  titulo: string
  temas: string[] | any[] // Acepta strings o objetos
  [key: string]: any // Esta línea permite que haya más claves desconocidas
}

// Props del componente
interface ContenidoTematicoProps {
  data: {
    contenido_tematico: ContenidoApi[]
  }
  isLoading: boolean
}
export function ContenidoTematico({ data, isLoading }: ContenidoTematicoProps) {
  const [unidades, setUnidades] = useState<UnidadTematica[]>([])
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    new Set(['u1']),
  )
  const [deleteDialog, setDeleteDialog] = useState<{
    type: 'unidad' | 'tema'
    id: string
    parentId?: string
  } | null>(null)
  const [editingUnit, setEditingUnit] = useState<string | null>(null)
  const [editingTema, setEditingTema] = useState<{
    unitId: string
    temaId: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (data?.contenido_tematico) {
      const transformed = data.contenido_tematico.map(
        (u: any, idx: number) => ({
          id: `u-${idx}`,
          numero: u.unidad || idx + 1,
          nombre: u.titulo || 'Sin título',
          temas: Array.isArray(u.temas)
            ? u.temas.map((t: any, tidx: number) => ({
                id: `t-${idx}-${tidx}`,
                nombre: typeof t === 'string' ? t : t.nombre || 'Tema',
                horasEstimadas: t.horasEstimadas || 0,
              }))
            : [],
        }),
      )
      setUnidades(transformed)

      // Expandir la primera unidad automáticamente
      if (transformed.length > 0) {
        setExpandedUnits(new Set([transformed[0].id]))
      }
    }
  }, [data])

  if (isLoading)
    return <div className="p-10 text-center">Cargando contenido...</div>

  // 3. Cálculo de horas (ahora dinámico basado en los nuevos datos)
  const totalHoras = unidades.reduce(
    (acc, u) =>
      acc + u.temas.reduce((sum, t) => sum + (t.horasEstimadas || 0), 0),
    0,
  )

  // --- Lógica de Unidades ---
  const toggleUnit = (id: string) => {
    const newExpanded = new Set(expandedUnits)
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id)
    setExpandedUnits(newExpanded)
  }

  const addUnidad = () => {
    const newId = `u-${Date.now()}`
    const newUnidad: UnidadTematica = {
      id: newId,
      nombre: 'Nueva Unidad',
      numero: unidades.length + 1,
      temas: [],
    }
    setUnidades([...unidades, newUnidad])
    setExpandedUnits(new Set([...expandedUnits, newId]))
    setEditingUnit(newId)
  }

  const updateUnidadNombre = (id: string, nombre: string) => {
    setUnidades(unidades.map((u) => (u.id === id ? { ...u, nombre } : u)))
  }

  // --- Lógica de Temas ---
  const addTema = (unidadId: string) => {
    setUnidades(
      unidades.map((u) => {
        if (u.id === unidadId) {
          const newTemaId = `t-${Date.now()}`
          const newTema: Tema = {
            id: newTemaId,
            nombre: 'Nuevo tema',
            horasEstimadas: 2,
          }
          setEditingTema({ unitId: unidadId, temaId: newTemaId })
          return { ...u, temas: [...u.temas, newTema] }
        }
        return u
      }),
    )
  }

  const updateTema = (
    unidadId: string,
    temaId: string,
    updates: Partial<Tema>,
  ) => {
    setUnidades(
      unidades.map((u) => {
        if (u.id === unidadId) {
          return {
            ...u,
            temas: u.temas.map((t) =>
              t.id === temaId ? { ...t, ...updates } : t,
            ),
          }
        }
        return u
      }),
    )
  }

  const handleDelete = () => {
    if (!deleteDialog) return
    if (deleteDialog.type === 'unidad') {
      setUnidades(
        unidades
          .filter((u) => u.id !== deleteDialog.id)
          .map((u, i) => ({ ...u, numero: i + 1 })),
      )
    } else if (deleteDialog.parentId) {
      setUnidades(
        unidades.map((u) =>
          u.id === deleteDialog.parentId
            ? { ...u, temas: u.temas.filter((t) => t.id !== deleteDialog.id) }
            : u,
        ),
      )
    }
    setDeleteDialog(null)
    //toast.success("Eliminado correctamente");
  }

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-6 py-10 duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Contenido Temático
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {unidades.length} unidades • {totalHoras} horas estimadas totales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addUnidad} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva unidad
          </Button>
          <Button
            onClick={() => {
              setIsSaving(true)
              setTimeout(() => {
                setIsSaving(false) /*toast.success("Guardado")*/
              }, 1000)
            }}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />{' '}
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {unidades.map((unidad) => (
          <Card
            key={unidad.id}
            className="overflow-hidden border-slate-200 shadow-sm"
          >
            <Collapsible
              open={expandedUnits.has(unidad.id)}
              onOpenChange={() => toggleUnit(unidad.id)}
            >
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      {expandedUnits.has(unidad.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <Badge className="bg-blue-600 font-mono">
                    Unidad {unidad.numero}
                  </Badge>

                  {editingUnit === unidad.id ? (
                    <Input
                      value={unidad.nombre}
                      onChange={(e) =>
                        updateUnidadNombre(unidad.id, e.target.value)
                      }
                      onBlur={() => setEditingUnit(null)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && setEditingUnit(null)
                      }
                      className="h-8 max-w-md bg-white"
                      autoFocus
                    />
                  ) : (
                    <CardTitle
                      className="cursor-pointer text-base font-semibold transition-colors hover:text-blue-600"
                      onClick={() => setEditingUnit(unidad.id)}
                    >
                      {unidad.nombre}
                    </CardTitle>
                  )}

                  <div className="ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                      <Clock className="h-3 w-3" />{' '}
                      {unidad.temas.reduce(
                        (sum, t) => sum + (t.horasEstimadas || 0),
                        0,
                      )}
                      h
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() =>
                        setDeleteDialog({ type: 'unidad', id: unidad.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="bg-white pt-4">
                  <div className="ml-10 space-y-1 border-l-2 border-slate-50 pl-4">
                    {unidad.temas.map((tema, idx) => (
                      <TemaRow
                        key={tema.id}
                        tema={tema}
                        index={idx + 1}
                        isEditing={
                          editingTema?.unitId === unidad.id &&
                          editingTema?.temaId === tema.id
                        }
                        onEdit={() =>
                          setEditingTema({ unitId: unidad.id, temaId: tema.id })
                        }
                        onStopEditing={() => setEditingTema(null)}
                        onUpdate={(updates) =>
                          updateTema(unidad.id, tema.id, updates)
                        }
                        onDelete={() =>
                          setDeleteDialog({
                            type: 'tema',
                            id: tema.id,
                            parentId: unidad.id,
                          })
                        }
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full justify-start text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => addTema(unidad.id)}
                    >
                      <Plus className="mr-2 h-3 w-3" /> Añadir subtema
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      <DeleteConfirmDialog
        dialog={deleteDialog}
        setDialog={setDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// --- Componentes Auxiliares ---
interface TemaRowProps {
  tema: Tema
  index: number
  isEditing: boolean
  onEdit: () => void
  onStopEditing: () => void
  onUpdate: (updates: Partial<Tema>) => void
  onDelete: () => void
}

function TemaRow({
  tema,
  index,
  isEditing,
  onEdit,
  onStopEditing,
  onUpdate,
  onDelete,
}: TemaRowProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-md p-2 transition-all',
        isEditing ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-slate-50',
      )}
    >
      <span className="w-4 font-mono text-xs text-slate-400">{index}.</span>
      {isEditing ? (
        <div className="animate-in slide-in-from-left-2 flex flex-1 items-center gap-2">
          <Input
            value={tema.nombre}
            onChange={(e) => onUpdate({ nombre: e.target.value })}
            className="h-8 flex-1 bg-white"
            placeholder="Nombre"
            autoFocus
          />
          <Input
            type="number"
            value={tema.horasEstimadas}
            onChange={(e) =>
              onUpdate({ horasEstimadas: parseInt(e.target.value) || 0 })
            }
            className="h-8 w-16 bg-white"
          />
          <Button
            size="sm"
            className="h-8 bg-emerald-600"
            onClick={onStopEditing}
          >
            Listo
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 cursor-pointer" onClick={onEdit}>
            <p className="text-sm font-medium text-slate-700">{tema.nombre}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] opacity-60">
            {tema.horasEstimadas}h
          </Badge>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-blue-600"
              onClick={onEdit}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-red-500"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

interface DeleteDialogState {
  type: 'unidad' | 'tema'
  id: string
  parentId?: string
}

interface DeleteConfirmDialogProps {
  dialog: DeleteDialogState | null
  setDialog: (value: DeleteDialogState | null) => void
  onConfirm: () => void
}

function DeleteConfirmDialog({
  dialog,
  setDialog,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={!!dialog} onOpenChange={() => setDialog(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de borrar un {dialog?.type}. Esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
