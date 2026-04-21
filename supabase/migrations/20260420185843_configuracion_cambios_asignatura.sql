alter table "public"."cambios_asignatura" drop constraint "cambios_asignatura_asignatura_id_fkey";

alter table "public"."cambios_asignatura" add constraint "cambios_asignatura_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."cambios_asignatura" validate constraint "cambios_asignatura_asignatura_id_fkey";

grant delete on table "public"."archivos" to "postgres";

grant insert on table "public"."archivos" to "postgres";

grant references on table "public"."archivos" to "postgres";

grant select on table "public"."archivos" to "postgres";

grant trigger on table "public"."archivos" to "postgres";

grant truncate on table "public"."archivos" to "postgres";

grant update on table "public"."archivos" to "postgres";

-- En un futuro se debería separar la lógica del trigger 'trigger_track_cambios_asignatura' de la siguiente manera:
--  * Trigger BEFORE: Una función muy corta que únicamente extraiga el ID de la IA y limpie new.meta_origen.
--  * Trigger AFTER: La función principal de auditoría que haga todos los insert into public.cambios_asignatura. Como se ejecuta después, el ID de la asignatura ya existirá sin problemas.
--
-- Por ahora, esto resuelve el problema
ALTER TABLE public.cambios_asignatura 
DROP CONSTRAINT cambios_asignatura_asignatura_id_fkey,
ADD CONSTRAINT cambios_asignatura_asignatura_id_fkey 
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;