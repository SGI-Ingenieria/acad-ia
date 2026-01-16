import { FileText, FolderOpen, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'

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
import { ARCHIVOS, REPOSITORIOS } from '@/features/planes/nuevo/catalogs'

const ReferenciasParaIA = ({
  selectedArchivoIds = [],
  selectedRepositorioIds = [],
  onToggleArchivo,
  onToggleRepositorio,
  onFilesChange,
}: {
  selectedArchivoIds?: Array<string>
  selectedRepositorioIds?: Array<string>
  onToggleArchivo?: (id: string, checked: boolean) => void
  onToggleRepositorio?: (id: string, checked: boolean) => void
  onFilesChange?: (files: Array<UploadedFile>) => void
}) => {
  const [busquedaArchivos, setBusquedaArchivos] = useState('')
  const [busquedaRepositorios, setBusquedaRepositorios] = useState('')

  const cleanText = (text: string) => {
    return text
      .normalize('NFD') // Descompone "á" en "a" + "´"
      .replace(/[\u0300-\u036f]/g, '') // Elimina los símbolos diacríticos
      .toLowerCase() // Convierte a minúsculas
  }

  // Filtrado de archivos y de repositorios
  const archivosFiltrados = useMemo(() => {
    // Función helper para limpiar texto (quita acentos y hace minúsculas)

    const term = cleanText(busquedaArchivos)
    return ARCHIVOS.filter((archivo) =>
      cleanText(archivo.nombre).includes(term),
    )
  }, [busquedaArchivos])

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
          <div className="flex h-72 flex-col gap-0.5 overflow-y-auto">
            {archivosFiltrados.map((archivo) => (
              <Label
                key={archivo.id}
                className="border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950"
              >
                <Checkbox
                  checked={selectedArchivoIds.includes(archivo.id)}
                  onCheckedChange={(checked) =>
                    onToggleArchivo?.(archivo.id, !!checked)
                  }
                  className="peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />

                <FileText className="text-muted-foreground h-4 w-4" />

                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {archivo.nombre}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    {archivo.tamaño}
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
          <div className="flex h-72 flex-col gap-0.5 overflow-y-auto">
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
                  className="peer border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-ring h-5 w-5 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
        <div>
          <FileDropzone
            onFilesChange={onFilesChange}
            title="Sube archivos de referencia"
            description="Documentos que serán usados como contexto para la generación"
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex w-full flex-col gap-1">
      <Label>Referencias para la IA</Label>

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
