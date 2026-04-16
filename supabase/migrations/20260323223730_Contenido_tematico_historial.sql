set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_track_cambios_asignatura()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
  k text;
  old_val jsonb;
  new_val jsonb;
  v_interaccion_id uuid;
  v_usuario uuid;
begin
  -- 1. Extraer ID de interacción de IA de meta_origen si existe
  v_interaccion_id := nullif(new.meta_origen->>'interaccion_ia_id', '')::uuid;
  
  -- Definir quién hace el cambio
  v_usuario := case when tg_op = 'INSERT' then new.creado_por else new.actualizado_por end;

  -- ----------------------------------------------------------
  -- INSERT -> Registro de creación completo
  -- ----------------------------------------------------------
  if tg_op = 'INSERT' then
    insert into public.cambios_asignatura (
      asignatura_id, cambiado_por, tipo, valor_nuevo, interaccion_ia_id
    )
    values (
      new.id, v_usuario, 'CREACION'::public.tipo_cambio, to_jsonb(new), v_interaccion_id
    );
    return new;
  end if;

  -- ----------------------------------------------------------
  -- DELETE -> Registro de eliminación
  -- ----------------------------------------------------------
  if tg_op = 'DELETE' then
    insert into public.cambios_asignatura (
      asignatura_id, cambiado_por, tipo, campo, valor_anterior
    )
    values (
      old.id, old.actualizado_por, 'OTRO'::public.tipo_cambio, 'DELETE', to_jsonb(old)
    );
    return old;
  end if;

  -- ----------------------------------------------------------
  -- UPDATE -> Registro de cambios específicos
  -- ----------------------------------------------------------
  
  -- A) Columnas normales de texto y números
  if (new.nombre is distinct from old.nombre) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'nombre', to_jsonb(old.nombre), to_jsonb(new.nombre), v_interaccion_id);
  end if;

  if (new.codigo is distinct from old.codigo) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'codigo', to_jsonb(old.codigo), to_jsonb(new.codigo), v_interaccion_id);
  end if;

  if (new.numero_ciclo is distinct from old.numero_ciclo) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'numero_ciclo', to_jsonb(old.numero_ciclo), to_jsonb(new.numero_ciclo), v_interaccion_id);
  end if;

  if (new.creditos is distinct from old.creditos) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'creditos', to_jsonb(old.creditos), to_jsonb(new.creditos), v_interaccion_id);
  end if;

  if (new.prerrequisito_asignatura_id is distinct from old.prerrequisito_asignatura_id) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'prerrequisito_asignatura_id', to_jsonb(old.prerrequisito_asignatura_id), to_jsonb(new.prerrequisito_asignatura_id), v_interaccion_id);
  end if;

  -- B) Cambios en JSONB "datos" (recorriendo llaves)
  if (new.datos is distinct from old.datos) then
    for k in
      select distinct key from (
        select jsonb_object_keys(coalesce(old.datos, '{}'::jsonb)) as key
        union all
        select jsonb_object_keys(coalesce(new.datos, '{}'::jsonb)) as key
      ) t
    loop
      old_val := coalesce(old.datos, '{}'::jsonb) -> k;
      new_val := coalesce(new.datos, '{}'::jsonb) -> k;

      if (old_val is distinct from new_val) then
        insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
        values (new.id, v_usuario, 'ACTUALIZACION_CAMPO', k, old_val, new_val, v_interaccion_id);
      end if;
    end loop;
  end if;

  -- C) Criterios de Evaluación (JSONB completo)
  if (new.criterios_de_evaluacion is distinct from old.criterios_de_evaluacion) then
    insert into public.cambios_asignatura (asignatura_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, interaccion_ia_id)
    values (new.id, v_usuario, 'ACTUALIZACION', 'criterios_de_evaluacion', old.criterios_de_evaluacion, new.criterios_de_evaluacion, v_interaccion_id);
  end if;

-- D) Contenido Temático (JSONB completo)
  if (new.contenido_tematico is distinct from old.contenido_tematico) then
    insert into public.cambios_asignatura (
      asignatura_id, 
      cambiado_por, 
      tipo, 
      campo, 
      valor_anterior, 
      valor_nuevo, 
      interaccion_ia_id
    )
    values (
      new.id, 
      v_usuario, 
      'ACTUALIZACION', 
      'contenido_tematico', 
      old.contenido_tematico, 
      new.contenido_tematico, 
      v_interaccion_id
    );
  end if;


  --  Limpiar meta_origen para que interaccion_ia_id no se guarde permanentemente en la tabla base
  if v_interaccion_id is not null then
    new.meta_origen := new.meta_origen - 'interaccion_ia_id';
  end if;

  return new;
end;$function$
;


