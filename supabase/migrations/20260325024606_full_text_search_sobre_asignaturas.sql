-- Paso 1
drop text search configuration if exists public.es_simple_unaccent cascade;

create text search configuration public.es_simple_unaccent (copy = pg_catalog.simple);

alter text search configuration public.es_simple_unaccent
  alter mapping for hword, hword_part, word
  with unaccent, simple;

-- Paso 2
alter table public.asignaturas
add column if not exists search_vector tsvector;

-- Paso 3
create or replace function public.fn_asignaturas_update_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
      setweight(
        to_tsvector('public.es_simple_unaccent', coalesce(new.nombre, '')),
        'A'
      )
      ||
      setweight(
        to_tsvector('public.es_simple_unaccent', coalesce(new.codigo, '')),
        'A'
      )
      ||
      setweight(
        to_tsvector('public.es_simple_unaccent', coalesce(new.datos, '{}'::jsonb)::text),
        'B'
      )
      ||
      setweight(
        to_tsvector('public.es_simple_unaccent', coalesce(new.contenido_tematico, '[]'::jsonb)::text),
        'B'
      );

  return new;
end;
$$;

-- Paso 4
drop trigger if exists trg_asignaturas_search_vector on public.asignaturas;

create trigger trg_asignaturas_search_vector
before insert or update of nombre, codigo, datos, contenido_tematico
on public.asignaturas
for each row
execute function public.fn_asignaturas_update_search_vector();

-- Paso 5
create or replace function public.recalcular_vectores_asignaturas()
returns void
language sql
as $$
  UPDATE public.asignaturas
  SET search_vector =
      setweight(to_tsvector('public.es_simple_unaccent', coalesce(nombre, '')), 'A') ||
      setweight(to_tsvector('public.es_simple_unaccent', coalesce(codigo, '')), 'A') ||
      setweight(to_tsvector('public.es_simple_unaccent', coalesce(datos, '{}'::jsonb)::text), 'B') ||
      setweight(to_tsvector('public.es_simple_unaccent', coalesce(contenido_tematico, '[]'::jsonb)::text), 'B')
  WHERE id IS NOT NULL;
$$;

-- Paso 6
create index if not exists asignaturas_search_vector_gin_idx
on public.asignaturas
using gin (search_vector);

-- Paso 7
create or replace function public.build_asignaturas_prefix_tsquery(p_search text)
returns tsquery
language plpgsql
stable
as $$
declare
  cleaned text;
  tokens text[];
  query_text text;
begin
  cleaned := trim(coalesce(p_search, ''));

  if cleaned = '' then
    return null;
  end if;

  cleaned := lower(public.unaccent(cleaned));
  cleaned := regexp_replace(cleaned, '[^[:alnum:]\s]+', ' ', 'g');
  cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');

  tokens := regexp_split_to_array(cleaned, '\s+');

  select string_agg(token || ':*', ' & ')
  into query_text
  from unnest(tokens) as token
  where token <> '';

  if query_text is null or query_text = '' then
    return null;
  end if;

  return to_tsquery('public.es_simple_unaccent', query_text);
end;
$$;

-- Paso 8
create or replace function public.search_asignaturas(
  p_search text default '',
  p_facultad_id uuid default null,
  p_carrera_id uuid default null,
  p_plan_estudio_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  plan_estudio_id uuid,
  codigo text,
  nombre text,
  tipo public.tipo_asignatura,
  creditos numeric,
  numero_ciclo integer,
  datos jsonb,
  contenido_tematico jsonb,
  estado public.estado_asignatura,
  rank real,
  total_count bigint -- 👈 Total para la paginación del frontend
)
language plpgsql
stable
as $$
declare
  v_tsq tsquery;
begin
  -- 1. Construimos el query solo si hay texto
  v_tsq := public.build_asignaturas_prefix_tsquery(p_search);

  return query
  select
    a.id,
    a.plan_estudio_id,
    a.codigo,
    a.nombre,
    a.tipo,
    a.creditos,
    a.numero_ciclo,
    a.datos,
    a.contenido_tematico,
    a.estado,
    coalesce(ts_rank(a.search_vector, v_tsq), 0)::real as rank,
    count(*) OVER() as total_count -- 👈 Cuenta total ignorando el LIMIT
  from public.asignaturas a
  -- 2. JOINS para poder filtrar por la jerarquía superior
  left join public.planes_estudio p on a.plan_estudio_id = p.id
  left join public.carreras c on p.carrera_id = c.id
  where
    -- 3. Si no hay búsqueda, trae todo. Si hay búsqueda, usa el FTS
    (v_tsq is null or a.search_vector @@ v_tsq)
    -- 4. Filtros jerárquicos dinámicos
    and (p_plan_estudio_id is null or a.plan_estudio_id = p_plan_estudio_id)
    and (p_carrera_id is null or p.carrera_id = p_carrera_id)
    and (p_facultad_id is null or c.facultad_id = p_facultad_id)
  order by
    (case when v_tsq is not null then ts_rank(a.search_vector, v_tsq) else 0 end) desc,
    a.nombre asc
  limit p_limit
  offset p_offset;
end;
$$;

-- Corrección de bug con triggers
-- 1. Borramos la llave foránea estricta actual
ALTER TABLE public.cambios_asignatura
DROP CONSTRAINT cambios_asignatura_asignatura_id_fkey;

-- 2. La volvemos a crear, pero le decimos que espere al final de la transacción para validar
ALTER TABLE public.cambios_asignatura
ADD CONSTRAINT cambios_asignatura_asignatura_id_fkey
FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id)
DEFERRABLE INITIALLY DEFERRED;