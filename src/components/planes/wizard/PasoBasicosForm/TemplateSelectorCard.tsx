import { useState } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type TemplateData = {
  id: string
  name: string
  versions: Array<string>
}

// Default data (kept for backward compatibility if caller doesn't pass templates)
const DEFAULT_TEMPLATES_DATA: Array<TemplateData> = [
  {
    id: 'sep-2025',
    name: 'Licenciatura RVOE SEP',
    versions: ['v2025.2 (Vigente)', 'v2025.1', 'v2024.Final'],
  },
  {
    id: 'interno-mix',
    name: 'Estándar Institucional Mixto',
    versions: ['v2.0', 'v1.5', 'v1.0-beta'],
  },
  {
    id: 'conacyt',
    name: 'Formato Posgrado CONAHCYT',
    versions: ['v3.0 (2025)', 'v2.8'],
  },
]

interface Props {
  cardTitle?: string
  cardDescription?: string
  templatesData?: Array<TemplateData>
}

export function TemplateSelectorCard({
  cardTitle = 'Configuración del Documento',
  cardDescription = 'Selecciona la base para tu nuevo plan.',
  templatesData = DEFAULT_TEMPLATES_DATA,
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedVersion, setSelectedVersion] = useState<string>('')

  // Buscamos las versiones de la plantilla seleccionada
  const currentTemplateData = templatesData.find(
    (t) => t.id === selectedTemplate,
  )
  const availableVersions = currentTemplateData?.versions || []

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value)
    // Buscamos los datos de esta plantilla
    const template = templatesData.find((t) => t.id === value)

    // Si tiene versiones, seleccionamos la primera automáticamente
    if (template && template.versions.length > 0) {
      setSelectedVersion(template.versions[0])
    } else {
      setSelectedVersion('')
    }
  }

  return (
    <Card className="w-full max-w-lg gap-2 overflow-hidden">
      <CardHeader className="px-4 pb-2 sm:px-6 sm:pb-4">
        <CardTitle className="text-lg">{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* SELECT 1: PRIMARIO (Llamativo) */}
        <div className="space-y-2">
          <Label
            htmlFor="template-select"
            className="text-foreground text-base font-semibold"
          >
            Plantilla
          </Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger
              id="template-select"
              className="bg-background border-primary/40 focus:ring-primary/20 focus:border-primary flex h-11 w-full min-w-0 items-center justify-between gap-2 text-base shadow-sm [&>span]:block! [&>span]:truncate! [&>span]:text-left"
            >
              <SelectValue placeholder="Selecciona una plantilla..." />
            </SelectTrigger>
            <SelectContent>
              {templatesData.map((t) => (
                <SelectItem key={t.id} value={t.id} className="font-medium">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SELECT 2: SECUNDARIO (Sutil) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="version-select"
              className={cn(
                'text-xs tracking-wider uppercase transition-colors',
                !selectedTemplate
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground',
              )}
            >
              Versión
            </Label>
          </div>

          <Select
            value={selectedVersion}
            onValueChange={setSelectedVersion}
            disabled={!selectedTemplate}
          >
            <SelectTrigger
              id="version-select"
              className={cn(
                'flex h-9 min-w-0 items-center justify-between gap-2 text-sm transition-all duration-300',
                /* AQUÍ ESTÁ EL CAMBIO DE ANCHO: */
                'w-full max-w-full sm:w-55',

                /* Las correcciones vitales para truncado que ya teníamos: */
                'min-w-0 [&>span]:block! [&>span]:truncate! [&>span]:text-left',
                '[&>span]:block [&>span]:min-w-0 [&>span]:truncate [&>span]:text-left',

                !selectedTemplate
                  ? 'bg-muted/50 cursor-not-allowed border-transparent opacity-50'
                  : 'bg-muted/20 border-border hover:bg-background hover:border-primary/30',
              )}
            >
              <SelectValue
                placeholder={
                  !selectedTemplate
                    ? '— Esperando plantilla —'
                    : 'Selecciona versión'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map((v) => (
                <SelectItem
                  key={v}
                  value={v}
                  className="text-muted-foreground focus:text-foreground text-sm"
                >
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
