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

    create table "public"."archivos_repositorios" (
    "created_at" timestamp with time zone not null default now(),
    "archivo_id" uuid not null,
    "repositorio_id" uuid not null
      );



  create table "public"."repositorios" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "openai_vector_store_id" uuid,
    "nombre" text
      );


CREATE UNIQUE INDEX archivos_repositorios_pkey ON public.archivos_repositorios USING btree (archivo_id, repositorio_id);

CREATE UNIQUE INDEX repositorios_pkey ON public.repositorios USING btree (id);

alter table "public"."archivos_repositorios" add constraint "archivos_repositorios_pkey" PRIMARY KEY using index "archivos_repositorios_pkey";

alter table "public"."repositorios" add constraint "repositorios_pkey" PRIMARY KEY using index "repositorios_pkey";

alter table "public"."archivos_repositorios" add constraint "archivos_repositorios_archivo_id_fkey" FOREIGN KEY (archivo_id) REFERENCES public.archivos(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."archivos_repositorios" validate constraint "archivos_repositorios_archivo_id_fkey";

alter table "public"."archivos_repositorios" add constraint "archivos_repositorios_repositorio_id_fkey" FOREIGN KEY (repositorio_id) REFERENCES public.repositorios(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."archivos_repositorios" validate constraint "archivos_repositorios_repositorio_id_fkey";

grant delete on table "public"."archivos" to "postgres";

grant insert on table "public"."archivos" to "postgres";

grant references on table "public"."archivos" to "postgres";

grant select on table "public"."archivos" to "postgres";

grant trigger on table "public"."archivos" to "postgres";

grant truncate on table "public"."archivos" to "postgres";

grant update on table "public"."archivos" to "postgres";

grant delete on table "public"."archivos_repositorios" to "anon";

grant insert on table "public"."archivos_repositorios" to "anon";

grant references on table "public"."archivos_repositorios" to "anon";

grant select on table "public"."archivos_repositorios" to "anon";

grant trigger on table "public"."archivos_repositorios" to "anon";

grant truncate on table "public"."archivos_repositorios" to "anon";

grant update on table "public"."archivos_repositorios" to "anon";

grant delete on table "public"."archivos_repositorios" to "authenticated";

grant insert on table "public"."archivos_repositorios" to "authenticated";

grant references on table "public"."archivos_repositorios" to "authenticated";

grant select on table "public"."archivos_repositorios" to "authenticated";

grant trigger on table "public"."archivos_repositorios" to "authenticated";

grant truncate on table "public"."archivos_repositorios" to "authenticated";

grant update on table "public"."archivos_repositorios" to "authenticated";

grant delete on table "public"."archivos_repositorios" to "postgres";

grant insert on table "public"."archivos_repositorios" to "postgres";

grant references on table "public"."archivos_repositorios" to "postgres";

grant select on table "public"."archivos_repositorios" to "postgres";

grant trigger on table "public"."archivos_repositorios" to "postgres";

grant truncate on table "public"."archivos_repositorios" to "postgres";

grant update on table "public"."archivos_repositorios" to "postgres";

grant delete on table "public"."archivos_repositorios" to "service_role";

grant insert on table "public"."archivos_repositorios" to "service_role";

grant references on table "public"."archivos_repositorios" to "service_role";

grant select on table "public"."archivos_repositorios" to "service_role";

grant trigger on table "public"."archivos_repositorios" to "service_role";

grant truncate on table "public"."archivos_repositorios" to "service_role";

grant update on table "public"."archivos_repositorios" to "service_role";

grant delete on table "public"."repositorios" to "anon";

grant insert on table "public"."repositorios" to "anon";

grant references on table "public"."repositorios" to "anon";

grant select on table "public"."repositorios" to "anon";

grant trigger on table "public"."repositorios" to "anon";

grant truncate on table "public"."repositorios" to "anon";

grant update on table "public"."repositorios" to "anon";

grant delete on table "public"."repositorios" to "authenticated";

grant insert on table "public"."repositorios" to "authenticated";

grant references on table "public"."repositorios" to "authenticated";

grant select on table "public"."repositorios" to "authenticated";

grant trigger on table "public"."repositorios" to "authenticated";

grant truncate on table "public"."repositorios" to "authenticated";

grant update on table "public"."repositorios" to "authenticated";

grant delete on table "public"."repositorios" to "postgres";

grant insert on table "public"."repositorios" to "postgres";

grant references on table "public"."repositorios" to "postgres";

grant select on table "public"."repositorios" to "postgres";

grant trigger on table "public"."repositorios" to "postgres";

grant truncate on table "public"."repositorios" to "postgres";

grant update on table "public"."repositorios" to "postgres";

grant delete on table "public"."repositorios" to "service_role";

grant insert on table "public"."repositorios" to "service_role";

grant references on table "public"."repositorios" to "service_role";

grant select on table "public"."repositorios" to "service_role";

grant trigger on table "public"."repositorios" to "service_role";

grant truncate on table "public"."repositorios" to "service_role";

grant update on table "public"."repositorios" to "service_role";

alter table "public"."archivos" add column "size" integer;