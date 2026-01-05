import { createFileRoute } from '@tanstack/react-router'
import { 
  GitBranch, 
  Edit3, 
  PlusCircle, 
  FileText, 
  RefreshCw, 
  User 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const Route = createFileRoute('/planes2/$planId/historial')({
  component: RouteComponent,
})

function RouteComponent() {
  const historyEvents = [
    {
      id: 1,
      type: 'Cambio de estado',
      user: 'Dr. Juan Pérez',
      description: 'Plan pasado de Borrador a En Revisión',
      date: 'Hace 2 días',
      icon: <GitBranch className="h-4 w-4" />,
      details: { from: 'Borrador', to: 'En Revisión' }
    },
    {
      id: 2,
      type: 'Edición',
      user: 'Lic. María García',
      description: 'Actualizado perfil de egreso',
      date: 'Hace 3 días',
      icon: <Edit3 className="h-4 w-4" />,
    },
    {
      id: 3,
      type: 'Reorganización',
      user: 'Ing. Carlos López',
      description: 'Movida materia BD102 de ciclo 3 a ciclo 4',
      date: 'Hace 5 días',
      icon: <RefreshCw className="h-4 w-4" />,
      details: { from: 'Ciclo 3', to: 'Ciclo 4' }
    },
    {
      id: 4,
      type: 'Creación',
      user: 'Dr. Juan Pérez',
      description: 'Añadida nueva materia: Inteligencia Artificial',
      date: 'Hace 1 semana',
      icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      id: 5,
      type: 'Documento',
      user: 'Lic. María García',
      description: 'Generado documento oficial v1.0',
      date: 'Hace 1 semana',
      icon: <FileText className="h-4 w-4" />,
    }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-800">Historial de Cambios</h1>
        <p className="text-sm text-muted-foreground">Registro de todas las modificaciones realizadas al plan</p>
      </div>

      <div className="relative space-y-0">
        {/* Línea vertical de fondo */}
        <div className="absolute left-9 top-0 bottom-0 w-px bg-slate-200" />

        {historyEvents.map((event) => (
          <div key={event.id} className="relative flex gap-6 pb-8 group">
            
            {/* Indicador con Icono */}
            <div className="relative z-10 flex h-18 flex-col items-center">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-4 border-white bg-slate-100 text-slate-600 shadow-sm group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                {event.icon}
              </div>
            </div>

            {/* Tarjeta de Contenido */}
            <Card className="flex-1 shadow-none border-slate-200 hover:border-teal-200 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{event.type}</span>
                    <Badge variant="outline" className="text-[10px] font-normal py-0">
                      {event.date}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5 border">
                      <AvatarFallback className="text-[8px] bg-slate-50"><User size={10}/></AvatarFallback>
                    </Avatar>
                    {event.user}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3">{event.description}</p>

                {/* Badges de transición (si existen) */}
                {event.details && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-orange-100 text-[10px]">
                      {event.details.from}
                    </Badge>
                    <span className="text-slate-400 text-xs">→</span>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 text-[10px]">
                      {event.details.to}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Evento inicial de creación */}
        <div className="relative flex gap-6 group">
          <div className="relative z-10 flex items-center">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-4 border-white bg-teal-600 text-white shadow-sm">
              <PlusCircle className="h-4 w-4" />
            </div>
          </div>
          <Card className="flex-1 bg-teal-50/30 border-teal-100 shadow-none">
            <CardContent className="p-4">
               <div className="flex items-center justify-between mb-1">
                 <span className="font-bold text-teal-900 text-sm">Creación</span>
                 <span className="text-[10px] text-teal-600 font-medium">14 Ene 2024</span>
               </div>
               <p className="text-sm text-teal-800/80">Plan de estudios creado</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}