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
}

export function FileDropzone({
  persistentFiles,
  onFilesChange,
  acceptedTypes = '.doc,.docx,.pdf',
  maxFiles = 5,
  title = 'Arrastra archivos aquí',
  description = 'o haz clic para seleccionar',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<Array<UploadedFile>>(persistentFiles ?? [])
  const onFilesChangeRef = useRef<typeof onFilesChange>(onFilesChange)

  const addFiles = useCallback(
    (newFiles: Array<File>) => {
      const toUpload: Array<UploadedFile> = newFiles.map((file) => ({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? (crypto as any).randomUUID()
            : `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
      }))
      setFiles((prev) => {
        const room = Math.max(0, maxFiles - prev.length)
        const next = [...prev, ...toUpload.slice(0, room)].slice(0, maxFiles)
        return next
      })
    },
    [maxFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    },
    [addFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files)
        addFiles(selectedFiles)
      }
    },
    [addFiles],
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId)
      return next
    })
  }, [])

  // Keep latest callback in a ref to avoid retriggering effect on identity change
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange
  }, [onFilesChange])

  // Only emit when files actually change to avoid parent update loops
  useEffect(() => {
    if (onFilesChangeRef.current) onFilesChangeRef.current(files)
  }, [files])

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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-border hover:border-primary/50 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300',
          isDragging && 'active',
        )}
      >
        <input
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
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
              <p className="text-muted-foreground mt-1 text-xs">
                {description}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Formatos:{' '}
                {acceptedTypes
                  .replace(/\./g, '')
                  .toUpperCase()
                  .replace(/,/g, ', ')}
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item) => (
            <div
              key={item.id}
              className="bg-accent/50 border-border fade-in flex items-center gap-3 rounded-lg border p-3"
            >
              {getFileIcon(item.file.type)}
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {item.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(item.file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={() => removeFile(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {files.length >= maxFiles && (
        <p className="text-warning text-center text-xs">
          Máximo de {maxFiles} archivos alcanzado
        </p>
      )}
    </div>
  )
}
