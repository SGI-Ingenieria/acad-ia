export type PlanesListaSearch = {
  q: string
  facultad: string
  carrera: string
  estado: string
  page: number
}

export const defaultPlanesSearch: PlanesListaSearch = {
  q: '',
  facultad: 'todas',
  carrera: 'todas',
  estado: 'todos',
  page: 0,
}
