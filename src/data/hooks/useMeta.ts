import { useQuery } from "@tanstack/react-query";
import { qk } from "../query/keys";
import {
  carreras_list,
  estados_plan_list,
  estructuras_asignatura_list,
  estructuras_plan_list,
  facultades_list,
} from "../api/meta.api";

export function useFacultades() {
  return useQuery({
    queryKey: qk.facultades(),
    queryFn: facultades_list,
    staleTime: 5 * 60_000,
  });
}

export function useCarreras(params?: { facultadId?: string | null }) {
  return useQuery({
    queryKey: qk.carreras(params?.facultadId ?? null),
    queryFn: () => carreras_list(params),
    staleTime: 5 * 60_000,
  });
}

export function useEstructurasPlan(params?: { nivel?: string | null }) {
  return useQuery({
    queryKey: qk.estructurasPlan(params?.nivel ?? null),
    queryFn: () => estructuras_plan_list(params),
    staleTime: 10 * 60_000,
  });
}

export function useEstructurasAsignatura() {
  return useQuery({
    queryKey: qk.estructurasAsignatura(),
    queryFn: estructuras_asignatura_list,
    staleTime: 10 * 60_000,
  });
}

export function useEstadosPlan() {
  return useQuery({
    queryKey: qk.estadosPlan(),
    queryFn: estados_plan_list,
    staleTime: 10 * 60_000,
  });
}
