import { createFileRoute } from '@tanstack/react-router'
import { MateriaCard } from './MateriaCard';
import type { Materia } from './MateriaCard'; // Agregamos 'type' aquí

export const Route = createFileRoute('/planes2/$planId/mapa')({
  component: MapaCurricular,
})

const CICLOS = ["Ciclo 1", "Ciclo 2", "Ciclo 3", "Ciclo 4", "Ciclo 5", "Ciclo 6", "Ciclo 7", "Ciclo 8", "Ciclo 9"];
const LINEAS = ["Formación Básica", "Ciencias de la Computación", "Desarrollo de Software", "Redes y Seguridad", "Gestión y Profesionalización"];

// Ejemplo de materia
const MATERIAS: Materia[] = [
  {
    id: "1",
    clave: 'MAT101',
    nombre: 'Cálculo Diferencial',
    creditos: 8,
    hd: 4,
    hi: 4,
    ciclo: 1,
    linea: 'Formación Básica',
    tipo: 'Obligatoria',
    estado: 'Aprobada',
  },
  {
    id: "2",
    clave: 'FIS101',
    nombre: 'Física Mecánica',
    creditos: 6,
    hd: 3,
    hi: 3,
    ciclo: 1,
    linea: 'Formación Básica',
    tipo: 'Obligatoria',
    estado: 'Aprobada',
  },
  {
    id: "3",
    clave: 'PRO101',
    nombre: 'Fundamentos de Programación',
    creditos: 8,
    hd: 4,
    hi: 4,
    ciclo: 1,
    linea: 'Ciencias de la Computación',
    tipo: 'Obligatoria',
    estado: 'Revisada',
  },
  {
    id: "4",
    clave: 'EST101',
    nombre: 'Estructura de Datos',
    creditos: 6,
    hd: 3,
    hi: 3,
    ciclo: 2,
    linea: 'Ciencias de la Computación',
    tipo: 'Obligatoria',
    estado: 'Borrador',
  },
]

function MapaCurricular() {
  return (
    <div className="p-4 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-6">Mapa Curricular</h2>

      {/* Contenedor de la Grid */}
      <div 
        className="grid min-w-[1200px] border-l border-t border-slate-200"
        style={{ 
          // 1 columna para nombres de líneas + 9 ciclos
          gridTemplateColumns: '200px repeat(9, 1fr)',
        }}
      >
        {/* Header: Espacio vacío + Ciclos */}
        <div className="bg-slate-50 p-2 border-r border-b border-slate-200 font-medium text-sm text-slate-500">
          Línea Curricular
        </div>
        {CICLOS.map((ciclo) => (
          <div key={ciclo} className="bg-slate-50 p-2 border-r border-b border-slate-200 text-center font-medium text-sm text-slate-500">
            {ciclo}
          </div>
        ))}

        {/* Filas por cada Línea Curricular */}
        {LINEAS.map((linea) => (
          <>
            {/* Nombre de la línea (Primera columna) */}
            <div className="bg-slate-50 p-3 border-r border-b border-slate-200 flex items-center text-xs font-bold uppercase text-slate-600">
              {linea}
            </div>

            {/* Celdas para cada ciclo en esta línea */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((numCiclo) => (
              <div 
                key={`${linea}-${numCiclo}`} 
                className="p-2 border-r border-b border-slate-100 min-h-[120px] bg-white/50"
              >
                {/* Filtrar materias que pertenecen a esta posición */}
                {MATERIAS.filter(m => m.linea === linea && m.ciclo === numCiclo).map((materia) => (
                <MateriaCard key={materia.id} materia={materia} />
              ))}
              </div>
            ))}
          </>
        ))}
      </div>

      {/* Sección de materias sin asignar (como en tu imagen) */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Materias sin asignar</h3>
        <div className="flex gap-4">
           <div className="p-3 border rounded-lg bg-slate-50 border-dashed border-slate-300 w-48 text-[10px]">
              <div className="font-bold">Inglés Técnico</div>
              <div className="text-slate-500">4 cr • HD: 2 • HI: 2</div>
           </div>
        </div>
      </div>
    </div>
  )
}