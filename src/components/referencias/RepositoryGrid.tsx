/* eslint-disable import/order */
import { Check,  Folder, Plus, Settings, Users, Lock } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { FileTableDetailed } from "./FileTableDetailed"
import { cn } from "@/lib/utils"

// Mock de datos para prototipado
const repos = [
  { id: 1, title: 'Programación Orientada a Objetos', type: 'Materia', files: ['Metodologias.docx', 'Eval.pdf'] },
  // ...
]

export function RepositoryGrid() {
  return (
    <div className="grid grid-cols-[350px_1fr] gap-6 h-[calc(100vh-200px)]">
      {/* Columna Izquierda: Lista de Repositorios */}
      <ScrollArea className="pr-4 border-r">
        <div className="space-y-6">
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Mis Repositorios</h4>
            <div className="space-y-2">
              <RepoSidebarItem title="Mis referencias - Sistemas" count={15} status="Listo" active />
              <RepoSidebarItem title="Bibliografía Especializada" count={23} status="Error" />
            </div>
          </section>
          
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Compartidos</h4>
            <div className="space-y-2">
              <RepoSidebarItem title="Marco Curricular Nacional" count={12} status="Listo" shared />
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Columna Derecha: Detalle del Repositorio seleccionado */}
      <div className="space-y-6 bg-white rounded-xl border p-6 shadow-sm">
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading">Mis referencias - Sistemas</h2>
              <Lock className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="w-3 h-3 mr-1" /> Listo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Documentos personales para el programa de Sistemas</p>
            <div className="text-xs text-muted-foreground flex gap-2">
              <span>Propósito: Generación de materias</span>
              <span>•</span>
              <span>Actualizado hace alrededor de 2 años</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2"/> Configuración</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2"/> Agregar archivos</Button>
          </div>
        </header>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Archivos en este repositorio (1)</h3>
          <FileTableDetailed />
        </div>
      </div>
    </div>
  )
}


function RepoSidebarItem({ title, count, status, active, shared }: any) {
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all cursor-pointer",
      active ? "border-blue-500 bg-blue-50/30" : "hover:border-slate-300"
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white">
          <Folder className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate">{title}</p>
            {shared ? <Users className="w-3 h-3 text-muted-foreground" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mb-3">{count} archivos</p>
          
          <div className="flex justify-between items-center">
             <StatusBadge status={status} />
             <span className="text-[10px] text-muted-foreground">hace 2 años</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Listo: "bg-green-100 text-green-700 border-green-200",
    Error: "bg-red-100 text-red-700 border-red-200",
    Procesando: "bg-orange-100 text-orange-700 border-orange-200"
  }
  return (
    <Badge variant="outline" className={cn("px-2 py-0 h-5 text-[10px]", styles[status])}>
      {status === 'Listo' && <Check className="w-2 h-2 mr-1" />}
      {status}
    </Badge>
  )
}