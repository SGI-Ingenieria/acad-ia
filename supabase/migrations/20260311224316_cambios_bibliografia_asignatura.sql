alter table "public"."bibliografia_asignatura" drop column "biblioteca_item_id";

alter table "public"."bibliografia_asignatura" drop column "tipo_fuente";

alter table "public"."bibliografia_asignatura" add column "referencia_biblioteca" text;

alter table "public"."bibliografia_asignatura" add column "referencia_en_linea" text;