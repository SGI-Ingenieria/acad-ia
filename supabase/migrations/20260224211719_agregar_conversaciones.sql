CREATE OR REPLACE FUNCTION public.append_conversacion_asignatura(p_id uuid, p_append jsonb)
 RETURNS void
 LANGUAGE sql
AS $function$
  update conversaciones_asignatura
  set conversacion_json = coalesce(conversacion_json, '[]'::jsonb) || p_append
  where id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.append_conversacion_plan(p_id uuid, p_append jsonb)
 RETURNS void
 LANGUAGE sql
AS $function$
  update conversaciones_plan
  set conversacion_json = coalesce(conversacion_json, '[]'::jsonb) || p_append
  where id = p_id;
$function$
;


