import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function FileTableDetailed() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="w-[400px]">Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tamaño</TableHead>
            <TableHead>Subido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="group cursor-pointer hover:bg-slate-50">
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm">Metodologias_Activas.docx</div>
                  <div className="text-xs text-muted-foreground font-normal">Compilación de metodologías de enseñanza...</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="font-mono text-[10px]">DOCX</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">664.1 KB</TableCell>
            <TableCell className="text-sm text-muted-foreground">27 feb 2024</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}