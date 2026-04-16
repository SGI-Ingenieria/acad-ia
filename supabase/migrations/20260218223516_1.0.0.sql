
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";



CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."estado_asignatura" AS ENUM (
    'borrador',
    'revisada',
    'aprobada',
    'generando'
);


ALTER TYPE "public"."estado_asignatura" OWNER TO "postgres";


CREATE TYPE "public"."estado_conversacion" AS ENUM (
    'ACTIVA',
    'ARCHIVANDO',
    'ARCHIVADA',
    'ERROR'
);


ALTER TYPE "public"."estado_conversacion" OWNER TO "postgres";


CREATE TYPE "public"."estado_tarea_revision" AS ENUM (
    'PENDIENTE',
    'COMPLETADA',
    'OMITIDA'
);


ALTER TYPE "public"."estado_tarea_revision" OWNER TO "postgres";


CREATE TYPE "public"."fuente_cambio" AS ENUM (
    'HUMANO',
    'IA'
);


ALTER TYPE "public"."fuente_cambio" OWNER TO "postgres";


CREATE TYPE "public"."nivel_plan_estudio" AS ENUM (
    'Licenciatura',
    'Maestría',
    'Doctorado',
    'Especialidad',
    'Diplomado',
    'Otro'
);


ALTER TYPE "public"."nivel_plan_estudio" OWNER TO "postgres";


CREATE TYPE "public"."puesto_tipo" AS ENUM (
    'vicerrector',
    'director_facultad',
    'secretario_academico',
    'jefe_carrera',
    'profesor',
    'lci'
);


ALTER TYPE "public"."puesto_tipo" OWNER TO "postgres";


CREATE TYPE "public"."rol_responsable_asignatura" AS ENUM (
    'PROFESOR_RESPONSABLE',
    'COAUTOR',
    'REVISOR'
);


ALTER TYPE "public"."rol_responsable_asignatura" OWNER TO "postgres";


CREATE TYPE "public"."tipo_asignatura" AS ENUM (
    'OBLIGATORIA',
    'OPTATIVA',
    'TRONCAL',
    'OTRA'
);


ALTER TYPE "public"."tipo_asignatura" OWNER TO "postgres";


CREATE TYPE "public"."tipo_bibliografia" AS ENUM (
    'BASICA',
    'COMPLEMENTARIA'
);


ALTER TYPE "public"."tipo_bibliografia" OWNER TO "postgres";


CREATE TYPE "public"."tipo_cambio" AS ENUM (
    'ACTUALIZACION_CAMPO',
    'ACTUALIZACION_MAPA',
    'TRANSICION_ESTADO',
    'OTRO',
    'CREACION',
    'ACTUALIZACION'
);


ALTER TYPE "public"."tipo_cambio" OWNER TO "postgres";


CREATE TYPE "public"."tipo_ciclo" AS ENUM (
    'Semestre',
    'Cuatrimestre',
    'Trimestre',
    'Otro'
);


ALTER TYPE "public"."tipo_ciclo" OWNER TO "postgres";


CREATE TYPE "public"."tipo_estructura_plan" AS ENUM (
    'CURRICULAR',
    'NO_CURRICULAR'
);


ALTER TYPE "public"."tipo_estructura_plan" OWNER TO "postgres";


CREATE TYPE "public"."tipo_fuente_bibliografia" AS ENUM (
    'MANUAL',
    'BIBLIOTECA'
);


ALTER TYPE "public"."tipo_fuente_bibliografia" OWNER TO "postgres";


CREATE TYPE "public"."tipo_interaccion_ia" AS ENUM (
    'GENERAR',
    'MEJORAR_SECCION',
    'CHAT',
    'OTRA'
);


ALTER TYPE "public"."tipo_interaccion_ia" OWNER TO "postgres";


CREATE TYPE "public"."tipo_notificacion" AS ENUM (
    'PLAN_ASIGNADO',
    'ESTADO_CAMBIADO',
    'TAREA_ASIGNADA',
    'COMENTARIO',
    'OTRA'
);


ALTER TYPE "public"."tipo_notificacion" OWNER TO "postgres";


CREATE TYPE "public"."tipo_origen" AS ENUM (
    'MANUAL',
    'IA',
    'CLONADO_INTERNO',
    'CLONADO_TRADICIONAL',
    'OTRO'
);


ALTER TYPE "public"."tipo_origen" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_log_cambios_planes_estudio"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$declare
  k text;
  old_val jsonb;
  new_val jsonb;

  v_response_id text;
begin
  v_response_id := nullif(new.meta_origen->>'response_id','');

  -- INSERT -> CREACION
  if tg_op = 'INSERT' then
    insert into public.cambios_plan (
      plan_estudio_id,
      cambiado_por,
      tipo,
      campo,
      valor_anterior,
      valor_nuevo,
      response_id
    )
    values (
      new.id,
      new.creado_por,
      'CREACION'::public.tipo_cambio,
      null,
      null,
      to_jsonb(new),
      null
    );

    return new;
  end if;

  -- DELETE (opcional): si no lo quieres, bórralo
  if tg_op = 'DELETE' then
    insert into public.cambios_plan (
      plan_estudio_id,
      cambiado_por,
      tipo,
      campo,
      valor_anterior,
      valor_nuevo,
      response_id
    )
    values (
      old.id,
      old.actualizado_por,
      'OTRO'::public.tipo_cambio,
      'DELETE',
      to_jsonb(old),
      null,
      null
    );

    return old;
  end if;

  -- UPDATE ----------------------------------------------------------
  -- 1) Transición de estado
  if (new.estado_actual_id is distinct from old.estado_actual_id) then
    insert into public.cambios_plan (
      plan_estudio_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, response_id
    )
    values (
      new.id,
      new.actualizado_por,
      'TRANSICION_ESTADO'::public.tipo_cambio,
      'estado_actual_id',
      to_jsonb(old.estado_actual_id),
      to_jsonb(new.estado_actual_id),
      null
    );
  end if;

  -- 2) Cambios en JSONB "datos" (diff top-level por llave)
  if (new.datos is distinct from old.datos) then
    for k in
      select distinct key
      from (
        select jsonb_object_keys(coalesce(old.datos, '{}'::jsonb)) as key
        union all
        select jsonb_object_keys(coalesce(new.datos, '{}'::jsonb)) as key
      ) t
    loop
      old_val := coalesce(old.datos, '{}'::jsonb) -> k;
      new_val := coalesce(new.datos, '{}'::jsonb) -> k;

      if (old_val is distinct from new_val) then
        insert into public.cambios_plan (
          plan_estudio_id, cambiado_por, tipo, campo, valor_anterior, valor_nuevo, response_id
        )
        values (
          new.id,
          new.actualizado_por,
          'ACTUALIZACION_CAMPO'::public.tipo_cambio,
          k,
          old_val,
          new_val,
          v_response_id
        );
      end if;
    end loop;

  end if;

  -- 3) Cambios en columnas "normales" (uno por columna)
  if (new.nombre is distinct from old.nombre) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'nombre', to_jsonb(old.nombre), to_jsonb(new.nombre), null);
  end if;

  if (new.nivel is distinct from old.nivel) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'nivel', to_jsonb(old.nivel), to_jsonb(new.nivel), null);
  end if;

  if (new.tipo_ciclo is distinct from old.tipo_ciclo) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'tipo_ciclo', to_jsonb(old.tipo_ciclo), to_jsonb(new.tipo_ciclo), null);
  end if;

  if (new.numero_ciclos is distinct from old.numero_ciclos) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'numero_ciclos', to_jsonb(old.numero_ciclos), to_jsonb(new.numero_ciclos), null);
  end if;

  if (new.activo is distinct from old.activo) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'activo', to_jsonb(old.activo), to_jsonb(new.activo), null);
  end if;

  if (new.carrera_id is distinct from old.carrera_id) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'carrera_id', to_jsonb(old.carrera_id), to_jsonb(new.carrera_id), null);
  end if;

  if (new.estructura_id is distinct from old.estructura_id) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'estructura_id', to_jsonb(old.estructura_id), to_jsonb(new.estructura_id), null);
  end if;

  if (new.tipo_origen is distinct from old.tipo_origen) then
    insert into public.cambios_plan values (gen_random_uuid(), new.id, new.actualizado_por, now(),
      'ACTUALIZACION'::public.tipo_cambio, 'tipo_origen', to_jsonb(old.tipo_origen), to_jsonb(new.tipo_origen), null);
  end if;



  -- 🔥 consumirlo para que NO se guarde en planes_estudio
  if v_response_id is not null then
    new.meta_origen := new.meta_origen - 'response_id';
  end if;

  return new;
end;$$;


ALTER FUNCTION "public"."fn_log_cambios_planes_estudio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_actualizado_en"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_actualizado_en"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unaccent_immutable"("text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT PARALLEL SAFE
    AS $_$
  SELECT public.unaccent('public.unaccent', $1);
$_$;


ALTER FUNCTION "public"."unaccent_immutable"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_numero_ciclo_asignatura"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_numero_ciclos int;
begin
  if new.numero_ciclo is null then
    return new;
  end if;

  select pe.numero_ciclos into v_numero_ciclos
  from planes_estudio pe
  where pe.id = new.plan_estudio_id;

  if v_numero_ciclos is null then
    raise exception 'plan_estudio_id inválido %, plan no encontrado', new.plan_estudio_id;
  end if;

  if new.numero_ciclo < 1 then
    raise exception 'numero_ciclo debe ser >= 1 (recibido %)', new.numero_ciclo;
  end if;

  if new.numero_ciclo > v_numero_ciclos then
    raise exception 'numero_ciclo % excede planes_estudio.numero_ciclos % para plan_estudio_id %',
      new.numero_ciclo, v_numero_ciclos, new.plan_estudio_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_numero_ciclo_asignatura"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."archivos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ruta_storage" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "mime_type" "text",
    "bytes" integer,
    "subido_por" "uuid",
    "subido_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "temporal" boolean DEFAULT false NOT NULL,
    "openai_file_id" "text",
    "notas" "text"
);


ALTER TABLE "public"."archivos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."asignaturas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_estudio_id" "uuid" NOT NULL,
    "estructura_id" "uuid",
    "codigo" "text",
    "nombre" "text" NOT NULL,
    "tipo" "public"."tipo_asignatura" DEFAULT 'OBLIGATORIA'::"public"."tipo_asignatura" NOT NULL,
    "creditos" numeric NOT NULL,
    "numero_ciclo" integer,
    "linea_plan_id" "uuid",
    "orden_celda" integer,
    "datos" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "contenido_tematico" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "tipo_origen" "public"."tipo_origen",
    "meta_origen" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_por" "uuid",
    "actualizado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "horas_academicas" integer,
    "horas_independientes" integer,
    "asignatura_hash" "text" GENERATED ALWAYS AS ("encode"(SUBSTRING("extensions"."digest"(("id")::"text", 'sha512'::"text") FROM 1 FOR 12), 'hex'::"text")) STORED,
    "estado" "public"."estado_asignatura" DEFAULT 'borrador'::"public"."estado_asignatura" NOT NULL,
    CONSTRAINT "asignaturas_ciclo_chk" CHECK ((("numero_ciclo" IS NULL) OR ("numero_ciclo" > 0))),
    CONSTRAINT "asignaturas_creditos_check" CHECK (("creditos" >= (0)::numeric)),
    CONSTRAINT "asignaturas_horas_academicas_check" CHECK ((("horas_academicas" IS NULL) OR ("horas_academicas" >= 0))),
    CONSTRAINT "asignaturas_horas_independientes_check" CHECK ((("horas_independientes" IS NULL) OR ("horas_independientes" >= 0))),
    CONSTRAINT "asignaturas_orden_celda_chk" CHECK ((("orden_celda" IS NULL) OR ("orden_celda" >= 0)))
);


ALTER TABLE "public"."asignaturas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bibliografia_asignatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asignatura_id" "uuid" NOT NULL,
    "tipo" "public"."tipo_bibliografia" NOT NULL,
    "cita" "text" NOT NULL,
    "tipo_fuente" "public"."tipo_fuente_bibliografia" DEFAULT 'MANUAL'::"public"."tipo_fuente_bibliografia" NOT NULL,
    "biblioteca_item_id" "text",
    "creado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bibliografia_asignatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cambios_asignatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asignatura_id" "uuid" NOT NULL,
    "cambiado_por" "uuid",
    "cambiado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo" "public"."tipo_cambio" NOT NULL,
    "campo" "text",
    "valor_anterior" "jsonb",
    "valor_nuevo" "jsonb",
    "fuente" "public"."fuente_cambio",
    "interaccion_ia_id" "uuid"
);


ALTER TABLE "public"."cambios_asignatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cambios_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_estudio_id" "uuid" NOT NULL,
    "cambiado_por" "uuid",
    "cambiado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo" "public"."tipo_cambio" NOT NULL,
    "campo" "text",
    "valor_anterior" "jsonb",
    "valor_nuevo" "jsonb",
    "response_id" "text"
);


ALTER TABLE "public"."cambios_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carreras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "facultad_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "nombre_corto" "text",
    "clave_sep" "text",
    "activa" boolean DEFAULT true NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."carreras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversaciones_asignatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asignatura_id" "uuid" NOT NULL,
    "openai_conversation_id" "text" NOT NULL,
    "estado" "public"."estado_conversacion" DEFAULT 'ACTIVA'::"public"."estado_conversacion" NOT NULL,
    "conversacion_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archivado_por" "uuid",
    "archivado_en" timestamp with time zone,
    "intento_archivado" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."conversaciones_asignatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversaciones_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_estudio_id" "uuid" NOT NULL,
    "openai_conversation_id" "text" NOT NULL,
    "estado" "public"."estado_conversacion" DEFAULT 'ACTIVA'::"public"."estado_conversacion" NOT NULL,
    "conversacion_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archivado_por" "uuid",
    "archivado_en" timestamp with time zone,
    "intento_archivado" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."conversaciones_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estados_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clave" "text" NOT NULL,
    "etiqueta" "text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "es_final" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."estados_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estructuras_asignatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "version" "text",
    "definicion" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."estructuras_asignatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estructuras_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "tipo" "public"."tipo_estructura_plan" NOT NULL,
    "template_id" "text",
    "definicion" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."estructuras_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facultades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "nombre_corto" "text",
    "color" "text",
    "icono" "text",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facultades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interacciones_ia" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "plan_estudio_id" "uuid",
    "asignatura_id" "uuid",
    "tipo" "public"."tipo_interaccion_ia" NOT NULL,
    "modelo" "text",
    "temperatura" numeric,
    "prompt" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "respuesta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "aceptada" boolean DEFAULT false NOT NULL,
    "conversacion_id" "text",
    "ids_archivos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "ids_vector_store" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rutas_storage" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."interacciones_ia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lineas_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_estudio_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "orden" integer DEFAULT 0 NOT NULL,
    "area" "text",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."lineas_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "tipo" "public"."tipo_notificacion" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "leida" boolean DEFAULT false NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "leida_en" timestamp with time zone
);


ALTER TABLE "public"."notificaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planes_estudio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "carrera_id" "uuid" NOT NULL,
    "estructura_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "nivel" "public"."nivel_plan_estudio" NOT NULL,
    "tipo_ciclo" "public"."tipo_ciclo" NOT NULL,
    "numero_ciclos" integer NOT NULL,
    "datos" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "estado_actual_id" "uuid",
    "activo" boolean DEFAULT true NOT NULL,
    "tipo_origen" "public"."tipo_origen",
    "meta_origen" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "creado_por" "uuid",
    "actualizado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nombre_search" "text" GENERATED ALWAYS AS ("lower"("public"."unaccent_immutable"("nombre"))) STORED,
    "plan_hash" "text" GENERATED ALWAYS AS ("encode"(SUBSTRING("extensions"."digest"(("id")::"text", 'sha512'::"text") FROM 1 FOR 12), 'hex'::"text")) STORED,
    CONSTRAINT "planes_estudio_numero_ciclos_check" CHECK (("numero_ciclos" > 0))
);


ALTER TABLE "public"."planes_estudio" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."plantilla_plan" AS
 SELECT "plan"."id" AS "plan_estudio_id",
    "struct"."id" AS "estructura_id",
    "struct"."template_id"
   FROM ("public"."planes_estudio" "plan"
     JOIN "public"."estructuras_plan" "struct" ON (("plan"."estructura_id" = "struct"."id")));


ALTER TABLE "public"."plantilla_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."responsables_asignatura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "asignatura_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "rol" "public"."rol_responsable_asignatura" DEFAULT 'PROFESOR_RESPONSABLE'::"public"."rol_responsable_asignatura" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."responsables_asignatura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clave" "text" NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tareas_revision" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_estudio_id" "uuid" NOT NULL,
    "asignado_a" "uuid" NOT NULL,
    "rol_id" "uuid",
    "estado_id" "uuid",
    "estatus" "public"."estado_tarea_revision" DEFAULT 'PENDIENTE'::"public"."estado_tarea_revision" NOT NULL,
    "fecha_limite" "date",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completado_en" timestamp with time zone
);


ALTER TABLE "public"."tareas_revision" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transiciones_estado_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "desde_estado_id" "uuid" NOT NULL,
    "hacia_estado_id" "uuid" NOT NULL,
    "rol_permitido_id" "uuid" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "transiciones_no_auto_chk" CHECK (("desde_estado_id" <> "hacia_estado_id"))
);


ALTER TABLE "public"."transiciones_estado_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios_app" (
    "id" "uuid" NOT NULL,
    "nombre_completo" "text",
    "email" "text",
    "externo" boolean DEFAULT false NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actualizado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usuarios_app" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "rol_id" "uuid" NOT NULL,
    "facultad_id" "uuid",
    "carrera_id" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usuarios_roles_alcance_chk" CHECK ((("facultad_id" IS NOT NULL) OR ("carrera_id" IS NOT NULL)))
);


ALTER TABLE "public"."usuarios_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vector_stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "openai_vector_id" "text",
    "nombre" "text" NOT NULL,
    "creado_por" "uuid",
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vector_stores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."archivos"
    ADD CONSTRAINT "archivos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bibliografia_asignatura"
    ADD CONSTRAINT "bibliografia_asignatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cambios_asignatura"
    ADD CONSTRAINT "cambios_asignatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cambios_plan"
    ADD CONSTRAINT "cambios_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carreras"
    ADD CONSTRAINT "carreras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversaciones_asignatura"
    ADD CONSTRAINT "conversaciones_asignatura_openai_id_unico" UNIQUE ("openai_conversation_id");



ALTER TABLE ONLY "public"."conversaciones_asignatura"
    ADD CONSTRAINT "conversaciones_asignatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversaciones_plan"
    ADD CONSTRAINT "conversaciones_plan_openai_id_unico" UNIQUE ("openai_conversation_id");



ALTER TABLE ONLY "public"."conversaciones_plan"
    ADD CONSTRAINT "conversaciones_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estados_plan"
    ADD CONSTRAINT "estados_plan_clave_key" UNIQUE ("clave");



ALTER TABLE ONLY "public"."estados_plan"
    ADD CONSTRAINT "estados_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estructuras_asignatura"
    ADD CONSTRAINT "estructuras_asignatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estructuras_plan"
    ADD CONSTRAINT "estructuras_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facultades"
    ADD CONSTRAINT "facultades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interacciones_ia"
    ADD CONSTRAINT "interacciones_ia_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lineas_plan"
    ADD CONSTRAINT "lineas_plan_id_plan_unico" UNIQUE ("id", "plan_estudio_id");



ALTER TABLE ONLY "public"."lineas_plan"
    ADD CONSTRAINT "lineas_plan_nombre_unico" UNIQUE ("plan_estudio_id", "nombre");



ALTER TABLE ONLY "public"."lineas_plan"
    ADD CONSTRAINT "lineas_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responsables_asignatura"
    ADD CONSTRAINT "responsables_asignatura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."responsables_asignatura"
    ADD CONSTRAINT "responsables_asignatura_unico" UNIQUE ("asignatura_id", "usuario_id", "rol");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_clave_key" UNIQUE ("clave");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tareas_revision"
    ADD CONSTRAINT "tareas_revision_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transiciones_estado_plan"
    ADD CONSTRAINT "transiciones_estado_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transiciones_estado_plan"
    ADD CONSTRAINT "transiciones_unica" UNIQUE ("desde_estado_id", "hacia_estado_id", "rol_permitido_id");



ALTER TABLE ONLY "public"."usuarios_app"
    ADD CONSTRAINT "usuarios_app_email_unico" UNIQUE ("email");



ALTER TABLE ONLY "public"."usuarios_app"
    ADD CONSTRAINT "usuarios_app_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vector_stores"
    ADD CONSTRAINT "vector_stores_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "asignaturas_orden_celda_unico" ON "public"."asignaturas" USING "btree" ("plan_estudio_id", "linea_plan_id", "numero_ciclo", "orden_celda") WHERE (("linea_plan_id" IS NOT NULL) AND ("numero_ciclo" IS NOT NULL) AND ("orden_celda" IS NOT NULL));



CREATE INDEX "asignaturas_plan_idx" ON "public"."asignaturas" USING "btree" ("plan_estudio_id");



CREATE INDEX "asignaturas_plan_linea_ciclo_idx" ON "public"."asignaturas" USING "btree" ("plan_estudio_id", "linea_plan_id", "numero_ciclo");



CREATE INDEX "bibliografia_asignatura_idx" ON "public"."bibliografia_asignatura" USING "btree" ("asignatura_id");



CREATE INDEX "idx_conv_asig_asignatura" ON "public"."conversaciones_asignatura" USING "btree" ("asignatura_id");



CREATE INDEX "idx_conv_asig_estado" ON "public"."conversaciones_asignatura" USING "btree" ("estado");



CREATE INDEX "idx_conv_plan_estado" ON "public"."conversaciones_plan" USING "btree" ("estado");



CREATE INDEX "idx_conv_plan_plan_estudio" ON "public"."conversaciones_plan" USING "btree" ("plan_estudio_id");



CREATE INDEX "idx_planes_nombre_search" ON "public"."planes_estudio" USING "btree" ("nombre_search");



CREATE OR REPLACE TRIGGER "trg_asignaturas_actualizado_en" BEFORE UPDATE ON "public"."asignaturas" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_bibliografia_asignatura_actualizado_en" BEFORE UPDATE ON "public"."bibliografia_asignatura" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_carreras_actualizado_en" BEFORE UPDATE ON "public"."carreras" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_estructuras_asignatura_actualizado_en" BEFORE UPDATE ON "public"."estructuras_asignatura" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_estructuras_plan_actualizado_en" BEFORE UPDATE ON "public"."estructuras_plan" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_facultades_actualizado_en" BEFORE UPDATE ON "public"."facultades" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_lineas_plan_actualizado_en" BEFORE UPDATE ON "public"."lineas_plan" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_planes_estudio_actualizado_en" BEFORE UPDATE ON "public"."planes_estudio" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_planes_estudio_log_cambios" AFTER INSERT OR DELETE OR UPDATE ON "public"."planes_estudio" FOR EACH ROW EXECUTE FUNCTION "public"."fn_log_cambios_planes_estudio"();



CREATE OR REPLACE TRIGGER "trg_usuarios_app_actualizado_en" BEFORE UPDATE ON "public"."usuarios_app" FOR EACH ROW EXECUTE FUNCTION "public"."set_actualizado_en"();



CREATE OR REPLACE TRIGGER "trg_validar_numero_ciclo_asignatura" BEFORE INSERT OR UPDATE OF "numero_ciclo", "plan_estudio_id" ON "public"."asignaturas" FOR EACH ROW EXECUTE FUNCTION "public"."validar_numero_ciclo_asignatura"();



ALTER TABLE ONLY "public"."archivos"
    ADD CONSTRAINT "archivos_subido_por_fkey" FOREIGN KEY ("subido_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_actualizado_por_fkey" FOREIGN KEY ("actualizado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_estructura_id_fkey" FOREIGN KEY ("estructura_id") REFERENCES "public"."estructuras_asignatura"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_linea_plan_fk_compuesta" FOREIGN KEY ("linea_plan_id", "plan_estudio_id") REFERENCES "public"."lineas_plan"("id", "plan_estudio_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."asignaturas"
    ADD CONSTRAINT "asignaturas_plan_estudio_id_fkey" FOREIGN KEY ("plan_estudio_id") REFERENCES "public"."planes_estudio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bibliografia_asignatura"
    ADD CONSTRAINT "bibliografia_asignatura_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bibliografia_asignatura"
    ADD CONSTRAINT "bibliografia_asignatura_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cambios_asignatura"
    ADD CONSTRAINT "cambios_asignatura_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cambios_asignatura"
    ADD CONSTRAINT "cambios_asignatura_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cambios_plan"
    ADD CONSTRAINT "cambios_plan_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."carreras"
    ADD CONSTRAINT "carreras_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "public"."facultades"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."conversaciones_asignatura"
    ADD CONSTRAINT "conversaciones_asignatura_archivado_por_fkey" FOREIGN KEY ("archivado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversaciones_asignatura"
    ADD CONSTRAINT "conversaciones_asignatura_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversaciones_asignatura"
    ADD CONSTRAINT "conversaciones_asignatura_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversaciones_plan"
    ADD CONSTRAINT "conversaciones_plan_archivado_por_fkey" FOREIGN KEY ("archivado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversaciones_plan"
    ADD CONSTRAINT "conversaciones_plan_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversaciones_plan"
    ADD CONSTRAINT "conversaciones_plan_plan_estudio_id_fkey" FOREIGN KEY ("plan_estudio_id") REFERENCES "public"."planes_estudio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_ia"
    ADD CONSTRAINT "interacciones_ia_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_ia"
    ADD CONSTRAINT "interacciones_ia_plan_estudio_id_fkey" FOREIGN KEY ("plan_estudio_id") REFERENCES "public"."planes_estudio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_ia"
    ADD CONSTRAINT "interacciones_ia_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lineas_plan"
    ADD CONSTRAINT "lineas_plan_plan_estudio_id_fkey" FOREIGN KEY ("plan_estudio_id") REFERENCES "public"."planes_estudio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios_app"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_actualizado_por_fkey" FOREIGN KEY ("actualizado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_estado_actual_id_fkey" FOREIGN KEY ("estado_actual_id") REFERENCES "public"."estados_plan"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."planes_estudio"
    ADD CONSTRAINT "planes_estudio_estructura_id_fkey" FOREIGN KEY ("estructura_id") REFERENCES "public"."estructuras_plan"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."responsables_asignatura"
    ADD CONSTRAINT "responsables_asignatura_asignatura_id_fkey" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."responsables_asignatura"
    ADD CONSTRAINT "responsables_asignatura_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios_app"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tareas_revision"
    ADD CONSTRAINT "tareas_revision_asignado_a_fkey" FOREIGN KEY ("asignado_a") REFERENCES "public"."usuarios_app"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tareas_revision"
    ADD CONSTRAINT "tareas_revision_estado_id_fkey" FOREIGN KEY ("estado_id") REFERENCES "public"."estados_plan"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tareas_revision"
    ADD CONSTRAINT "tareas_revision_plan_estudio_id_fkey" FOREIGN KEY ("plan_estudio_id") REFERENCES "public"."planes_estudio"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tareas_revision"
    ADD CONSTRAINT "tareas_revision_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transiciones_estado_plan"
    ADD CONSTRAINT "transiciones_estado_plan_desde_estado_id_fkey" FOREIGN KEY ("desde_estado_id") REFERENCES "public"."estados_plan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transiciones_estado_plan"
    ADD CONSTRAINT "transiciones_estado_plan_hacia_estado_id_fkey" FOREIGN KEY ("hacia_estado_id") REFERENCES "public"."estados_plan"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transiciones_estado_plan"
    ADD CONSTRAINT "transiciones_estado_plan_rol_permitido_id_fkey" FOREIGN KEY ("rol_permitido_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "public"."facultades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."usuarios_roles"
    ADD CONSTRAINT "usuarios_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios_app"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vector_stores"
    ADD CONSTRAINT "vector_stores_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios_app"("id") ON DELETE SET NULL;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



















































































































































































































































GRANT ALL ON FUNCTION "public"."fn_log_cambios_planes_estudio"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_log_cambios_planes_estudio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_log_cambios_planes_estudio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_actualizado_en"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_actualizado_en"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_actualizado_en"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_immutable"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_immutable"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_immutable"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_numero_ciclo_asignatura"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_numero_ciclo_asignatura"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_numero_ciclo_asignatura"() TO "service_role";



























GRANT ALL ON TABLE "public"."archivos" TO "anon";
GRANT ALL ON TABLE "public"."archivos" TO "authenticated";
GRANT ALL ON TABLE "public"."archivos" TO "service_role";



GRANT ALL ON TABLE "public"."asignaturas" TO "anon";
GRANT ALL ON TABLE "public"."asignaturas" TO "authenticated";
GRANT ALL ON TABLE "public"."asignaturas" TO "service_role";



GRANT ALL ON TABLE "public"."bibliografia_asignatura" TO "anon";
GRANT ALL ON TABLE "public"."bibliografia_asignatura" TO "authenticated";
GRANT ALL ON TABLE "public"."bibliografia_asignatura" TO "service_role";



GRANT ALL ON TABLE "public"."cambios_asignatura" TO "anon";
GRANT ALL ON TABLE "public"."cambios_asignatura" TO "authenticated";
GRANT ALL ON TABLE "public"."cambios_asignatura" TO "service_role";



GRANT ALL ON TABLE "public"."cambios_plan" TO "anon";
GRANT ALL ON TABLE "public"."cambios_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."cambios_plan" TO "service_role";



GRANT ALL ON TABLE "public"."carreras" TO "anon";
GRANT ALL ON TABLE "public"."carreras" TO "authenticated";
GRANT ALL ON TABLE "public"."carreras" TO "service_role";



GRANT ALL ON TABLE "public"."conversaciones_asignatura" TO "anon";
GRANT ALL ON TABLE "public"."conversaciones_asignatura" TO "authenticated";
GRANT ALL ON TABLE "public"."conversaciones_asignatura" TO "service_role";



GRANT ALL ON TABLE "public"."conversaciones_plan" TO "anon";
GRANT ALL ON TABLE "public"."conversaciones_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."conversaciones_plan" TO "service_role";



GRANT ALL ON TABLE "public"."estados_plan" TO "anon";
GRANT ALL ON TABLE "public"."estados_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."estados_plan" TO "service_role";



GRANT ALL ON TABLE "public"."estructuras_asignatura" TO "anon";
GRANT ALL ON TABLE "public"."estructuras_asignatura" TO "authenticated";
GRANT ALL ON TABLE "public"."estructuras_asignatura" TO "service_role";



GRANT ALL ON TABLE "public"."estructuras_plan" TO "anon";
GRANT ALL ON TABLE "public"."estructuras_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."estructuras_plan" TO "service_role";



GRANT ALL ON TABLE "public"."facultades" TO "anon";
GRANT ALL ON TABLE "public"."facultades" TO "authenticated";
GRANT ALL ON TABLE "public"."facultades" TO "service_role";



GRANT ALL ON TABLE "public"."interacciones_ia" TO "anon";
GRANT ALL ON TABLE "public"."interacciones_ia" TO "authenticated";
GRANT ALL ON TABLE "public"."interacciones_ia" TO "service_role";



GRANT ALL ON TABLE "public"."lineas_plan" TO "anon";
GRANT ALL ON TABLE "public"."lineas_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."lineas_plan" TO "service_role";



GRANT ALL ON TABLE "public"."notificaciones" TO "anon";
GRANT ALL ON TABLE "public"."notificaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."notificaciones" TO "service_role";



GRANT ALL ON TABLE "public"."planes_estudio" TO "anon";
GRANT ALL ON TABLE "public"."planes_estudio" TO "authenticated";
GRANT ALL ON TABLE "public"."planes_estudio" TO "service_role";



GRANT ALL ON TABLE "public"."plantilla_plan" TO "anon";
GRANT ALL ON TABLE "public"."plantilla_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."plantilla_plan" TO "service_role";



GRANT ALL ON TABLE "public"."responsables_asignatura" TO "anon";
GRANT ALL ON TABLE "public"."responsables_asignatura" TO "authenticated";
GRANT ALL ON TABLE "public"."responsables_asignatura" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."tareas_revision" TO "anon";
GRANT ALL ON TABLE "public"."tareas_revision" TO "authenticated";
GRANT ALL ON TABLE "public"."tareas_revision" TO "service_role";



GRANT ALL ON TABLE "public"."transiciones_estado_plan" TO "anon";
GRANT ALL ON TABLE "public"."transiciones_estado_plan" TO "authenticated";
GRANT ALL ON TABLE "public"."transiciones_estado_plan" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_app" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_app" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_app" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios_roles" TO "anon";
GRANT ALL ON TABLE "public"."usuarios_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios_roles" TO "service_role";



GRANT ALL ON TABLE "public"."vector_stores" TO "anon";
GRANT ALL ON TABLE "public"."vector_stores" TO "authenticated";
GRANT ALL ON TABLE "public"."vector_stores" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";































--
-- Dumped schema changes for auth and storage
--

