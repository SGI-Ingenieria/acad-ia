import { FileText, FolderOpen, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import BarraBusqueda from '../../BarraBusqueda'

import { FileDropzone } from './FileDropZone'

import type { UploadedFile } from './FileDropZone'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsContents,
} from '@/components/ui/motion-tabs'
import { supabaseBrowser } from '@/data'
import { REPOSITORIOS } from '@/features/planes/nuevo/catalogs'
import { formatFileSize } from '@/features/planes/utils/format-file-size'
import { cn } from '@/lib/utils'

type ArchivoConOpenAI = {
  id: string
  path: string
  size: number | null
  openai_file_id: string
  created_at: string | null
}

const getBasename = (path: string) => {
  const parts = path.split('/').filter(Boolean)
  return parts.length ? parts[parts.length - 1] : path
}

const stripUuidPrefixFromBasename = (basename: string) => {
  return basename.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
    '',
  )
}

const ReferenciasParaIA = ({
  selectedArchivoIds = [],
  selectedRepositorioIds = [],
  uploadedFiles = [],
  onToggleArchivo,
  onToggleRepositorio,
  onFilesChange,
  enableSha256Dedupe,
  onDedupePendingChange,
  enableAutoUpload,
  autoScrollToDropzone,
}: {
  selectedArchivoIds?: Array<string>
  selectedRepositorioIds?: Array<string>
  uploadedFiles?: Array<UploadedFile>
  onToggleArchivo?: (id: string, checked: boolean) => void
  onToggleRepositorio?: (id: string, checked: boolean) => void
  onFilesChange?: (files: Array<UploadedFile>) => void
  enableSha256Dedupe?: boolean
  onDedupePendingChange?: (pendingCount: number) => void
  enableAutoUpload?: boolean
  autoScrollToDropzone?: boolean
}) => {
  const [busquedaArchivos, setBusquedaArchivos] = useState('')
  const [busquedaRepositorios, setBusquedaRepositorios] = useState('')
  const [archivos, setArchivos] = useState<Array<ArchivoConOpenAI>>([])

  const cleanText = (text: string) => {
    return text
      .normalize('NFD') // Descompone "á" en "a" + "´"
      .replace(/[\u0300-\u036f]/g, '') // Elimina los símbolos diacríticos
      .toLowerCase() // Convierte a minúsculas
  }

  useEffect(() => {
    let isActive = true

    async function loadArchivos() {
      const supabase = supabaseBrowser()

      const { data, error } = await supabase
        .from('archivos')
        .select('id,path,size,openai_file_id,created_at')
        .not('openai_file_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!isActive) return

      if (error) {
        console.error('Error cargando archivos de referencia:', error)
        setArchivos([])
        return
      }

      const rows = (Array.isArray(data) ? data : [])
        .map((r) => {
          const rec = r as unknown as {
            id: string
            path: string
            size: number | null
            openai_file_id: string | null
            created_at: string | null
          }

          const openaiFileId = rec.openai_file_id
            ? String(rec.openai_file_id)
            : ''
          if (!openaiFileId) return null

          return {
            id: String(rec.id),
            path: String(rec.path),
            size: typeof rec.size === 'number' ? rec.size : null,
            openai_file_id: openaiFileId,
            created_at: rec.created_at ? String(rec.created_at) : null,
          } satisfies ArchivoConOpenAI
        })
        .filter((x): x is ArchivoConOpenAI => Boolean(x))

      setArchivos(rows)
    }

    void loadArchivos()

    return () => {
      isActive = false
    }
  }, [])

  // Filtrado de archivos y de repositorios
  const archivosFiltrados = useMemo(() => {
    // Función helper para limpiar texto (quita acentos y hace minúsculas)

    const term = cleanText(busquedaArchivos)
    return archivos.filter((archivo) => {
      const basename = stripUuidPrefixFromBasename(getBasename(archivo.path))
      return cleanText(basename).includes(term)
    })
  }, [archivos, busquedaArchivos])

  const repositoriosFiltrados = useMemo(() => {
    const term = cleanText(busquedaRepositorios)
    return REPOSITORIOS.filter((repositorio) =>
      cleanText(repositorio.nombre).includes(term),
    )
  }, [busquedaRepositorios])

  const tabs = [
    {
      name: 'Archivos existentes',

      value: 'archivos-existentes',

      icon: FileText,

      content: (
        <div className="flex flex-col">
          <BarraBusqueda
            value={busquedaArchivos}
            onChange={setBusquedaArchivos}
            placeholder="Buscar archivo existente..."
            className="m-1 mb-1.5"
          />
          <div className="flex h-96 flex-col gap-0.5 overflow-y-auto">
            {archivosFiltrados.map((archivo) => (
              <Label
                key={archivo.openai_file_id}
                className="border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950"
              >
                <Checkbox
                  checked={selectedArchivoIds.includes(archivo.openai_file_id)}
                  onCheckedChange={(checked) =>
                    onToggleArchivo?.(archivo.openai_file_id, !!checked)
                  }
                  className={cn(
                    'peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    selectedArchivoIds.includes(archivo.openai_file_id)
                      ? ''
                      : 'invisible',
                  )}
                />

                <FileText className="text-muted-foreground h-4 w-4" />

                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {stripUuidPrefixFromBasename(getBasename(archivo.path))}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {archivo.size != null
                      ? formatFileSize(archivo.size)
                      : 'Tamaño no disponible'}
                  </p>
                </div>
              </Label>
            ))}
          </div>
        </div>
      ),
    },

    {
      name: 'Repositorios',

      value: 'repositorios',

      icon: FolderOpen,

      content: (
        <div className="flex flex-col">
          <BarraBusqueda
            value={busquedaRepositorios}
            onChange={setBusquedaRepositorios}
            placeholder="Buscar repositorio..."
            className="m-1 mb-1.5"
          />
          <div className="flex h-96 flex-col gap-0.5 overflow-y-auto">
            {repositoriosFiltrados.map((repositorio) => (
              <Label
                key={repositorio.id}
                className="border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950"
              >
                <Checkbox
                  checked={selectedRepositorioIds.includes(repositorio.id)}
                  onCheckedChange={(checked) =>
                    onToggleRepositorio?.(repositorio.id, !!checked)
                  }
                  className={cn(
                    'peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    selectedRepositorioIds.includes(repositorio.id)
                      ? ''
                      : 'invisible',
                  )}
                />

                <FolderOpen className="text-muted-foreground h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {repositorio.nombre}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {repositorio.descripcion} · {repositorio.cantidadArchivos}{' '}
                    archivos
                  </p>
                </div>
              </Label>
            ))}
          </div>
        </div>
      ),
    },

    {
      name: 'Subir archivos',

      value: 'subir-archivos',

      icon: Upload,

      content: (
        <div className="p-1">
          <FileDropzone
            persistentFiles={uploadedFiles}
            onFilesChange={onFilesChange}
            enableSha256Dedupe={enableSha256Dedupe}
            onDedupePendingChange={onDedupePendingChange}
            enableAutoUpload={enableAutoUpload}
            title="Sube archivos de referencia"
            description="Documentos que serán usados como contexto para la generación"
            autoScrollToDropzone={autoScrollToDropzone}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex w-full flex-col gap-1">
      <Label>
        Referencias para la IA{' '}
        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
          (Opcional)
        </span>
      </Label>

      <Tabs defaultValue="archivos-existentes" className="gap-4">
        <TabsList className="w-full">
          {tabs.map(({ icon: Icon, name, value }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1 px-2.5 sm:px-3"
            >
              <Icon />

              <span className="hidden sm:inline">{name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents className="bg-background mx-1 -mt-2 mb-1 h-full rounded-sm">
          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="animate-in fade-in duration-300 ease-out"
            >
              {tab.content}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>
    </div>
  )
}

export default ReferenciasParaIA
