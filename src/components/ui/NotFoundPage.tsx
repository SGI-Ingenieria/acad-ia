import { Link, useRouter } from '@tanstack/react-router'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

import { Button } from './button'

interface NotFoundPageProps {
  title?: string
  message?: string
  children?: React.ReactNode
}

export function NotFoundPage({
  title = 'Página no encontrada',
  message = 'Lo sentimos, no pudimos encontrar lo que buscabas. Es posible que la página haya sido movida o eliminada.',
  children,
}: NotFoundPageProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="bg-muted mb-6 rounded-full p-6">
        <FileQuestion className="text-muted-foreground h-12 w-12" />
      </div>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mb-8 max-w-125">{message}</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => router.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>

        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
        {children}
      </div>
    </div>
  )
}
