import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  ChevronDown, 
  AlertTriangle, 
  GripVertical,
  Trash2
} from 'lucide-react'
import type { Materia, LineaCurricular } from '@/types/plan'
import { Button } from '@/components/ui/button'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlanAsignaturas, usePlanLineas } from '@/data';


export const Route = createFileRoute('/planes/$planId/_detalle/mapa')({
  component: MapaCurricularPage,
})



const lineColors = [
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-purple-50 border-purple-200 text-purple-700',
  'bg-orange-50 border-orange-200 text-orange-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
];

const statusBadge: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  revisada: 'bg-amber-100 text-amber-700',
  aprobada: 'bg-emerald-100 text-emerald-700',
};

// --- Subcomponentes ---
function StatItem({ label, value, total }: { label: string, value: number, total?: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}:</span>
      <span className="text-sm font-bold text-slate-700">
        {value}{total ? <span className="text-slate-400 font-normal">/{total}</span> : ''}
      </span>
    </div>
  )
}

function MateriaCardItem({ materia, onDragStart, isDragging, onClick }: { 
  materia: Materia, 
  onDragStart: (e: React.DragEvent, id: string) => void,
  isDragging: boolean,
  onClick: () => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, materia.id)}
      onClick={onClick}
      className={`group p-3 rounded-lg border bg-white shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'hover:border-teal-400 hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-[10px] font-mono font-bold text-slate-400">{materia.clave}</span>
        <Badge variant="outline" className={`text-[9px] px-1 py-0 uppercase ${statusBadge[materia.estado] || ''}`}>
          {materia.estado}
        </Badge>
      </div>
      <p className="text-xs font-bold text-slate-700 leading-tight mb-1">{materia.nombre}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-500">{materia.creditos} CR • HD:{materia.hd} • HI:{materia.hi}</span>
        <GripVertical size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// --- Componente Principal ---
function MapaCurricularPage() {
  

  const { data: asignaturas, isFetching: loadingAsig } = usePlanAsignaturas('0e0aea4d-b8b4-4e75-8279-6224c3ac769f');
  const { data: lineas2, isFetching: loadingLineas } = usePlanLineas('0e0aea4d-b8b4-4e75-8279-6224c3ac769f');
  console.log(asignaturas);
  console.log(lineas2);
  // --- Constantes de Estilo y Datos ---
const INITIAL_LINEAS: LineaCurricular[] = [
  { id: 'l1', nombre: 'Formación Básica', orden: 1 },
  { id: 'l2', nombre: 'Ciencias de la Computación', orden: 2 },
];

const INITIAL_MATERIAS: Materia[] = [
  { id: "1", clave: 'MAT101', nombre: 'Cálculo Diferencial', creditos: 8, hd: 4, hi: 4, ciclo: 1, lineaCurricularId: 'l1', tipo: 'obligatoria', estado: 'aprobada' },
  { id: "2", clave: 'FIS101', nombre: 'Física Mecánica', creditos: 6, hd: 3, hi: 3, ciclo: 1, lineaCurricularId: 'l1', tipo: 'obligatoria', estado: 'aprobada' },
  { id: "3", clave: 'PRO101', nombre: 'Fundamentos de Programación', creditos: 8, hd: 4, hi: 4, ciclo: null, lineaCurricularId: null, tipo: 'obligatoria', estado: 'borrador' },
];

  const [materias, setMaterias] = useState<Materia[]>(INITIAL_MATERIAS);
  const [lineas, setLineas] = useState<LineaCurricular[]>(INITIAL_LINEAS);
  const [draggedMateria, setDraggedMateria] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);
  
  const ciclosTotales = 9;
  const ciclosArray = Array.from({ length: ciclosTotales }, (_, i) => i + 1);

  const mapLineasToLineaCurricular = (lineasApi = []): LineaCurricular[] => {
  return lineasApi.map((linea: any) => ({
    id: linea.id,
    nombre: linea.nombre,
    orden: linea.orden ?? 0,
    color: '#1976d2', // default aceptado
  }));
};

const mapAsignaturasToMaterias = (asigApi = []): Materia[] => {
  return asigApi.map((asig: any) => ({
    id: asig.id,
    clave: asig.codigo,
    nombre: asig.nombre,
    creditos: asig.creditos ?? 0,
    ciclo: asig.numero_ciclo ?? null,
    lineaCurricularId: asig.linea_plan_id ?? null,
    tipo: asig.tipo === 'OBLIGATORIA' ? 'obligatoria' : 'optativa',
    estado: 'borrador', // default válido
    orden: asig.orden_celda ?? 0,
    hd: Math.floor((asig.horas_semana ?? 0) / 2),
    hi: Math.ceil((asig.horas_semana ?? 0) / 2),
  }));
};

const lineasFinales: LineaCurricular[] = useMemo(() => {
  return [
    ...INITIAL_LINEAS,
    ...mapLineasToLineaCurricular(lineas2),
  ];
}, [lineas2]);

const materiasFinales: Materia[] = useMemo(() => {
  return [
    ...INITIAL_MATERIAS,
    ...mapAsignaturasToMaterias(asignaturas),
  ];
}, [asignaturas]);


  // --- Lógica de Gestión ---
  const agregarLinea = (nombre: string) => {
    const nueva = { id: crypto.randomUUID(), nombre, orden: lineas.length + 1 };
    setLineas([...lineas, nueva]);
  };

  const borrarLinea = (id: string) => {
    setMaterias(prev => prev.map(m => m.lineaCurricularId === id ? { ...m, ciclo: null, lineaCurricularId: null } : m));
    setLineas(prev => prev.filter(l => l.id !== id));
  };

  const getTotalesCiclo = (ciclo: number) => {
    return materias.filter(m => m.ciclo === ciclo).reduce((acc, m) => ({
      cr: acc.cr + (m.creditos || 0), hd: acc.hd + (m.hd || 0), hi: acc.hi + (m.hi || 0)
    }), { cr: 0, hd: 0, hi: 0 });
  };

  const getSubtotalLinea = (lineaId: string) => {
    return materias.filter(m => m.lineaCurricularId === lineaId && m.ciclo !== null).reduce((acc, m) => ({
      cr: acc.cr + (m.creditos || 0), hd: acc.hd + (m.hd || 0), hi: acc.hi + (m.hi || 0)
    }), { cr: 0, hd: 0, hi: 0 });
  };

  // --- Handlers Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedMateria(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, ciclo: number | null, lineaId: string | null) => {
    e.preventDefault();
    if (draggedMateria) {
      setMaterias(prev => prev.map(m => m.id === draggedMateria ? { ...m, ciclo, lineaCurricularId: lineaId } : m));
      setDraggedMateria(null);
    }
  };

  // --- Estadísticas Generales ---
  const stats = materias.reduce((acc, m) => {
    if (m.ciclo !== null) {
      acc.cr += m.creditos || 0; acc.hd += m.hd || 0; acc.hi += m.hi || 0;
    }
    return acc;
  }, { cr: 0, hd: 0, hi: 0 });

  return (
    <div className="container mx-auto px-2 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Mapa Curricular</h2>
          <p className="text-sm text-slate-500">Organiza las materias por línea curricular y ciclo</p>
        </div>
        <div className="flex items-center gap-3">
          {materias.filter(m => !m.ciclo).length > 0 && (
            <Badge className="bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-50">
              <AlertTriangle size={14} className="mr-1" /> {materias.filter(m => !m.ciclo).length} materias sin asignar
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-teal-700 hover:bg-teal-800 text-white">
                <Plus size={16} className="mr-2" /> Agregar <ChevronDown size={14} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => agregarLinea("Nueva Línea")}>Nueva Línea Curricular</DropdownMenuItem>
              <DropdownMenuItem onClick={() => agregarLinea("Área Común")}>Agregar Área Común</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barra Totales */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 mb-8 flex gap-10">
        <StatItem label="Total Créditos" value={stats.cr} total={320} />
        <StatItem label="Total HD" value={stats.hd} />
        <StatItem label="Total HI" value={stats.hi} />
        <StatItem label="Total Horas" value={stats.hd + stats.hi} />
      </div>

      {/* Grid Principal */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[1500px]">
          {/* Header Ciclos */}
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px` }}>
            <div className="text-xs font-bold text-slate-400 self-end px-2">LÍNEA CURRICULAR</div>
            {ciclosArray.map(n => <div key={n} className="bg-slate-100 rounded-lg p-2 text-center text-sm font-bold text-slate-600">Ciclo {n}</div>)}
            <div className="text-xs font-bold text-slate-400 self-end text-center">SUBTOTAL</div>
          </div>

          {/* Filas por Línea */}
          {lineasFinales.map((linea, idx) => {
            const sub = getSubtotalLinea(linea.id);
            return (
              <div key={linea.id} className="grid gap-3 mb-3" style={{ gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px` }}>
                <div className={`p-4 rounded-xl border-l-4 flex justify-between items-center ${lineColors[idx % lineColors.length]}`}>
                  <span className="text-xs font-bold">{linea.nombre}</span>
                  <Trash2 size={14} className="text-slate-400 hover:text-red-500 cursor-pointer" onClick={() => borrarLinea(linea.id)} />
                </div>

                {ciclosArray.map(ciclo => (
                  <div
                    key={ciclo}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, ciclo, linea.id)}
                    className="min-h-[140px] p-2 rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/20 space-y-2"
                  >
                    {materiasFinales.filter(m => m.ciclo === ciclo && m.lineaCurricularId === linea.id).map(m => (
                      <MateriaCardItem key={m.id} materia={m} isDragging={draggedMateria === m.id} onDragStart={handleDragStart} onClick={() => { setSelectedMateria(m); setIsEditModalOpen(true); }} />
                    ))}
                  </div>
                ))}

                <div className="p-4 bg-slate-50 rounded-xl flex flex-col justify-center text-[10px] text-slate-500 font-medium border border-slate-100">
                   <div>Cr: {sub.cr}</div><div>HD: {sub.hd}</div><div>HI: {sub.hi}</div>
                </div>
              </div>
            )
          })}

          {/* Fila Totales Ciclo */}
          <div className="grid gap-3 mt-6 border-t pt-4" style={{ gridTemplateColumns: `220px repeat(${ciclosTotales}, 1fr) 120px` }}>
            <div className="p-2 font-bold text-slate-600">Totales por Ciclo</div>
            {ciclosArray.map(ciclo => {
              const t = getTotalesCiclo(ciclo);
              return (
                <div key={ciclo} className="text-[10px] text-center p-2 bg-slate-50 rounded-lg">
                  <div className="font-bold text-slate-700">Cr: {t.cr}</div>
                  <div>HD: {t.hd} • HI: {t.hi}</div>
                </div>
              )
            })}
            <div className="bg-teal-50 rounded-lg p-2 text-center text-teal-800 font-bold text-xs flex flex-col justify-center">
              <div>{stats.cr} Cr</div><div>{stats.hd + stats.hi} Hrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Editar Materia</DialogTitle></DialogHeader>
          {selectedMateria && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Clave</label><Input defaultValue={selectedMateria.clave} /></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Nombre</label><Input defaultValue={selectedMateria.nombre} /></div>
              <div className="space-y-2"><label className="text-xs font-bold uppercase">Créditos</label><Input type="number" defaultValue={selectedMateria.creditos} /></div>
              <div className="flex gap-2">
                <div className="space-y-2"><label className="text-xs font-bold uppercase">HD</label><Input type="number" defaultValue={selectedMateria.hd} /></div>
                <div className="space-y-2"><label className="text-xs font-bold uppercase">HI</label><Input type="number" defaultValue={selectedMateria.hi} /></div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button className="bg-teal-700 text-white">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

          {/* 4. Materias Pendientes (Sin Asignar) */}
      {materias.filter(m => m.ciclo === null).length > 0 && (
        <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4 text-amber-600">
            <AlertTriangle size={20} />
            <h3 className="font-bold text-sm uppercase tracking-tight">
              Materias pendientes de asignar ({materias.filter(m => m.ciclo === null).length})
            </h3>
          </div>
          
          <div 
            className={`flex flex-wrap gap-4 min-h-[100px] p-4 rounded-xl border-2 border-dashed transition-all ${
              draggedMateria ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white/50'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null, null)} // null devuelve la materia al estado "sin asignar"
          >
            {materias
              .filter(m => m.ciclo === null)
              .map(m => (
                <div key={m.id} className="w-[200px]">
                  <MateriaCardItem 
                    materia={m} 
                    isDragging={draggedMateria === m.id} 
                    onDragStart={handleDragStart} 
                    onClick={() => { setSelectedMateria(m); setIsEditModalOpen(true); }} 
                  />
                </div>
              ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400 italic text-center">
            Arrastra las materias desde aquí hacia cualquier ciclo y línea del mapa curricular.
          </p>
        </div>
      )}
    </div>
  )
}