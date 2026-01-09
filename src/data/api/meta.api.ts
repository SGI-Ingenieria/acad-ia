import { supabaseBrowser } from "../supabase/client";
import { throwIfError } from "./_helpers";
import type { Carrera, EstadoPlan, EstructuraAsignatura, EstructuraPlan, Facultad } from "../types/domain";

export async function facultades_list(): Promise<Facultad[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("facultades")
    .select("id,nombre,nombre_corto,color,icono,creado_en,actualizado_en")
    .order("nombre", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function carreras_list(params?: { facultadId?: string | null }): Promise<Carrera[]> {
  const supabase = supabaseBrowser();

  let q = supabase
    .from("carreras")
    .select(
      "id,facultad_id,nombre,nombre_corto,clave_sep,activa,creado_en,actualizado_en, facultades(id,nombre,nombre_corto,color,icono)"
    )
    .order("nombre", { ascending: true });

  if (params?.facultadId) q = q.eq("facultad_id", params.facultadId);

  const { data, error } = await q;
  throwIfError(error);
  return data ?? [];
}

export async function estructuras_plan_list(params?: { nivel?: string | null }): Promise<EstructuraPlan[]> {
  const supabase = supabaseBrowser();

  // Nota: en tu DDL no hay "nivel" en estructuras_plan; si luego lo agregas, filtra aquí.
  const { data, error } = await supabase
    .from("estructuras_plan")
    .select("id,nombre,tipo,version,definicion")
    .order("nombre", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function estructuras_asignatura_list(): Promise<EstructuraAsignatura[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("estructuras_asignatura")
    .select("id,nombre,version,definicion")
    .order("nombre", { ascending: true });

  throwIfError(error);
  return data ?? [];
}

export async function estados_plan_list(): Promise<EstadoPlan[]> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("estados_plan")
    .select("id,clave,etiqueta,orden,es_final")
    .order("orden", { ascending: true });

  throwIfError(error);
  return data ?? [];
}
