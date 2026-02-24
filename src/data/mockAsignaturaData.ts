import type {
  Asignatura,
  AsignaturaStructure,
  UnidadTematica,
  BibliografiaEntry,
  CambioAsignatura,
  DocumentoAsignatura,
} from '@/types/asignatura'

export const mockAsignatura: Asignatura = {
  id: '1',
  nombre: 'Inteligencia Artificial Aplicada',
  clave: 'IAA-401',
  creditos: 8,
  lineaCurricular: 'Sistemas Inteligentes',
  ciclo: '7° Semestre',
  planId: 'plan-1',
  planNombre: 'Licenciatura en Ingeniería en Sistemas Computacionales 2024',
  carrera: 'Ingeniería en Sistemas Computacionales',
  facultad: 'Facultad de Ingeniería',
  estructuraId: 'estructura-1',
}

export const mockEstructura: AsignaturaStructure = {
  id: 'estructura-1',
  nombre: 'Plantilla SEP Licenciatura',
  campos: [
    {
      id: 'objetivo_general',
      nombre: 'Objetivo General',
      tipo: 'texto_largo',
      obligatorio: true,
      descripcion: 'Describe el propósito principal de la asignatura',
      placeholder: 'Al finalizar el curso, el estudiante será capaz de...',
    },
    {
      id: 'competencias',
      nombre: 'Competencias a Desarrollar',
      tipo: 'texto_largo',
      obligatorio: true,
      descripcion: 'Competencias profesionales que se desarrollarán',
    },
    {
      id: 'justificacion',
      nombre: 'Justificación',
      tipo: 'texto_largo',
      obligatorio: true,
      descripcion: 'Relevancia de la asignatura en el plan de estudios',
    },
    {
      id: 'requisitos',
      nombre: 'Requisitos / Seriación',
      tipo: 'texto',
      obligatorio: false,
      descripcion: 'Asignaturas previas requeridas',
    },
    {
      id: 'estrategias_didacticas',
      nombre: 'Estrategias Didácticas',
      tipo: 'texto_largo',
      obligatorio: true,
      descripcion: 'Métodos de enseñanza-aprendizaje',
    },
    {
      id: 'evaluacion',
      nombre: 'Sistema de Evaluación',
      tipo: 'texto_largo',
      obligatorio: true,
      descripcion: 'Criterios y porcentajes de evaluación',
    },
    {
      id: 'perfil_docente',
      nombre: 'Perfil del Docente',
      tipo: 'texto_largo',
      obligatorio: false,
      descripcion: 'Características requeridas del profesor',
    },
  ],
}

export const mockDatosGenerales: Record<string, any> = {
  objetivo_general:
    'Formar profesionales capaces de diseñar, implementar y evaluar sistemas de inteligencia artificial que resuelvan problemas complejos del mundo real, aplicando principios éticos y metodologías actuales en el campo.',
  competencias:
    '• Diseñar algoritmos de machine learning para clasificación y predicción\n• Implementar redes neuronales profundas para procesamiento de imágenes y texto\n• Evaluar y optimizar modelos de IA considerando métricas de rendimiento\n• Aplicar principios éticos en el desarrollo de sistemas inteligentes',
  justificacion:
    'La inteligencia artificial es una de las tecnologías más disruptivas del siglo XXI. Su integración en diversos sectores demanda profesionales con sólidas bases teóricas y prácticas. Esta asignatura proporciona las competencias necesarias para que el egresado pueda innovar y contribuir al desarrollo tecnológico del país.',
  requisitos:
    'Programación Avanzada (PAV-301), Matemáticas Discretas (MAT-201)',
  estrategias_didacticas:
    '• Aprendizaje basado en proyectos\n• Talleres prácticos con datasets reales\n• Exposiciones y discusiones grupales\n• Análisis de casos de estudio\n• Desarrollo de prototipo integrador',
  evaluacion:
    '• Exámenes parciales: 30%\n• Proyecto integrador: 35%\n• Prácticas de laboratorio: 20%\n• Participación y tareas: 15%',
  perfil_docente:
    'Profesional con maestría o doctorado en áreas afines a la inteligencia artificial, con experiencia mínima de 3 años en docencia y desarrollo de proyectos de IA.',
}

export const mockContenidoTematico: Array<UnidadTematica> = [
  {
    id: 'unidad-1',
    nombre: 'Fundamentos de Inteligencia Artificial',
    numero: 1,
    temas: [
      {
        id: 'tema-1-1',
        nombre: 'Historia y evolución de la IA',
        descripcion: 'Desde los orígenes hasta la actualidad',
        horasEstimadas: 2,
      },
      {
        id: 'tema-1-2',
        nombre: 'Tipos de IA y aplicaciones',
        descripcion: 'IA débil, fuerte y superinteligencia',
        horasEstimadas: 3,
      },
      {
        id: 'tema-1-3',
        nombre: 'Ética en IA',
        descripcion: 'Consideraciones éticas y responsabilidad',
        horasEstimadas: 2,
      },
    ],
  },
  {
    id: 'unidad-2',
    nombre: 'Machine Learning',
    numero: 2,
    temas: [
      {
        id: 'tema-2-1',
        nombre: 'Aprendizaje supervisado',
        descripcion: 'Regresión y clasificación',
        horasEstimadas: 6,
      },
      {
        id: 'tema-2-2',
        nombre: 'Aprendizaje no supervisado',
        descripcion: 'Clustering y reducción de dimensionalidad',
        horasEstimadas: 5,
      },
      {
        id: 'tema-2-3',
        nombre: 'Evaluación de modelos',
        descripcion: 'Métricas y validación cruzada',
        horasEstimadas: 4,
      },
    ],
  },
  {
    id: 'unidad-3',
    nombre: 'Deep Learning',
    numero: 3,
    temas: [
      {
        id: 'tema-3-1',
        nombre: 'Redes neuronales artificiales',
        descripcion: 'Perceptrón y backpropagation',
        horasEstimadas: 5,
      },
      {
        id: 'tema-3-2',
        nombre: 'Redes convolucionales (CNN)',
        descripcion: 'Procesamiento de imágenes',
        horasEstimadas: 6,
      },
      {
        id: 'tema-3-3',
        nombre: 'Redes recurrentes (RNN)',
        descripcion: 'Procesamiento de secuencias',
        horasEstimadas: 5,
      },
      {
        id: 'tema-3-4',
        nombre: 'Transformers y atención',
        descripcion: 'Arquitecturas modernas',
        horasEstimadas: 6,
      },
    ],
  },
  {
    id: 'unidad-4',
    nombre: 'Aplicaciones Prácticas',
    numero: 4,
    temas: [
      {
        id: 'tema-4-1',
        nombre: 'Procesamiento de lenguaje natural',
        descripcion: 'NLP y chatbots',
        horasEstimadas: 6,
      },
      {
        id: 'tema-4-2',
        nombre: 'Visión por computadora',
        descripcion: 'Detección y reconocimiento',
        horasEstimadas: 5,
      },
      {
        id: 'tema-4-3',
        nombre: 'Sistemas de recomendación',
        descripcion: 'Filtrado colaborativo y contenido',
        horasEstimadas: 4,
      },
    ],
  },
]

export const mockBibliografia: Array<BibliografiaEntry> = [
  {
    id: 'bib-1',
    tipo: 'BASICA',
    cita: 'Russell, S., & Norvig, P. (2021). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.',
    fuenteBibliotecaId: 'lib-1',
    fuenteBiblioteca: {
      id: 'lib-1',
      titulo: 'Artificial Intelligence: A Modern Approach',
      autor: 'Stuart Russell, Peter Norvig',
      editorial: 'Pearson',
      anio: 2021,
      isbn: '978-0134610993',
      tipo: 'libro',
      disponible: true,
    },
  },
  {
    id: 'bib-2',
    tipo: 'BASICA',
    cita: "Géron, A. (2022). Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow (3rd ed.). O'Reilly Media.",
    fuenteBibliotecaId: 'lib-2',
    fuenteBiblioteca: {
      id: 'lib-2',
      titulo:
        'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
      autor: 'Aurélien Géron',
      editorial: "O'Reilly Media",
      anio: 2022,
      isbn: '978-1098125974',
      tipo: 'libro',
      disponible: true,
    },
  },
  {
    id: 'bib-3',
    tipo: 'COMPLEMENTARIA',
    cita: 'Goodfellow, I., Bengio, Y., & Courville, A. (2016). Deep Learning. MIT Press.',
  },
  {
    id: 'bib-4',
    tipo: 'COMPLEMENTARIA',
    cita: 'Chollet, F. (2021). Deep Learning with Python (2nd ed.). Manning Publications.',
    fuenteBibliotecaId: 'lib-4',
    fuenteBiblioteca: {
      id: 'lib-4',
      titulo: 'Deep Learning with Python',
      autor: 'François Chollet',
      editorial: 'Manning Publications',
      anio: 2021,
      isbn: '978-1617296864',
      tipo: 'libro',
      disponible: false,
    },
  },
]

export const mockHistorial: Array<CambioAsignatura> = [
  {
    id: 'cambio-1',
    tipo: 'datos',
    descripcion: 'Actualización del objetivo general',
    usuario: 'Dr. Carlos Méndez',
    fecha: new Date('2024-12-10T14:30:00'),
    detalles: { campo: 'objetivo_general' },
  },
  {
    id: 'cambio-2',
    tipo: 'contenido',
    descripcion: 'Agregada Unidad 4: Aplicaciones Prácticas',
    usuario: 'Dr. Carlos Méndez',
    fecha: new Date('2024-12-09T10:15:00'),
    detalles: { unidad: 'Unidad 4' },
  },
  {
    id: 'cambio-3',
    tipo: 'ia',
    descripcion: 'IA mejoró las competencias a desarrollar',
    usuario: 'Dra. María López',
    fecha: new Date('2024-12-08T16:45:00'),
    detalles: { campo: 'competencias', accion: 'mejora' },
  },
  {
    id: 'cambio-4',
    tipo: 'bibliografia',
    descripcion: 'Añadida referencia: Deep Learning with Python',
    usuario: 'Biblioteca Central',
    fecha: new Date('2024-12-07T09:00:00'),
  },
  {
    id: 'cambio-5',
    tipo: 'documento',
    descripcion: 'Documento SEP regenerado (versión 3)',
    usuario: 'Sistema',
    fecha: new Date('2024-12-06T11:30:00'),
  },
]

export const mockDocumentoSep: DocumentoAsignatura = {
  id: 'doc-1',
  asignaturaId: '1',
  version: 3,
  fechaGeneracion: new Date('2024-12-06T11:30:00'),
  estado: 'listo',
}
