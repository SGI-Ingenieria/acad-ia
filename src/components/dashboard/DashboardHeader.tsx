import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface DashboardHeaderProps {
  name: string
  role: string
  department: string
  greeting?: string
}

export default function DashboardHeader({
  name,
  role,
  department,
  greeting = 'Buenas noches,',
}: DashboardHeaderProps) {
  // Generamos la URL de DiceBear dinámicamente con el nombre
  const dicebearUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`

  // Calculamos iniciales de respaldo por si falla la imagen
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border p-6 shadow-md md:flex-row md:items-center">
      <div className="flex flex-row items-center gap-4">
        {/* 1. Avatar de DiceBear usando el componente de Shadcn */}
        <Avatar className="border-background h-12 w-12 border-2 shadow-sm">
          <AvatarImage src={dicebearUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          {/* Saludo con texto secundario */}
          <p className="text-muted-foreground text-sm">{greeting}</p>

          {/* Nombre destacado */}
          <h2 className="text-foreground text-lg font-bold tracking-tight">
            {name}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {/* 2. El "Banner" (Badge) para el puesto */}
            <Badge
              variant="secondary"
              className="rounded-md px-2 py-0 text-xs font-semibold"
            >
              {role}
            </Badge>

            {/* Departamento */}
            <span className="text-muted-foreground text-xs font-medium">
              {department}
            </span>
          </div>
        </div>
      </div>
      <div className="xs:flex-nowrap flex flex-row flex-wrap gap-6">
        <div className="bg-muted flex flex-row items-center gap-3 rounded-lg px-4 py-2">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            Icono
          </div>
          <div>
            <p>4</p>
            <p>Planes activos</p>
          </div>
        </div>
        <div className="bg-muted flex flex-row items-center gap-3 rounded-lg px-4 py-2">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-sm">
            Icono
          </div>
          <div>
            <p>3</p>
            <p>Revisiones pendientes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
