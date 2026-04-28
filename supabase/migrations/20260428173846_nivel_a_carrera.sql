CREATE OR REPLACE FUNCTION public.fn_log_cambios_planes_estudio()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
  k text;
  old_val jsonb;
  new_val jsonb;

  v_response_id text;
begin
  v_response_id := nullif(new.meta_origen->>'response_id','');

  -- INSERT -> CREACION
  if tg_op = 'INSERT' then
    insert into public.cambios_plan (
      plan_estudio_id,
      cambiado_por,
      tipo,
      campo,
      valor_anterior,
      valor_nuevo,
      response_id
    )
    values (
      new.id,
      new.creado_por,
      'CREACION'::public.tipo_cambio,
      null,
      null,
      to_jsonb(new),
      null
    );

    return new;
  end if;

  -- DELETE (opcional): si no lo quieres, bórralo
  if tg_op = 'DELETE' then
    insert into public.cambios_plan (
      plan_estudio_id,
      cambiado_por,
      tipo,
      campo,
      valor_anterior,
      valor_nuevo,
      response_id
    )
    values (
      old.id,
      old.actualizado_por,
      'OTRO'::public.tipo_cambio,
      'DELETE',
      to_jsonb(old),
      null,
      null
    );

    return old;
  end if;

  -- UPDATE ----------------------------------------------------------
  -- 1) Transición de estado
  if (new.estado_actual_id is distinct from old.estado_actual_id) then
    insert into public.cambios_plan (
      plan_estudio_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, response_id
    )
    values (
      new.id,
      new.actualizado_por,
      'TRANSICION_ESTADO'::public.tipo_cambio,
      'estado_actual_id',
      to_jsonb(old.estado_actual_id),
      to_jsonb(new.estado_actual_id),
      null
    );
  end if;

  -- 2) Cambios en JSONB "datos" (diff top-level por llave)
  if (new.datos is distinct from old.datos) then
    for k in
      select distinct key
      from (
        select jsonb_object_keys(coalesce(old.datos, '{}'::jsonb)) as key
        union all
        select jsonb_object_keys(coalesce(new.datos, '{}'::jsonb)) as key
      ) t
    loop
      old_val := coalesce(old.datos, '{}'::jsonb) -> k;
      new_val := coalesce(new.datos, '{}'::jsonb) -> k;

      if (old_val is distinct from new_val) then
        insert into public.cambios_plan (
          plan_estudio_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, response_id
        )
        values (
          new.id,
          new.actualizado_por,
          'ACTUALIZACION_CAMPO'::public.tipo_cambio,
          k,
          old_val,
          new_val,
          v_response_id
        );
      end if;
    end loop;

  end if;

  -- 3) Cambios en columnas "normales" (uno por columna)
  if (new.nombre is distinct from old.nombre) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'nombre', to_jsonb(old.nombre), to_jsonb(new.nombre), null);
  end if;

  if (new.tipo_ciclo is distinct from old.tipo_ciclo) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'tipo_ciclo', to_jsonb(old.tipo_ciclo), to_jsonb(new.tipo_ciclo), null);
  end if;

  if (new.numero_ciclos is distinct from old.numero_ciclos) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'numero_ciclos', to_jsonb(old.numero_ciclos), to_jsonb(new.numero_ciclos), null);
  end if;

  if (new.activo is distinct from old.activo) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'activo', to_jsonb(old.activo), to_jsonb(new.activo), null);
  end if;

  if (new.carrera_id is distinct from old.carrera_id) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'carrera_id', to_jsonb(old.carrera_id), to_jsonb(new.carrera_id), null);
  end if;

  if (new.estructura_id is distinct from old.estructura_id) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'estructura_id', to_jsonb(old.estructura_id), to_jsonb(new.estructura_id), null);
  end if;

  if (new.tipo_origen is distinct from old.tipo_origen) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'tipo_origen', to_jsonb(old.tipo_origen), to_jsonb(new.tipo_origen), null);
  end if;



  -- 🔥 consumirlo para que NO se guarde en planes_estudio
  if v_response_id is not null then
    new.meta_origen := new.meta_origen - 'response_id';
  end if;

  return new;
end;$function$
;

ALTER TABLE carreras
ADD COLUMN nivel nivel_plan_estudio;

UPDATE carreras c
SET nivel = p.nivel
FROM planes_estudio p
WHERE p.carrera_id = c.id;


ALTER TABLE planes_estudio
DROP COLUMN nivel;


with
  x as (
    select
      id,
      nombre,
      nivel,
      case
        when nombre ilike 'Licenciatura en %'
        or nombre ilike 'Licenciatura %' then 'Licenciatura'
        when nombre ilike 'Especialidad en %'
        or nombre ilike 'Especialidad %' then 'Especialidad'
        when nombre ilike 'Maestría en %'
        or nombre ilike 'Master en %' then 'Maestría'
        when nombre ilike 'Doctorado en %' then 'Doctorado'
        else null
      end as nuevo_nivel
    from
      carreras
  )
update carreras c
set
  nombre = COALESCE(
    case
      when x.nombre ilike 'Licenciatura en %' then REGEXP_REPLACE(x.nombre, '^Licenciatura en\s+', '')
      when x.nombre ilike 'Licenciatura %' then REGEXP_REPLACE(x.nombre, '^Licenciatura\s+', '')
      when x.nombre ilike 'Maestría en %' then REGEXP_REPLACE(x.nombre, '^Maestría en\s+', '')
      when x.nombre ilike 'Master en %' then REGEXP_REPLACE(x.nombre, '^Master en\s+', '')
      when x.nombre ilike 'Doctorado en %' then REGEXP_REPLACE(x.nombre, '^Doctorado en\s+', '')
      when x.nombre ilike 'Especialidad en %' then REGEXP_REPLACE(x.nombre, '^Especialidad en\s+', '')
      else c.nombre
    end,
    c.nombre
  ),
  nivel = x.nuevo_nivel::nivel_plan_estudio
from
  x
where
  c.id = x.id
  and x.nuevo_nivel is not null;


update planes_estudio p
set
  nombre = COALESCE(
    case
      when nombre ilike 'Licenciatura en %' then REGEXP_REPLACE(nombre, '^Licenciatura en\s+', '')
      when nombre ilike 'Licenciatura %' then REGEXP_REPLACE(nombre, '^Licenciatura\s+', '')
      when nombre ilike 'Maestría en %' then REGEXP_REPLACE(nombre, '^Maestría en\s+', '')
      when nombre ilike 'Master en %' then REGEXP_REPLACE(nombre, '^Master en\s+', '')
      when nombre ilike 'Doctorado en %' then REGEXP_REPLACE(nombre, '^Doctorado en\s+', '')
      when nombre ilike 'Especialidad en %' then REGEXP_REPLACE(nombre, '^Especialidad en\s+', '')
      else p.nombre
    end,
    p.nombre
);

UPDATE facultades
SET nombre = regexp_replace(nombre, '^Facultad de (.+)$', '\1', 'i');

UPDATE facultades
SET nombre = regexp_replace(nombre, '^Facultad Mexicana de (.+)$', '\1', 'i');

