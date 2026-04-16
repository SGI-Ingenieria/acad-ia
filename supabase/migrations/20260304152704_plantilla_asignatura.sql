create type "public"."estado_mensaje_ia" as enum ('PROCESANDO', 'COMPLETADO', 'ERROR');

alter table "public"."asignaturas" alter column "estado" drop default;

alter type "public"."estado_asignatura" rename to "estado_asignatura__old_version_to_be_dropped";

create type "public"."estado_asignatura" as enum ('borrador', 'revisada', 'aprobada', 'generando');


  create table "public"."asignatura_mensajes_ia" (
    "id" uuid not null default gen_random_uuid(),
    "enviado_por" uuid not null default auth.uid(),
    "mensaje" text not null,
    "campos" text[] not null default '{}'::text[],
    "respuesta" text,
    "is_refusal" boolean not null default false,
    "propuesta" jsonb,
    "estado" public.estado_mensaje_ia not null default 'PROCESANDO'::public.estado_mensaje_ia,
    "fecha_creacion" timestamp without time zone not null default now(),
    "fecha_actualizacion" timestamp without time zone not null default now(),
    "conversacion_asignatura_id" uuid not null
      );



  create table "public"."plan_mensajes_ia" (
    "id" uuid not null default gen_random_uuid(),
    "enviado_por" uuid not null default auth.uid(),
    "mensaje" text not null,
    "campos" text[] not null default '{}'::text[],
    "respuesta" text,
    "is_refusal" boolean not null default false,
    "propuesta" jsonb,
    "estado" public.estado_mensaje_ia not null default 'PROCESANDO'::public.estado_mensaje_ia,
    "fecha_creacion" timestamp without time zone not null default now(),
    "fecha_actualizacion" timestamp without time zone not null default now(),
    "conversacion_plan_id" uuid not null
      );


alter table "public"."asignaturas" alter column estado type "public"."estado_asignatura" using estado::text::"public"."estado_asignatura";

alter table "public"."asignaturas" alter column "estado" set default 'borrador'::public.estado_asignatura;

drop type "public"."estado_asignatura__old_version_to_be_dropped";

alter table "public"."estructuras_asignatura" drop column "version";

alter table "public"."estructuras_asignatura" add column "template_id" text;

alter table "public"."estructuras_asignatura" add column "tipo" public.tipo_estructura_plan;

CREATE UNIQUE INDEX asignatura_mensajes_ia_pkey ON public.asignatura_mensajes_ia USING btree (id);

CREATE UNIQUE INDEX plan_mensajes_ia_pkey ON public.plan_mensajes_ia USING btree (id);

alter table "public"."asignatura_mensajes_ia" add constraint "asignatura_mensajes_ia_pkey" PRIMARY KEY using index "asignatura_mensajes_ia_pkey";

alter table "public"."plan_mensajes_ia" add constraint "plan_mensajes_ia_pkey" PRIMARY KEY using index "plan_mensajes_ia_pkey";

alter table "public"."asignatura_mensajes_ia" add constraint "asignatura_mensajes_ia_conversacion_asignatura_id_fkey" FOREIGN KEY (conversacion_asignatura_id) REFERENCES public.conversaciones_asignatura(id) ON DELETE CASCADE not valid;

alter table "public"."asignatura_mensajes_ia" validate constraint "asignatura_mensajes_ia_conversacion_asignatura_id_fkey";

alter table "public"."plan_mensajes_ia" add constraint "plan_mensajes_ia_conversacion_plan_id_fkey" FOREIGN KEY (conversacion_plan_id) REFERENCES public.conversaciones_plan(id) ON DELETE CASCADE not valid;

alter table "public"."plan_mensajes_ia" validate constraint "plan_mensajes_ia_conversacion_plan_id_fkey";

create or replace view "public"."plantilla_asignatura" as  SELECT asignaturas.id AS asignatura_id,
    struct.id AS estructura_id,
    struct.template_id
   FROM (public.asignaturas
     JOIN public.estructuras_asignatura struct ON ((asignaturas.estructura_id = struct.id)));


grant delete on table "public"."asignatura_mensajes_ia" to "anon";

grant insert on table "public"."asignatura_mensajes_ia" to "anon";

grant references on table "public"."asignatura_mensajes_ia" to "anon";

grant select on table "public"."asignatura_mensajes_ia" to "anon";

grant trigger on table "public"."asignatura_mensajes_ia" to "anon";

grant truncate on table "public"."asignatura_mensajes_ia" to "anon";

grant update on table "public"."asignatura_mensajes_ia" to "anon";

grant delete on table "public"."asignatura_mensajes_ia" to "authenticated";

grant insert on table "public"."asignatura_mensajes_ia" to "authenticated";

grant references on table "public"."asignatura_mensajes_ia" to "authenticated";

grant select on table "public"."asignatura_mensajes_ia" to "authenticated";

grant trigger on table "public"."asignatura_mensajes_ia" to "authenticated";

grant truncate on table "public"."asignatura_mensajes_ia" to "authenticated";

grant update on table "public"."asignatura_mensajes_ia" to "authenticated";

grant delete on table "public"."asignatura_mensajes_ia" to "postgres";

grant insert on table "public"."asignatura_mensajes_ia" to "postgres";

grant references on table "public"."asignatura_mensajes_ia" to "postgres";

grant select on table "public"."asignatura_mensajes_ia" to "postgres";

grant trigger on table "public"."asignatura_mensajes_ia" to "postgres";

grant truncate on table "public"."asignatura_mensajes_ia" to "postgres";

grant update on table "public"."asignatura_mensajes_ia" to "postgres";

grant delete on table "public"."asignatura_mensajes_ia" to "service_role";

grant insert on table "public"."asignatura_mensajes_ia" to "service_role";

grant references on table "public"."asignatura_mensajes_ia" to "service_role";

grant select on table "public"."asignatura_mensajes_ia" to "service_role";

grant trigger on table "public"."asignatura_mensajes_ia" to "service_role";

grant truncate on table "public"."asignatura_mensajes_ia" to "service_role";

grant update on table "public"."asignatura_mensajes_ia" to "service_role";

grant delete on table "public"."plan_mensajes_ia" to "anon";

grant insert on table "public"."plan_mensajes_ia" to "anon";

grant references on table "public"."plan_mensajes_ia" to "anon";

grant select on table "public"."plan_mensajes_ia" to "anon";

grant trigger on table "public"."plan_mensajes_ia" to "anon";

grant truncate on table "public"."plan_mensajes_ia" to "anon";

grant update on table "public"."plan_mensajes_ia" to "anon";

grant delete on table "public"."plan_mensajes_ia" to "authenticated";

grant insert on table "public"."plan_mensajes_ia" to "authenticated";

grant references on table "public"."plan_mensajes_ia" to "authenticated";

grant select on table "public"."plan_mensajes_ia" to "authenticated";

grant trigger on table "public"."plan_mensajes_ia" to "authenticated";

grant truncate on table "public"."plan_mensajes_ia" to "authenticated";

grant update on table "public"."plan_mensajes_ia" to "authenticated";

grant delete on table "public"."plan_mensajes_ia" to "postgres";

grant insert on table "public"."plan_mensajes_ia" to "postgres";

grant references on table "public"."plan_mensajes_ia" to "postgres";

grant select on table "public"."plan_mensajes_ia" to "postgres";

grant trigger on table "public"."plan_mensajes_ia" to "postgres";

grant truncate on table "public"."plan_mensajes_ia" to "postgres";

grant update on table "public"."plan_mensajes_ia" to "postgres";

grant delete on table "public"."plan_mensajes_ia" to "service_role";

grant insert on table "public"."plan_mensajes_ia" to "service_role";

grant references on table "public"."plan_mensajes_ia" to "service_role";

grant select on table "public"."plan_mensajes_ia" to "service_role";

grant trigger on table "public"."plan_mensajes_ia" to "service_role";

grant truncate on table "public"."plan_mensajes_ia" to "service_role";

grant update on table "public"."plan_mensajes_ia" to "service_role";

drop trigger if exists "protect_buckets_delete" on "storage"."buckets";

drop trigger if exists "protect_objects_delete" on "storage"."objects";


