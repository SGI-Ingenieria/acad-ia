import { Upload, File, X, FileText } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/features/planes/utils/format-file-size'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string // Necesario para React (key)
  file: File // La fuente de verdad (contiene name, size, type)
  preview?: string // Opcional: si fueran imágenes
}

interface FileDropzoneProps {
  persistentFiles?: Array<UploadedFile>
  onFilesChange?: (files: Array<UploadedFile>) => void
  acceptedTypes?: string
  maxFiles?: number
  title?: string
  description?: string
  autoScrollToDropzone?: boolean
}

export function FileDropzone({
  persistentFiles,
  onFilesChange,
  acceptedTypes = '.doc,.docx,.pdf',
  maxFiles = 5,
  title = 'Arrastra archivos aquí',
  description = 'o haz clic para seleccionar',
  autoScrollToDropzone = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<Array<UploadedFile>>(persistentFiles ?? [])
  const onFilesChangeRef = useRef<typeof onFilesChange>(onFilesChange)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevFilesLengthRef = useRef(files.length)

  const addFiles = useCallback(
    (incomingFiles: Array<File>) => {
      console.log(
        'incoming files:',
        incomingFiles.map((file) => file.name),
      )

      setFiles((previousFiles) => {
        console.log(
          'previous files',
          previousFiles.map((f) => f.file.name),
        )

        // Evitar duplicados por nombre (comprobación global en los archivos existentes)
        const existingFileNames = new Set(
          previousFiles.map((uploaded) => uploaded.file.name),
        )
        const uniqueNewFiles = incomingFiles.filter(
          (incomingFile) => !existingFileNames.has(incomingFile.name),
        )

        // Convertir archivos a objetos con ID único para manejo en React
        const filesToUpload: Array<UploadedFile> = uniqueNewFiles.map(
          (incomingFile) => ({
            id:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? (crypto as any).randomUUID()
                : `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file: incomingFile,
          }),
        )

        // Calcular espacio disponible respetando el límite máximo
        const room = Math.max(0, maxFiles - previousFiles.length)
        const nextFiles = [
          ...previousFiles,
          ...filesToUpload.slice(0, room),
        ].slice(0, maxFiles)
        return nextFiles
      })
    },
    [maxFiles],
  )

  // Manejador para cuando se arrastran archivos sobre la zona
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  // Manejador para cuando se sale de la zona de arrastre
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // Manejador para cuando se sueltan los archivos
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles],
  )

  // Manejador para la selección de archivos mediante el input nativo
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files)
        addFiles(selectedFiles)
        // Corrección de bug: Limpiar el valor para permitir seleccionar el mismo archivo nuevamente si fue eliminado
        e.target.value = ''
      }
    },
    [addFiles],
  )

  // Función para eliminar un archivo específico por su ID
  const removeFile = useCallback((fileId: string) => {
    setFiles((previousFiles) => {
      console.log(
        'previous files',
        previousFiles.map((f) => f.file.name),
      )
      const remainingFiles = previousFiles.filter(
        (uploadedFile) => uploadedFile.id !== fileId,
      )
      return remainingFiles
    })
  }, [])

  // Mantener la referencia actualizada de la función callback externa para evitar loops en useEffect
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange
  }, [onFilesChange])

  // Notificar al componente padre cuando cambia la lista de archivos
  useEffect(() => {
    if (onFilesChangeRef.current) onFilesChangeRef.current(files)
  }, [files])

  // Scroll automático hacia abajo solo cuando se pasa de 0 a 1 o más archivos
  useEffect(() => {
    if (
      autoScrollToDropzone &&
      prevFilesLengthRef.current === 0 &&
      files.length > 0
    ) {
      // Usar un pequeño timeout para asegurar que el renderizado se complete
      const timer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 100)

      // Actualizar la referencia
      prevFilesLengthRef.current = files.length
      return () => clearTimeout(timer)
    }

    // Mantener sincronizada la referencia en otros casos
    prevFilesLengthRef.current = files.length
  }, [files.length, autoScrollToDropzone])

  // Determinar el icono a mostrar según la extensión del archivo
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="text-destructive h-4 w-4" />
      case 'doc':
      case 'docx':
        return <FileText className="text-info h-4 w-4" />
      default:
        return <File className="text-muted-foreground h-4 w-4" />
    }
  }

  return (
    <div className="space-y-3">
      {/* Elemento invisible para referencia de scroll */}
      <div ref={bottomRef} />

      {/* Área principal de dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition-all duration-300',
          // Siempre usar borde por defecto a menos que se esté arrastrando
          'border-border hover:border-primary/50',
          isDragging && 'ring-primary ring-2 ring-offset-2',
        )}
      >
        <input
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={files.length >= maxFiles}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer"
          aria-label="Seleccionar archivos"
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                isDragging
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-accent-foreground',
              )}
            >
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-foreground text-sm font-medium">{title}</p>
              {/* <p className="text-muted-foreground mt-1 text-xs">
                {description}
              </p> */}
              <p className="text-muted-foreground mt-1 text-xs">
                Formatos:{' '}
                {acceptedTypes
                  .replace(/\./g, '')
                  .toUpperCase()
                  .replace(/,/g, ', ')}
              </p>

              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span
                  className={cn(
                    'text-primary text-xl font-bold',
                    files.length >= maxFiles ? 'text-destructive' : '',
                  )}
                >
                  {files.length}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    files.length >= maxFiles
                      ? 'text-destructive'
                      : 'text-muted-foreground/80',
                  )}
                >
                  / {maxFiles} archivos (máximo)
                </span>
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* Lista de archivos subidos (Orden inverso: más recientes primero) */}
      <div className="h-56 overflow-y-auto">
        {files.length > 0 && (
          <div className="space-y-2">
            {[...files].reverse().map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="bg-accent/50 border-border fade-in flex items-center gap-3 rounded-lg border p-3"
              >
                {getFileIcon(uploadedFile.file.type)}
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-sm font-medium">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => removeFile(uploadedFile.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
