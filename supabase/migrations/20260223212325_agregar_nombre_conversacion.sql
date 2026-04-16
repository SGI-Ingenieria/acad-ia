alter table "public"."conversaciones_plan" add column "nombre" text default ('Chat '::text || CURRENT_DATE);

alter table "public"."conversaciones_plan" alter column "conversacion_json" set default '[]'::jsonb;
