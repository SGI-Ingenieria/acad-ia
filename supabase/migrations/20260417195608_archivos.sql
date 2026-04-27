alter table "public"."archivos" drop constraint "archivos_subido_por_fkey";

alter table "public"."archivos" drop constraint "archivos_pkey";

drop index if exists "public"."archivos_pkey";

alter table "public"."archivos" drop column "bytes";

alter table "public"."archivos" drop column "mime_type";

alter table "public"."archivos" drop column "nombre";

alter table "public"."archivos" drop column "notas";

alter table "public"."archivos" drop column "ruta_storage";

alter table "public"."archivos" drop column "subido_en";

alter table "public"."archivos" drop column "subido_por";

alter table "public"."archivos" drop column "temporal";

alter table "public"."archivos" add column "created_at" timestamp with time zone not null default now();

alter table "public"."archivos" add column "hash" text;

alter table "public"."archivos" add column "path" text not null;

alter table "public"."archivos" alter column "id" drop default;

CREATE UNIQUE INDEX archivos_usuarios_hash_key ON public.archivos USING btree (hash);

CREATE UNIQUE INDEX archivos_usuarios_pkey ON public.archivos USING btree (id);

alter table "public"."archivos" add constraint "archivos_usuarios_pkey" PRIMARY KEY using index "archivos_usuarios_pkey";

alter table "public"."archivos" add constraint "archivos_usuarios_hash_key" UNIQUE using index "archivos_usuarios_hash_key";

alter table "public"."archivos" add constraint "archivos_usuarios_id_fkey" FOREIGN KEY (id) REFERENCES storage.objects(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."archivos" validate constraint "archivos_usuarios_id_fkey";

grant delete on table "public"."archivos" to "postgres";

grant insert on table "public"."archivos" to "postgres";

grant references on table "public"."archivos" to "postgres";

grant select on table "public"."archivos" to "postgres";

grant trigger on table "public"."archivos" to "postgres";

grant truncate on table "public"."archivos" to "postgres";

grant update on table "public"."archivos" to "postgres";


  create policy "todos los permisos dx3g7q_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'ai-storage'::text));



  create policy "todos los permisos dx3g7q_1"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'ai-storage'::text));



  create policy "todos los permisos dx3g7q_2"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'ai-storage'::text));



  create policy "todos los permisos dx3g7q_3"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'ai-storage'::text));



