import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export type Pagination03Props = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  className?: string
}

const toInt = (n: unknown, fallback: number) => {
  const x = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(x) ? Math.floor(x) : fallback
}

function getPageItems(page: number, pageCount: number): Array<number | '...'> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  const items: Array<number | '...'> = []
  const safePage = Math.min(Math.max(page, 1), pageCount)

  items.push(1)

  const start = Math.max(2, safePage - 1)
  const end = Math.min(pageCount - 1, safePage + 1)

  if (start > 2) items.push('...')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < pageCount - 1) items.push('...')

  items.push(pageCount)
  return items
}

export function Pagination03({
  page,
  pageCount,
  onPageChange,
  className,
}: Pagination03Props) {
  const safePageCount = Math.max(1, toInt(pageCount, 1))
  const safePage = Math.min(Math.max(toInt(page, 1), 1), safePageCount)

  const items = getPageItems(safePage, safePageCount)
  const canPrev = safePage > 1
  const canNext = safePage < safePageCount

  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), safePageCount)
    if (next === safePage) return
    onPageChange(next)
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            className={cn(!canPrev && 'pointer-events-none opacity-50')}
            onClick={(e) => {
              e.preventDefault()
              if (!canPrev) return
              go(safePage - 1)
            }}
          />
        </PaginationItem>

        {items.map((it, idx) =>
          it === '...' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={it}>
              <PaginationLink
                href="#"
                isActive={it === safePage}
                onClick={(e) => {
                  e.preventDefault()
                  go(it)
                }}
                className={
                  it === safePage
                    ? cn(
                        buttonVariants({
                          variant: 'default',
                          size: 'icon',
                        }),
                        'hover:text-primary-foreground! dark:bg-primary dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/90 shadow-none! dark:border-transparent',
                      )
                    : undefined
                }
              >
                {it}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            className={cn(!canNext && 'pointer-events-none opacity-50')}
            onClick={(e) => {
              e.preventDefault()
              if (!canNext) return
              go(safePage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default Pagination03
