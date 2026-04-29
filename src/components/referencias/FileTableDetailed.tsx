import { 
  FileText, 
  MoreVertical, 
  Eye, 
  Download, 
  Edit3, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Clock 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function FileTableDetailed() {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[350px] py-4">Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Subido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="group cursor-pointer hover:bg-slate-50/50 transition-colors">
            {/* Columna Nombre con Icono */}
            <TableCell className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-white transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">Metodologias_Activas.docx</span>
                  <span className="text-xs text-slate-400 font-normal line-clamp-1">
                    Compilación de metodologías de enseñanza-aprendiza...
                  </span>
                </div>
              </div>
            </TableCell>

            {/* Columna Tipo */}
            <TableCell>
              <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 text-slate-600 border-none px-2">
                DOCX
              </Badge>
            </TableCell>

            {/* Columna Tamaño */}
            <TableCell className="text-sm text-slate-500 font-medium">
              664.1 KB
            </TableCell>

            {/* Columna Estado (Indexado/Temporal) */}
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[11px] py-0 h-6">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Indexado
                </Badge>
                <span className="text-[10px] text-slate-400 font-medium">2 repos</span>
              </div>
            </TableCell>

            {/* Columna Subido + Menú Contextual */}
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-600">27 feb 2024</span>
                  <span className="text-[10px] text-slate-400">María García</span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-slate-200 p-1">
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer py-2 px-3">
                      <Eye className="w-4 h-4 text-slate-400" /> Previsualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer py-2 px-3">
                      <Download className="w-4 h-4 text-slate-400" /> Descargar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer py-2 px-3">
                      <Edit3 className="w-4 h-4 text-slate-400" /> Editar metadatos
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer py-2 px-3">
                      <PlusCircle className="w-4 h-4 text-slate-400" /> Agregar a repositorio
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer py-2 px-3 text-red-600 focus:text-red-600 focus:bg-red-50">
                      <Trash2 className="w-4 h-4" /> Descartar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}