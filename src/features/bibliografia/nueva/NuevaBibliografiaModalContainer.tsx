import { useNavigate } from '@tanstack/react-router'
import CSL from 'citeproc'
import { Globe, Loader2, Plus, RefreshCw, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { BuscarBibliografiaRequest } from '@/data'
import type { GoogleBooksVolume } from '@/data/api/subjects.api'
import type { TablesInsert } from '@/types/supabase'

import { defineStepper } from '@/components/stepper'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WizardLayout } from '@/components/wizard/WizardLayout'
import { WizardResponsiveHeader } from '@/components/wizard/WizardResponsiveHeader'
import { buscar_bibliografia } from '@/data'
import { useCreateBibliografia } from '@/data/hooks/useSubjects'
import { cn } from '@/lib/utils'

type MetodoBibliografia = 'MANUAL' | 'IA' | null
export type FormatoCita = 'apa' | 'ieee' | 'vancouver' | 'chicago'

type CSLAuthor = {
  family: string
  given: string
}

type CSLItem = {
  id: string
  type: 'book'
  title: string
  author: Array<CSLAuthor>
  publisher?: string
  issued?: { 'date-parts': Array<Array<number>> }
  ISBN?: string
}

type BibliografiaAsignaturaInsert = TablesInsert<'bibliografia_asignatura'>
type BibliografiaTipo = BibliografiaAsignaturaInsert['tipo']
type BibliografiaTipoFuente = NonNullable<
  BibliografiaAsignaturaInsert['tipo_fuente']
>

type BibliografiaRef = {
  id: string
  source: BibliografiaTipoFuente
  raw?: GoogleBooksVolume
  title: string
  authors: Array<string>
  publisher?: string
  year?: number
  isbn?: string

  tipo: BibliografiaTipo
}

type WizardState = {
  metodo: MetodoBibliografia
  ia: {
    q: string
    cantidadDeSugerencias: number | null
    showConservacionTooltip: boolean
    sugerencias: Array<{
      id: string
      selected: boolean
      volume: GoogleBooksVolume
    }>
    isLoading: boolean
    errorMessage: string | null
  }
  manual: {
    draft: {
      title: string
      authorsText: string
      publisher: string
      yearText: string
      isbn: string
    }
    refs: Array<BibliografiaRef>
  }
  formato: FormatoCita | null
  refs: Array<BibliografiaRef>
  citaEdits: Record<FormatoCita, Record<string, string>>
  generatingIds: Set<string>
  isSaving: boolean
  errorMessage: string | null
}

const Wizard = defineStepper(
  { id: 'metodo', title: 'Método', description: 'Manual o Buscar en línea' },
  {
    id: 'paso2',
    title: 'Datos básicos',
    description: 'Seleccionar o capturar',
  },
  { id: 'paso3', title: 'Detalles', description: 'Formato y citas' },
  { id: 'resumen', title: 'Resumen', description: 'Confirmar' },
)

function parsearAutor(nombreCompleto: string): CSLAuthor {
  if (nombreCompleto.includes(',')) {
    return {
      family: nombreCompleto.split(',')[0]?.trim() ?? '',
      given: nombreCompleto.split(',')[1]?.trim() ?? '',
    }
  }
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 1) return { family: partes[0] ?? '', given: '' }
  const family = partes.pop() ?? ''
  const given = partes.join(' ')
  return { family, given }
}

function tryParseYear(publishedDate?: string): number | undefined {
  if (!publishedDate) return undefined
  const match = String(publishedDate).match(/\d{4}/)
  if (!match) return undefined
  const year = Number.parseInt(match[0], 10)
  return Number.isFinite(year) ? year : undefined
}

function volumeToRef(volume: GoogleBooksVolume): BibliografiaRef {
  const info = volume.volumeInfo ?? {}
  const title = (info.title ?? '').trim() || 'Sin título'
  const authors = Array.isArray(info.authors) ? info.authors : []
  const publisher = info.publisher
  const year = tryParseYear(info.publishedDate)
  const isbn =
    info.industryIdentifiers?.find((x) => x.identifier)?.identifier ?? undefined

  return {
    id: volume.id,
    source: 'MANUAL',
    raw: volume,
    title,
    authors,
    publisher,
    year,
    isbn,
    tipo: 'BASICA',
  }
}

function AutoSizeTextarea({
  value,
  disabled,
  placeholder,
  className,
  onChange,
}: {
  value: string
  disabled?: boolean
  placeholder?: string
  className?: string
  onChange: (next: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const autosize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }

  useLayoutEffect(() => {
    autosize()
  }, [value])

  return (
    <Textarea
      ref={ref}
      rows={1}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      className={cn('min-h-0 resize-none overflow-hidden pr-10', className)}
      onChange={(e) => {
        const el = e.currentTarget
        el.style.height = '0px'
        el.style.height = `${el.scrollHeight}px`
        onChange(el.value)
      }}
    />
  )
}

function citeprocHtmlToPlainText(value: string) {
  const input = value
  if (!input) return ''

  // citeproc suele devolver HTML + entidades (`&#38;`, `&amp;`, etc.).
  // Convertimos a texto plano usando el parser del navegador.
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html')
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
  } catch {
    // Fallback ultra simple (por si DOMParser no existe en algún entorno).
    return input
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#38;?/g, '&')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }
}

async function fetchTextCached(url: string, cache: Map<string, string>) {
  const cached = cache.get(url)
  if (cached) return cached
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo cargar recurso: ${url}`)
  const text = await res.text()

  // En dev (SPA), una ruta inexistente puede devolver `index.html` con 200.
  // Eso rompe citeproc con errores poco claros.
  const trimmed = text.trim().toLowerCase()
  const looksLikeHtml =
    trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
  if (looksLikeHtml) {
    throw new Error(
      `Recurso CSL/XML no encontrado en ${url}. ` +
        `Asegúrate de colocar los archivos en public/csl (ver public/csl/README.md).`,
    )
  }

  const looksLikeXml =
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<style') ||
    trimmed.startsWith('<locale')
  if (!looksLikeXml) {
    throw new Error(
      `Recurso en ${url} no parece XML CSL válido. ` +
        `Verifica que sea un archivo .csl/.xml correcto.`,
    )
  }

  cache.set(url, text)
  return text
}

// Recursos locales servidos desde Vite `public/`.
// Colocar los archivos en `public/csl/styles/*` y `public/csl/locales/*`.
const PUBLIC_BASE_URL = import.meta.env.BASE_URL || '/'
function publicUrl(path: string) {
  return `${PUBLIC_BASE_URL}${path.replace(/^\//, '')}`
}

const CSL_STYLE_URL: Record<FormatoCita, string> = {
  apa: publicUrl('csl/styles/apa.csl'),
  ieee: publicUrl('csl/styles/ieee.csl'),
  chicago: publicUrl('csl/styles/chicago-author-date.csl'),
  vancouver: publicUrl('csl/styles/nlm-citation-sequence.csl'),
}

const CSL_LOCALE_URL = publicUrl('csl/locales/locales-es-MX.xml')

export function NuevaBibliografiaModalContainer({
  planId,
  asignaturaId,
}: {
  planId: string
  asignaturaId: string
}) {
  const navigate = useNavigate()
  const createBibliografia = useCreateBibliografia()

  const [wizard, setWizard] = useState<WizardState>({
    metodo: null,
    ia: {
      q: '',
      cantidadDeSugerencias: 10,
      showConservacionTooltip: false,
      sugerencias: [],
      isLoading: false,
      errorMessage: null,
    },
    manual: {
      draft: {
        title: '',
        authorsText: '',
        publisher: '',
        yearText: '',
        isbn: '',
      },
      refs: [],
    },
    formato: null,
    refs: [],
    citaEdits: {
      apa: {},
      ieee: {},
      chicago: {},
      vancouver: {},
    },
    generatingIds: new Set(),
    isSaving: false,
    errorMessage: null,
  })

  const styleCacheRef = useRef(new Map<string, string>())
  const localeCacheRef = useRef(new Map<string, string>())

  const titleOverrides =
    wizard.metodo === 'IA'
      ? { paso2: 'Sugerencias', paso3: 'Estructura' }
      : { paso2: 'Datos básicos', paso3: 'Detalles' }

  const handleClose = () => {
    navigate({
      to: `/planes/${planId}/asignaturas/${asignaturaId}/bibliografia/`,
      resetScroll: false,
    })
  }

  const refsForStep3: Array<BibliografiaRef> =
    wizard.metodo === 'IA'
      ? wizard.ia.sugerencias
          .filter((s) => s.selected)
          .map((s) => volumeToRef(s.volume))
      : wizard.manual.refs

  // Mantener `wizard.refs` como snapshot para pasos 3/4.
  useEffect(() => {
    setWizard((w) => ({ ...w, refs: refsForStep3 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.metodo, wizard.ia.sugerencias, wizard.manual.refs])

  const citationsForFormato = useMemo(() => {
    if (!wizard.formato) return {}
    return wizard.citaEdits[wizard.formato]
  }, [wizard.citaEdits, wizard.formato])

  const allCitationsReady = useMemo(() => {
    if (!wizard.formato) return false
    if (wizard.refs.length === 0) return false
    const map = wizard.citaEdits[wizard.formato]
    return wizard.refs.every(
      (r) => typeof map[r.id] === 'string' && map[r.id].trim().length > 0,
    )
  }, [wizard.citaEdits, wizard.formato, wizard.refs])

  const canContinueDesdeMetodo =
    wizard.metodo === 'MANUAL' || wizard.metodo === 'IA'

  const canContinueDesdePaso2 =
    wizard.metodo === 'IA'
      ? wizard.ia.sugerencias.some((s) => s.selected)
      : wizard.manual.refs.length > 0

  const canContinueDesdePaso3 = Boolean(wizard.formato) && allCitationsReady

  async function handleBuscarSugerencias() {
    const hadNoSugerenciasBefore = wizard.ia.sugerencias.length === 0

    const cantidad = wizard.ia.cantidadDeSugerencias
    if (
      !Number.isFinite(cantidad ?? Number.NaN) ||
      (cantidad as number) < 1 ||
      (cantidad as number) > 40
    ) {
      setWizard((w) => ({
        ...w,
        ia: {
          ...w.ia,
          errorMessage:
            'La cantidad de sugerencias debe ser un entero entre 1 y 40 (o vacío).',
        },
        errorMessage: null,
      }))
      return
    }

    const selected = wizard.ia.sugerencias.filter((s) => s.selected)

    setWizard((w) => ({
      ...w,
      ia: {
        ...w.ia,
        // Conservar únicamente las sugerencias seleccionadas.
        sugerencias: w.ia.sugerencias.filter((s) => s.selected),
        showConservacionTooltip: false,
        isLoading: true,
        errorMessage: null,
      },
      errorMessage: null,
    }))

    try {
      const selectedCount = selected.length
      const req: BuscarBibliografiaRequest = {
        searchTerms: {
          q: wizard.ia.q,
          maxResults: (cantidad as number) + selectedCount,
          // orderBy: ignorado por ahora
        },
      }

      const items = await buscar_bibliografia(req)

      setWizard((w) => {
        const existingById = new Map(w.ia.sugerencias.map((s) => [s.id, s]))

        const newOnes = items
          .filter((it) => !existingById.has(it.id))
          .slice(0, cantidad as number)
          .map((it) => ({ id: it.id, selected: false, volume: it }))

        return {
          ...w,
          ia: {
            ...w.ia,
            sugerencias: [...w.ia.sugerencias, ...newOnes],
            showConservacionTooltip:
              hadNoSugerenciasBefore && newOnes.length > 0,
            isLoading: false,
            errorMessage: null,
          },
        }
      })
    } catch (e: any) {
      setWizard((w) => ({
        ...w,
        ia: {
          ...w.ia,
          isLoading: false,
          errorMessage:
            typeof e?.message === 'string'
              ? e.message
              : 'Error al buscar bibliografía',
        },
      }))
    }
  }

  async function generateCitasForFormato(
    formato: FormatoCita,
    refs: Array<BibliografiaRef>,
    options?: {
      force?: boolean
    },
  ) {
    const force = Boolean(options?.force)
    setWizard((w) => {
      const nextIds = new Set(w.generatingIds)
      refs.forEach((r) => nextIds.add(r.id))
      return {
        ...w,
        generatingIds: nextIds,
      }
    })

    try {
      const xmlStyle = await fetchTextCached(
        CSL_STYLE_URL[formato],
        styleCacheRef.current,
      )
      const xmlLocale = await fetchTextCached(
        CSL_LOCALE_URL,
        localeCacheRef.current,
      )

      const cslItems: Record<string, CSLItem> = {}
      for (const r of refs) {
        cslItems[r.id] = {
          id: r.id,
          type: 'book',
          title: r.title || 'Sin título',
          author: r.authors.map(parsearAutor),
          publisher: r.publisher,
          issued: r.year ? { 'date-parts': [[r.year]] } : undefined,
          ISBN: r.isbn,
        }
      }

      const sys = {
        retrieveLocale: (_lang: string) => xmlLocale,
        retrieveItem: (id: string) => cslItems[id],
      }

      const engine = new CSL.Engine(sys as any, xmlStyle)
      engine.updateItems(Object.keys(cslItems))
      const result = engine.makeBibliography()
                              
      // result[0] contiene los metadatos, result[1] las citas formateadas
      const meta = result?.[0] as { entry_ids?: string[][] } | undefined
      const entries = (result?.[1] ?? []) as Array<string>

      const citations: Record<string, string> = {}
                                                            
      // meta.entry_ids es un arreglo de arreglos: [["id-2"], ["id-1"], ...]
      const sortedIds = meta?.entry_ids ?? []

      for (let i = 0; i < entries.length; i++) {
        const id = sortedIds[i]?.[0] // Sacamos el ID real de esta posición
        if (!id) continue
                                                                                                      
        const cita = citeprocHtmlToPlainText(entries[i] ?? '')
        citations[id] = cita
      }

      setWizard((w) => {
        const nextEdits = { ...w.citaEdits }
        const existing = nextEdits[formato]
        const merged: Record<string, string> = { ...existing }

        for (const id of Object.keys(citations)) {
          merged[id] =
            force || !merged[id] || merged[id].trim().length === 0
              ? (citations[id] ?? '')
              : merged[id]
        }
        nextEdits[formato] = merged

        const nextIds = new Set(w.generatingIds)
        refs.forEach((r) => nextIds.delete(r.id))

        return {
          ...w,
          citaEdits: nextEdits,
          generatingIds: nextIds,
        }
      })
    } catch (e: any) {
      setWizard((w) => {
        const nextIds = new Set(w.generatingIds)
        refs.forEach((r) => nextIds.delete(r.id))
        return {
          ...w,
          generatingIds: nextIds,
          errorMessage:
            typeof e?.message === 'string'
              ? e.message
              : 'Error al generar citas',
        }
      })
    }
  }

  useEffect(() => {
    if (!wizard.formato) return
    if (wizard.refs.length === 0) return
    const map = wizard.citaEdits[wizard.formato]
    const missing = wizard.refs.some(
      (r) => !map[r.id] || map[r.id].trim().length === 0,
    )
    if (!missing) return
    if (wizard.generatingIds.size > 0) return
    void generateCitasForFormato(wizard.formato, wizard.refs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.formato, wizard.refs])

  async function handleCreate() {
    setWizard((w) => ({ ...w, isSaving: true, errorMessage: null }))

    try {
      if (!wizard.formato) throw new Error('Selecciona un formato')
      const map = wizard.citaEdits[wizard.formato]
      if (wizard.refs.length === 0) throw new Error('No hay referencias')

      await Promise.all(
        wizard.refs.map((r) =>
          createBibliografia.mutateAsync({
            asignatura_id: asignaturaId,
            tipo: r.tipo,
            cita: map[r.id] ?? '',
            tipo_fuente: r.source,
            biblioteca_item_id: null,
          }),
        ),
      )

      setWizard((w) => ({ ...w, isSaving: false }))
      handleClose()
    } catch (e: any) {
      setWizard((w) => ({
        ...w,
        isSaving: false,
        errorMessage:
          typeof e?.message === 'string'
            ? e.message
            : 'Error al guardar bibliografía',
      }))
    }
  }

  return (
    <Wizard.Stepper.Provider
      initialStep={Wizard.utils.getFirst().id}
      className="flex h-full flex-col"
    >
      {({ methods }) => {
        const idx = Wizard.utils.getIndex(methods.current.id)
        const isLast = idx >= Wizard.steps.length - 1

        return (
          <WizardLayout
            title="Agregar Bibliografía"
            onClose={handleClose}
            headerSlot={
              <WizardResponsiveHeader
                wizard={Wizard}
                methods={methods}
                titleOverrides={titleOverrides}
              />
            }
            footerSlot={
              <Wizard.Stepper.Controls>
                <div className="flex grow items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => methods.prev()}
                    disabled={
                      idx === 0 || wizard.ia.isLoading || wizard.isSaving
                    }
                  >
                    Anterior
                  </Button>
                  {isLast ? (
                    <Button onClick={handleCreate} disabled={wizard.isSaving}>
                      {wizard.isSaving
                        ? 'Agregando...'
                        : 'Agregar Bibliografía'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => methods.next()}
                      disabled={
                        wizard.ia.isLoading ||
                        wizard.isSaving ||
                        (idx === 0 && !canContinueDesdeMetodo) ||
                        (idx === 1 && !canContinueDesdePaso2) ||
                        (idx === 2 && !canContinueDesdePaso3)
                      }
                    >
                      Siguiente
                    </Button>
                  )}
                </div>
              </Wizard.Stepper.Controls>
            }
          >
            <div className="mx-auto max-w-3xl">
              {wizard.errorMessage ? (
                <Card className="border-destructive/40 mb-4">
                  <CardHeader>
                    <CardTitle className="text-destructive">
                      {wizard.errorMessage}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ) : null}

              {idx === 0 && (
                <Wizard.Stepper.Panel>
                  <MetodoStep
                    metodo={wizard.metodo}
                    onChange={(metodo) =>
                      setWizard((w) => ({
                        ...w,
                        metodo,
                        formato: null,
                        errorMessage: null,
                      }))
                    }
                  />
                </Wizard.Stepper.Panel>
              )}

              {idx === 1 && (
                <Wizard.Stepper.Panel>
                  {wizard.metodo === 'IA' ? (
                    <SugerenciasStep
                      q={wizard.ia.q}
                      cantidad={wizard.ia.cantidadDeSugerencias}
                      isLoading={wizard.ia.isLoading}
                      errorMessage={wizard.ia.errorMessage}
                      sugerencias={wizard.ia.sugerencias}
                      showConservacionTooltip={
                        wizard.ia.showConservacionTooltip
                      }
                      onDismissConservacionTooltip={() =>
                        setWizard((w) => ({
                          ...w,
                          ia: { ...w.ia, showConservacionTooltip: false },
                        }))
                      }
                      onChange={(patch) =>
                        setWizard((w) => ({
                          ...w,
                          ia: {
                            ...w.ia,
                            ...patch,
                          },
                          errorMessage: null,
                        }))
                      }
                      onGenerate={handleBuscarSugerencias}
                    />
                  ) : (
                    <DatosBasicosManualStep
                      draft={wizard.manual.draft}
                      refs={wizard.manual.refs}
                      onChangeDraft={(draft) =>
                        setWizard((w) => ({
                          ...w,
                          manual: { ...w.manual, draft },
                          errorMessage: null,
                        }))
                      }
                      onAddRef={(ref) =>
                        setWizard((w) => ({
                          ...w,
                          manual: {
                            ...w.manual,
                            refs: [...w.manual.refs, ref],
                          },
                          errorMessage: null,
                        }))
                      }
                      onRemoveRef={(id) =>
                        setWizard((w) => ({
                          ...w,
                          manual: {
                            ...w.manual,
                            refs: w.manual.refs.filter((r) => r.id !== id),
                          },
                        }))
                      }
                    />
                  )}
                </Wizard.Stepper.Panel>
              )}

              {idx === 2 && (
                <Wizard.Stepper.Panel>
                  <FormatoYCitasStep
                    refs={wizard.refs}
                    formato={wizard.formato}
                    citations={citationsForFormato}
                    generatingIds={wizard.generatingIds}
                    onChangeFormato={(formato) => {
                      setWizard((w) => ({ ...w, formato, errorMessage: null }))
                      if (formato) {
                        void generateCitasForFormato(formato, wizard.refs)
                      }
                    }}
                    onRegenerate={() => {
                      if (!wizard.formato) return
                      void generateCitasForFormato(
                        wizard.formato,
                        wizard.refs,
                        {
                          force: true,
                        },
                      )
                    }}
                    onChangeTipo={(id, tipo) =>
                      setWizard((w) => ({
                        ...w,
                        refs: w.refs.map((r) =>
                          r.id === id ? { ...r, tipo } : r,
                        ),
                      }))
                    }
                    onChangeCita={(id, value) => {
                      if (!wizard.formato) return
                      setWizard((w) => ({
                        ...w,
                        citaEdits: {
                          ...w.citaEdits,
                          [wizard.formato!]: {
                            ...w.citaEdits[wizard.formato!],
                            [id]: value,
                          },
                        },
                      }))
                    }}
                  />
                </Wizard.Stepper.Panel>
              )}

              {idx === 3 && (
                <Wizard.Stepper.Panel>
                  <ResumenStep
                    metodo={wizard.metodo}
                    formato={wizard.formato}
                    refs={wizard.refs}
                    citations={
                      wizard.formato ? wizard.citaEdits[wizard.formato] : {}
                    }
                  />
                </Wizard.Stepper.Panel>
              )}
            </div>
          </WizardLayout>
        )
      }}
    </Wizard.Stepper.Provider>
  )
}

function MetodoStep({
  metodo,
  onChange,
}: {
  metodo: MetodoBibliografia
  onChange: (metodo: MetodoBibliografia) => void
}) {
  const isSelected = (m: Exclude<MetodoBibliografia, null>) => metodo === m

  return (
    <div className="grid gap-4">
      <Card
        className={cn(
          'cursor-pointer transition-all',
          isSelected('MANUAL') && 'ring-ring ring-2',
        )}
        role="button"
        tabIndex={0}
        onClick={() => onChange('MANUAL')}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="text-primary h-5 w-5" /> Manual
          </CardTitle>
          <CardDescription>
            Captura referencias y edita la cita.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        className={cn(
          'cursor-pointer transition-all',
          isSelected('IA') && 'ring-ring ring-2',
        )}
        role="button"
        tabIndex={0}
        onClick={() => onChange('IA')}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="text-primary h-5 w-5" /> Buscar en línea
          </CardTitle>
          <CardDescription>
            Busca sugerencias y selecciona las mejores.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function SugerenciasStep({
  q,
  cantidad,
  isLoading,
  errorMessage,
  sugerencias,
  showConservacionTooltip,
  onDismissConservacionTooltip,
  onChange,
  onGenerate,
}: {
  q: string
  cantidad: number | null
  isLoading: boolean
  errorMessage: string | null
  sugerencias: Array<{
    id: string
    selected: boolean
    volume: GoogleBooksVolume
  }>
  showConservacionTooltip: boolean
  onDismissConservacionTooltip: () => void
  onChange: (
    patch: Partial<{
      q: string
      cantidadDeSugerencias: number | null
      sugerencias: any
    }>,
  ) => void
  onGenerate: () => void
}) {
  const selectedCount = sugerencias.filter((s) => s.selected).length

  const cantidadIsValid =
    typeof cantidad === 'number' &&
    Number.isFinite(cantidad) &&
    cantidad >= 1 &&
    cantidad <= 40

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Buscar sugerencias</CardTitle>
          <CardDescription>
            Conserva las seleccionadas y agrega nuevas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label>Búsqueda</Label>
            <Input
              value={q}
              onChange={(e) => onChange({ q: e.target.value })}
              placeholder="Ej: ingeniería de software, bases de datos..."
            />
          </div>

          <div className="mt-3 flex w-full flex-col items-end justify-between gap-3 sm:flex-row">
            <div className="w-full sm:w-44">
              <Label className="mb-2 block">Cantidad de sugerencias</Label>
              <Input
                type="number"
                min={1}
                max={40}
                step={1}
                inputMode="numeric"
                placeholder="Ej. 10"
                value={cantidad ?? ''}
                onKeyDown={(e) => {
                  if (['.', ',', '-', 'e', 'E', '+'].includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    onChange({ cantidadDeSugerencias: null })
                    return
                  }
                  const asNumber = Number(raw)
                  if (!Number.isFinite(asNumber)) return
                  const n = Math.floor(Math.abs(asNumber))
                  const capped = Math.min(Math.max(n >= 1 ? n : 1, 1), 40)
                  onChange({ cantidadDeSugerencias: capped })
                }}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onGenerate}
              disabled={isLoading || q.trim().length === 0 || !cantidadIsValid}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {sugerencias.length > 0
                ? 'Generar más sugerencias'
                : 'Generar sugerencias'}
            </Button>
          </div>

          {errorMessage ? (
            <div className="text-destructive text-sm">{errorMessage}</div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium">Sugerencias</h3>
          <Tooltip open={showConservacionTooltip}>
            <TooltipTrigger asChild>
              <div className="bg-muted text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold">
                <span aria-hidden>📌</span>
                {selectedCount} seleccionadas
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-xs">
              <div className="flex items-start gap-2">
                <span className="flex-1 text-sm">
                  Al generar más sugerencias, se conservarán las referencias
                  seleccionadas.
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={onDismissConservacionTooltip}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
          {sugerencias.map((s) => {
            const info = s.volume.volumeInfo ?? {}
            const title = (info.title ?? 'Sin título').trim()
            const authors = (info.authors ?? []).join(', ')
            const year = tryParseYear(info.publishedDate)
            const selected = s.selected

            return (
              <Label
                key={s.id}
                aria-checked={selected}
                className={cn(
                  'border-border hover:border-primary/30 hover:bg-accent/50 m-0.5 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-aria-checked:border-blue-600 has-aria-checked:bg-blue-50 dark:has-aria-checked:border-blue-900 dark:has-aria-checked:bg-blue-950',
                )}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    onChange({
                      sugerencias: sugerencias.map((x) =>
                        x.id === s.id ? { ...x, selected: !!checked } : x,
                      ),
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-muted-foreground text-xs">
                    {authors || '—'}
                    {year ? ` • ${year}` : ''}
                  </div>
                </div>
              </Label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DatosBasicosManualStep({
  draft,
  refs,
  onChangeDraft,
  onAddRef,
  onRemoveRef,
}: {
  draft: WizardState['manual']['draft']
  refs: Array<BibliografiaRef>
  onChangeDraft: (draft: WizardState['manual']['draft']) => void
  onAddRef: (ref: BibliografiaRef) => void
  onRemoveRef: (id: string) => void
}) {
  const canAdd = draft.title.trim().length > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agregar referencia</CardTitle>
          <CardDescription>
            Captura los datos y agrégala a la lista.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input
              value={draft.title}
              onChange={(e) =>
                onChangeDraft({ ...draft, title: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Autores (uno por línea)</Label>
            <Textarea
              value={draft.authorsText}
              onChange={(e) =>
                onChangeDraft({ ...draft, authorsText: e.target.value })
              }
              className="min-h-22.5"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Editorial</Label>
              <Input
                value={draft.publisher}
                onChange={(e) =>
                  onChangeDraft({ ...draft, publisher: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Año</Label>
              <Input
                value={draft.yearText}
                onChange={(e) =>
                  onChangeDraft({ ...draft, yearText: e.target.value })
                }
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>ISBN</Label>
            <Input
              value={draft.isbn}
              onChange={(e) =>
                onChangeDraft({ ...draft, isbn: e.target.value })
              }
            />
          </div>

          <Button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              const year = Number.parseInt(draft.yearText.trim(), 10)
              const ref: BibliografiaRef = {
                id: `manual-${crypto.randomUUID()}`,
                source: 'MANUAL',
                title: draft.title.trim(),
                authors: draft.authorsText
                  .split(/\r?\n/)
                  .map((x) => x.trim())
                  .filter(Boolean),
                publisher: draft.publisher.trim() || undefined,
                year: Number.isFinite(year) ? year : undefined,
                isbn: draft.isbn.trim() || undefined,
                tipo: 'BASICA',
              }
              onAddRef(ref)
              onChangeDraft({
                title: '',
                authorsText: '',
                publisher: '',
                yearText: '',
                isbn: '',
              })
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Agregar a la lista
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referencias</CardTitle>
          <CardDescription>{refs.length} en total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {refs.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.title}</div>
                <div className="text-muted-foreground text-xs">
                  {r.authors.join(', ') || '—'}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveRef(r.id)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function FormatoYCitasStep({
  refs,
  formato,
  citations,
  generatingIds,
  onChangeFormato,
  onRegenerate,
  onChangeTipo,
  onChangeCita,
}: {
  refs: Array<BibliografiaRef>
  formato: FormatoCita | null
  citations: Record<string, string>
  generatingIds: Set<string>
  onChangeFormato: (formato: FormatoCita | null) => void
  onRegenerate: () => void
  onChangeTipo: (id: string, tipo: BibliografiaTipo) => void
  onChangeCita: (id: string, value: string) => void
}) {
  const isGeneratingAny = generatingIds.size > 0

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN DE CONTROLES: Sutil, compacta y sticky */}
      <div className="bg-muted/40 border-border sticky top-0 z-10 rounded-lg border p-4 backdrop-blur-md">
        <div className="flex flex-col items-end justify-between gap-4 sm:flex-row">
          <div className="w-full flex-1 space-y-1.5 sm:max-w-xs">
            <Label className="text-muted-foreground text-xs tracking-wider uppercase">
              Formato de citación
            </Label>
            <Select
              value={formato ?? ''}
              onValueChange={(v) => onChangeFormato(v as any)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="vancouver">Vancouver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="secondary" // Cambiado a secondary para menor peso visual
            className="w-full gap-2 sm:w-auto"
            onClick={onRegenerate}
            disabled={!formato || refs.length === 0 || isGeneratingAny}
          >
            <RefreshCw className="h-4 w-4" /> Regenerar citas
          </Button>
        </div>
      </div>

      {/* 2. SECCIÓN DE LISTA: Separación visual clara */}
      <div className="space-y-4">
        {/* {refs.length > 0 && (
          <div className="flex items-center gap-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              Referencias añadidas
            </h3>
            <Badge variant="secondary" className="text-xs">
              {refs.length}
            </Badge>
          </div>
        )} */}

        <div className="space-y-3">
          {refs.map((r) => {
            const infoText = [
              r.authors.join(', '),
              r.publisher,
              r.year ? String(r.year) : undefined,
            ]
              .filter(Boolean)
              .join(' • ')

            const isGenerating = generatingIds.has(r.id)

            return (
              <Card key={r.id} className="overflow-hidden">
                <CardHeader className="bg-muted/10">
                  <CardTitle className="text-base leading-tight">
                    {r.title}
                  </CardTitle>
                  <CardDescription className="wrap-break-word">
                    {infoText}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <div className="space-y-2 sm:col-span-9">
                      <Label className="text-xs">Cita formateada</Label>
                      <div className="relative">
                        <AutoSizeTextarea
                          value={citations[r.id] ?? ''}
                          onChange={(next) => onChangeCita(r.id, next)}
                          disabled={isGenerating || isGeneratingAny}
                          placeholder="Cita generada…"
                        />
                        {isGenerating && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col items-start gap-2 sm:col-span-3 sm:items-stretch">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={r.tipo}
                        onValueChange={(v) => onChangeTipo(r.id, v as any)}
                        disabled={isGenerating || isGeneratingAny}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASICA">Básica</SelectItem>
                          <SelectItem value="COMPLEMENTARIA">
                            Complementaria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ResumenStep({
  metodo,
  formato,
  refs,
  citations,
}: {
  metodo: MetodoBibliografia
  formato: FormatoCita | null
  refs: Array<BibliografiaRef>
  citations: Record<string, string>
}) {
  // 1. Separar las referencias
  const basicas = refs.filter((r) => r.tipo === 'BASICA')
  const complementarias = refs.filter((r) => r.tipo === 'COMPLEMENTARIA')
  const metodoLabel =
    metodo === 'MANUAL' ? 'Manual' : metodo === 'IA' ? 'Buscar en línea' : '—'

  return (
    <div className="space-y-8">
      {/* Panel de Resumen General */}
      <div className="bg-muted/40 rounded-lg border p-4">
        <h3 className="text-foreground mb-4 text-sm font-semibold">
          Resumen de importación
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Método</p>
            <p className="font-medium">{metodoLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Formato</p>
            <p className="font-medium uppercase">{formato ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Básicas</p>
            <p className="font-medium">{basicas.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              Complementarias
            </p>
            <p className="font-medium">{complementarias.length}</p>
          </div>
        </div>
      </div>

      {/* Sección: Bibliografía Básica */}
      {basicas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-foreground border-b pb-2 text-sm font-medium">
            Bibliografía Básica
          </h4>
          <div className="space-y-2">
            {basicas.map((r) => (
              <div
                key={r.id}
                className="bg-background rounded-md border p-3 text-sm shadow-sm"
              >
                <p className="mb-1 font-medium">{r.title}</p>
                <p className="text-muted-foreground">
                  {citations[r.id] ?? 'Sin cita generada'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección: Bibliografía Complementaria */}
      {complementarias.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-foreground border-b pb-2 text-sm font-medium">
            Bibliografía Complementaria
          </h4>
          <div className="space-y-2">
            {complementarias.map((r) => (
              <div
                key={r.id}
                className="bg-background rounded-md border p-3 text-sm shadow-sm"
              >
                <p className="mb-1 font-medium">{r.title}</p>
                <p className="text-muted-foreground">
                  {citations[r.id] ?? 'Sin cita generada'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
