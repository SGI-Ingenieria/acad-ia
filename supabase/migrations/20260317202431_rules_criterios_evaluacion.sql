-- Comentario de prueba
CREATE OR REPLACE FUNCTION public.suma_porcentajes(jsonb)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
declare
    total numeric;
begin
    select coalesce(sum((elem->>'porcentaje')::numeric),0)
    into total
    from jsonb_array_elements($1) elem;

    return total;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.validar_prerrequisito_asignatura()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  v_plan uuid;
  v_ciclo integer;
begin

  if new.prerrequisito_asignatura_id is null then
    return new;
  end if;

  select
    plan_estudio_id,
    numero_ciclo
  into
    v_plan,
    v_ciclo
  from public.asignaturas
  where id = new.prerrequisito_asignatura_id;

  if not found then
    raise exception
      'La asignatura prerrequisito no existe';
  end if;

  if v_plan <> new.plan_estudio_id then
    raise exception
      'El prerrequisito debe pertenecer al mismo plan de estudio';
  end if;

  if new.numero_ciclo is null then
    raise exception
      'La asignatura debe tener numero_ciclo definido';
  end if;

  if v_ciclo is null then
    raise exception
      'El prerrequisito debe tener numero_ciclo definido';
  end if;

  if v_ciclo >= new.numero_ciclo then
    raise exception
      'El prerrequisito debe pertenecer a un ciclo menor';
  end if;

  return new;

end;
$function$
;


alter table "public"."asignaturas" add constraint "asignaturas_criterios_porcentaje_max_100" CHECK ((public.suma_porcentajes(criterios_de_evaluacion) <= (100)::numeric)) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_criterios_porcentaje_max_100";

set check_function_bodies = off;