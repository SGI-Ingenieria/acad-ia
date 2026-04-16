alter table "public"."asignaturas" alter column "estado" drop default;

alter type "public"."estado_asignatura" rename to "estado_asignatura__old_version_to_be_dropped";

create type "public"."estado_asignatura" as enum ('borrador', 'revisada', 'aprobada', 'generando', 'fallida');

alter table "public"."asignaturas" alter column estado type "public"."estado_asignatura" using estado::text::"public"."estado_asignatura";

alter table "public"."asignaturas" alter column "estado" set default 'borrador'::public.estado_asignatura;

drop type "public"."estado_asignatura__old_version_to_be_dropped";