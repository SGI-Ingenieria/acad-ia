import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, X, Info } from 'lucide-react';
export type Materia = {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
  hd: number; // Horas Docente
  hi: number; // Horas Independientes
  tipo: 'Obligatoria' | 'Optativa' | 'Especialidad';
  ciclo: number;
  linea: string;
  estado: string;
};

interface MateriaCardProps {
  materia: Materia;
}

export function MateriaCard({ materia }: MateriaCardProps) {
  return (
    <Dialog.Root>
      {/* Trigger: La tarjeta en sí misma */}
      <Dialog.Trigger asChild>
        <div className="group relative flex flex-col p-2 mb-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer select-none">
          {/* Header de la tarjeta */}
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{materia.clave}</span>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-bold uppercase">
                {materia.tipo === 'Obligatoria' ? 'OB' : 'OP'}
              </span>
            </div>
          </div>

          {/* Nombre */}
          <h4 className="text-[11px] font-semibold text-slate-800 leading-tight mb-2 min-h-[2rem]">
            {materia.nombre}
          </h4>

          {/* Footer de la tarjeta (Créditos y Horas) */}
          <div className="flex justify-between items-center text-[9px] text-slate-500 border-t pt-1 border-slate-50">
            <span>{materia.creditos} cr</span>
            <div className="flex gap-1">
              <span>HD:{materia.hd}</span>
              <span>HI:{materia.hi}</span>
            </div>
          </div>
          
          {/* Overlay de Hover (Opcional: un iconito de editar) */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-3 h-3 text-emerald-600" />
          </div>
        </div>
      </Dialog.Trigger>

      {/* Modal / Portal */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-50 border border-slate-200 animate-in zoom-in-95">
          
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-lg font-bold text-slate-800">Editar Materia</Dialog.Title>
            <Dialog.Close className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form className="space-y-4">
            {/* Clave y Nombre */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Clave</label>
                <input 
                  defaultValue={materia.clave}
                  className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre</label>
                <input 
                  defaultValue={materia.nombre}
                  className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            {/* Créditos y Horas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase italic">Créditos</label>
                <input type="number" defaultValue={materia.creditos} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase italic">HD (Hrs Docente)</label>
                <input type="number" defaultValue={materia.hd} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase italic">HI (Hrs Indep.)</label>
                <input type="number" defaultValue={materia.hi} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
            </div>

            {/* Ciclo y Línea */}
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Ciclo</label>
                <select className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                  <option>Ciclo {materia.ciclo}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Línea Curricular</label>
                <select className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                  <option>{materia.linea}</option>
                </select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6">
              <Dialog.Close className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancelar
              </Dialog.Close>
              <button 
                type="button"
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}