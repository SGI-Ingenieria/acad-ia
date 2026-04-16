drop extension if exists "pgjwt";

alter table "public"."asignaturas" add column "prerrequisito_asignatura_id" uuid;

CREATE INDEX asignaturas_prerrequisito_idx ON public.asignaturas USING btree (prerrequisito_asignatura_id);

alter table "public"."asignaturas" add constraint "asignaturas_prerrequisito_asignatura_id_fkey" FOREIGN KEY (prerrequisito_asignatura_id) REFERENCES public.asignaturas(id) ON DELETE SET NULL not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_prerrequisito_asignatura_id_fkey";

alter table "public"."asignaturas" add constraint "asignaturas_prerrequisito_self_check" CHECK (((prerrequisito_asignatura_id IS NULL) OR (prerrequisito_asignatura_id <> id))) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_prerrequisito_self_check";

set check_function_bodies = off;

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

CREATE TRIGGER trg_validar_prerrequisito_asignatura BEFORE INSERT OR UPDATE OF prerrequisito_asignatura_id, numero_ciclo, plan_estudio_id ON public.asignaturas FOR EACH ROW EXECUTE FUNCTION public.validar_prerrequisito_asignatura();


