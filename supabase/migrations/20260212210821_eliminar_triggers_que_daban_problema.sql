create extension if not exists "http" with schema "extensions";

create extension if not exists "unaccent" with schema "public";

create type "public"."estado_conversacion" as enum ('ACTIVA', 'ARCHIVANDO', 'ARCHIVADA', 'ERROR');

create type "public"."estado_tarea_revision" as enum ('PENDIENTE', 'COMPLETADA', 'OMITIDA');

create type "public"."fuente_cambio" as enum ('HUMANO', 'IA');

create type "public"."nivel_plan_estudio" as enum ('Licenciatura', 'Maestría', 'Doctorado', 'Especialidad', 'Diplomado', 'Otro');

create type "public"."puesto_tipo" as enum ('vicerrector', 'director_facultad', 'secretario_academico', 'jefe_carrera', 'profesor', 'lci');

create type "public"."rol_responsable_asignatura" as enum ('PROFESOR_RESPONSABLE', 'COAUTOR', 'REVISOR');

create type "public"."tipo_asignatura" as enum ('OBLIGATORIA', 'OPTATIVA', 'TRONCAL', 'OTRA');

create type "public"."tipo_bibliografia" as enum ('BASICA', 'COMPLEMENTARIA');

create type "public"."tipo_cambio" as enum ('ACTUALIZACION_CAMPO', 'ACTUALIZACION_MAPA', 'TRANSICION_ESTADO', 'OTRO', 'CREACION', 'ACTUALIZACION');

create type "public"."tipo_ciclo" as enum ('Semestre', 'Cuatrimestre', 'Trimestre', 'Otro');

create type "public"."tipo_estructura_plan" as enum ('CURRICULAR', 'NO_CURRICULAR');

create type "public"."tipo_fuente_bibliografia" as enum ('MANUAL', 'BIBLIOTECA');

create type "public"."tipo_interaccion_ia" as enum ('GENERAR', 'MEJORAR_SECCION', 'CHAT', 'OTRA');

create type "public"."tipo_notificacion" as enum ('PLAN_ASIGNADO', 'ESTADO_CAMBIADO', 'TAREA_ASIGNADA', 'COMENTARIO', 'OTRA');

create type "public"."tipo_origen" as enum ('MANUAL', 'IA', 'CLONADO_INTERNO', 'CLONADO_TRADICIONAL', 'OTRO');


  create table "public"."archivos" (
    "id" uuid not null default gen_random_uuid(),
    "ruta_storage" text not null,
    "nombre" text not null,
    "mime_type" text,
    "bytes" integer,
    "subido_por" uuid,
    "subido_en" timestamp with time zone not null default now(),
    "temporal" boolean not null default false,
    "openai_file_id" text,
    "notas" text
      );



  create table "public"."asignaturas" (
    "id" uuid not null default gen_random_uuid(),
    "plan_estudio_id" uuid not null,
    "estructura_id" uuid,
    "codigo" text,
    "nombre" text not null,
    "tipo" public.tipo_asignatura not null default 'OBLIGATORIA'::public.tipo_asignatura,
    "creditos" numeric not null,
    "numero_ciclo" integer,
    "linea_plan_id" uuid,
    "orden_celda" integer,
    "datos" jsonb not null default '{}'::jsonb,
    "contenido_tematico" jsonb not null default '[]'::jsonb,
    "tipo_origen" public.tipo_origen,
    "meta_origen" jsonb not null default '{}'::jsonb,
    "creado_por" uuid,
    "actualizado_por" uuid,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now(),
    "horas_academicas" integer,
    "horas_independientes" integer,
    "asignatura_hash" text generated always as (encode(SUBSTRING(extensions.digest((id)::text, 'sha512'::text) FROM 1 FOR 12), 'hex'::text)) stored
      );



  create table "public"."bibliografia_asignatura" (
    "id" uuid not null default gen_random_uuid(),
    "asignatura_id" uuid not null,
    "tipo" public.tipo_bibliografia not null,
    "cita" text not null,
    "tipo_fuente" public.tipo_fuente_bibliografia not null default 'MANUAL'::public.tipo_fuente_bibliografia,
    "biblioteca_item_id" text,
    "creado_por" uuid,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."cambios_asignatura" (
    "id" uuid not null default gen_random_uuid(),
    "asignatura_id" uuid not null,
    "cambiado_por" uuid,
    "cambiado_en" timestamp with time zone not null default now(),
    "tipo" public.tipo_cambio not null,
    "campo" text,
    "valor_anterior" jsonb,
    "valor_nuevo" jsonb,
    "fuente" public.fuente_cambio,
    "interaccion_ia_id" uuid
      );



  create table "public"."cambios_plan" (
    "id" uuid not null default gen_random_uuid(),
    "plan_estudio_id" uuid not null,
    "cambiado_por" uuid,
    "cambiado_en" timestamp with time zone not null default now(),
    "tipo" public.tipo_cambio not null,
    "campo" text,
    "valor_anterior" jsonb,
    "valor_nuevo" jsonb,
    "response_id" text
      );



  create table "public"."carreras" (
    "id" uuid not null default gen_random_uuid(),
    "facultad_id" uuid not null,
    "nombre" text not null,
    "nombre_corto" text,
    "clave_sep" text,
    "activa" boolean not null default true,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."conversaciones_asignatura" (
    "id" uuid not null default gen_random_uuid(),
    "asignatura_id" uuid not null,
    "openai_conversation_id" text not null,
    "estado" public.estado_conversacion not null default 'ACTIVA'::public.estado_conversacion,
    "conversacion_json" jsonb not null default '{}'::jsonb,
    "creado_por" uuid,
    "creado_en" timestamp with time zone not null default now(),
    "archivado_por" uuid,
    "archivado_en" timestamp with time zone,
    "intento_archivado" integer not null default 0
      );



  create table "public"."conversaciones_plan" (
    "id" uuid not null default gen_random_uuid(),
    "plan_estudio_id" uuid not null,
    "openai_conversation_id" text not null,
    "estado" public.estado_conversacion not null default 'ACTIVA'::public.estado_conversacion,
    "conversacion_json" jsonb not null default '{}'::jsonb,
    "creado_por" uuid,
    "creado_en" timestamp with time zone not null default now(),
    "archivado_por" uuid,
    "archivado_en" timestamp with time zone,
    "intento_archivado" integer not null default 0
      );



  create table "public"."estados_plan" (
    "id" uuid not null default gen_random_uuid(),
    "clave" text not null,
    "etiqueta" text not null,
    "orden" integer not null default 0,
    "es_final" boolean not null default false
      );



  create table "public"."estructuras_asignatura" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "version" text,
    "definicion" jsonb not null default '{}'::jsonb,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."estructuras_plan" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "tipo" public.tipo_estructura_plan not null,
    "template_id" text,
    "definicion" jsonb not null default '{}'::jsonb,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."facultades" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" text not null,
    "nombre_corto" text,
    "color" text,
    "icono" text,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."interacciones_ia" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid,
    "plan_estudio_id" uuid,
    "asignatura_id" uuid,
    "tipo" public.tipo_interaccion_ia not null,
    "modelo" text,
    "temperatura" numeric,
    "prompt" jsonb not null default '{}'::jsonb,
    "respuesta" jsonb not null default '{}'::jsonb,
    "aceptada" boolean not null default false,
    "conversacion_id" text,
    "ids_archivos" jsonb not null default '[]'::jsonb,
    "ids_vector_store" jsonb not null default '[]'::jsonb,
    "creado_en" timestamp with time zone not null default now(),
    "rutas_storage" jsonb not null default '[]'::jsonb
      );



  create table "public"."lineas_plan" (
    "id" uuid not null default gen_random_uuid(),
    "plan_estudio_id" uuid not null,
    "nombre" text not null,
    "orden" integer not null default 0,
    "area" text,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."notificaciones" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid not null,
    "tipo" public.tipo_notificacion not null,
    "payload" jsonb not null default '{}'::jsonb,
    "leida" boolean not null default false,
    "creado_en" timestamp with time zone not null default now(),
    "leida_en" timestamp with time zone
      );



  create table "public"."planes_estudio" (
    "id" uuid not null default gen_random_uuid(),
    "carrera_id" uuid not null,
    "estructura_id" uuid not null,
    "nombre" text not null,
    "nivel" public.nivel_plan_estudio not null,
    "tipo_ciclo" public.tipo_ciclo not null,
    "numero_ciclos" integer not null,
    "datos" jsonb not null default '{}'::jsonb,
    "estado_actual_id" uuid,
    "activo" boolean not null default true,
    "tipo_origen" public.tipo_origen,
    "meta_origen" jsonb not null default '{}'::jsonb,
    "creado_por" uuid,
    "actualizado_por" uuid,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now(),
    "nombre_search" text generated always as (lower(public.unaccent_immutable(nombre))) stored,
    "plan_hash" text generated always as (encode(SUBSTRING(extensions.digest((id)::text, 'sha512'::text) FROM 1 FOR 12), 'hex'::text)) stored
      );



  create table "public"."responsables_asignatura" (
    "id" uuid not null default gen_random_uuid(),
    "asignatura_id" uuid not null,
    "usuario_id" uuid not null,
    "rol" public.rol_responsable_asignatura not null default 'PROFESOR_RESPONSABLE'::public.rol_responsable_asignatura,
    "creado_en" timestamp with time zone not null default now()
      );



  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "clave" text not null,
    "nombre" text not null,
    "descripcion" text
      );



  create table "public"."tareas_revision" (
    "id" uuid not null default gen_random_uuid(),
    "plan_estudio_id" uuid not null,
    "asignado_a" uuid not null,
    "rol_id" uuid,
    "estado_id" uuid,
    "estatus" public.estado_tarea_revision not null default 'PENDIENTE'::public.estado_tarea_revision,
    "fecha_limite" date,
    "creado_en" timestamp with time zone not null default now(),
    "completado_en" timestamp with time zone
      );



  create table "public"."transiciones_estado_plan" (
    "id" uuid not null default gen_random_uuid(),
    "desde_estado_id" uuid not null,
    "hacia_estado_id" uuid not null,
    "rol_permitido_id" uuid not null,
    "creado_en" timestamp with time zone not null default now()
      );



  create table "public"."usuarios_app" (
    "id" uuid not null,
    "nombre_completo" text,
    "email" text,
    "externo" boolean not null default false,
    "creado_en" timestamp with time zone not null default now(),
    "actualizado_en" timestamp with time zone not null default now()
      );



  create table "public"."usuarios_roles" (
    "id" uuid not null default gen_random_uuid(),
    "usuario_id" uuid not null,
    "rol_id" uuid not null,
    "facultad_id" uuid,
    "carrera_id" uuid,
    "creado_en" timestamp with time zone not null default now()
      );



  create table "public"."vector_stores" (
    "id" uuid not null default gen_random_uuid(),
    "openai_vector_id" text,
    "nombre" text not null,
    "creado_por" uuid,
    "creado_en" timestamp with time zone not null default now()
      );


CREATE UNIQUE INDEX archivos_pkey ON public.archivos USING btree (id);

CREATE UNIQUE INDEX asignaturas_orden_celda_unico ON public.asignaturas USING btree (plan_estudio_id, linea_plan_id, numero_ciclo, orden_celda) WHERE ((linea_plan_id IS NOT NULL) AND (numero_ciclo IS NOT NULL) AND (orden_celda IS NOT NULL));

CREATE UNIQUE INDEX asignaturas_pkey ON public.asignaturas USING btree (id);

CREATE INDEX asignaturas_plan_idx ON public.asignaturas USING btree (plan_estudio_id);

CREATE INDEX asignaturas_plan_linea_ciclo_idx ON public.asignaturas USING btree (plan_estudio_id, linea_plan_id, numero_ciclo);

CREATE INDEX bibliografia_asignatura_idx ON public.bibliografia_asignatura USING btree (asignatura_id);

CREATE UNIQUE INDEX bibliografia_asignatura_pkey ON public.bibliografia_asignatura USING btree (id);

CREATE UNIQUE INDEX cambios_asignatura_pkey ON public.cambios_asignatura USING btree (id);

CREATE UNIQUE INDEX cambios_plan_pkey ON public.cambios_plan USING btree (id);

CREATE UNIQUE INDEX carreras_pkey ON public.carreras USING btree (id);

CREATE UNIQUE INDEX conversaciones_asignatura_openai_id_unico ON public.conversaciones_asignatura USING btree (openai_conversation_id);

CREATE UNIQUE INDEX conversaciones_asignatura_pkey ON public.conversaciones_asignatura USING btree (id);

CREATE UNIQUE INDEX conversaciones_plan_openai_id_unico ON public.conversaciones_plan USING btree (openai_conversation_id);

CREATE UNIQUE INDEX conversaciones_plan_pkey ON public.conversaciones_plan USING btree (id);

CREATE UNIQUE INDEX estados_plan_clave_key ON public.estados_plan USING btree (clave);

CREATE UNIQUE INDEX estados_plan_pkey ON public.estados_plan USING btree (id);

CREATE UNIQUE INDEX estructuras_asignatura_pkey ON public.estructuras_asignatura USING btree (id);

CREATE UNIQUE INDEX estructuras_plan_pkey ON public.estructuras_plan USING btree (id);

CREATE UNIQUE INDEX facultades_pkey ON public.facultades USING btree (id);

CREATE INDEX idx_conv_asig_asignatura ON public.conversaciones_asignatura USING btree (asignatura_id);

CREATE INDEX idx_conv_asig_estado ON public.conversaciones_asignatura USING btree (estado);

CREATE INDEX idx_conv_plan_estado ON public.conversaciones_plan USING btree (estado);

CREATE INDEX idx_conv_plan_plan_estudio ON public.conversaciones_plan USING btree (plan_estudio_id);

CREATE INDEX idx_planes_nombre_search ON public.planes_estudio USING btree (nombre_search);

CREATE UNIQUE INDEX interacciones_ia_pkey ON public.interacciones_ia USING btree (id);

CREATE UNIQUE INDEX lineas_plan_id_plan_unico ON public.lineas_plan USING btree (id, plan_estudio_id);

CREATE UNIQUE INDEX lineas_plan_nombre_unico ON public.lineas_plan USING btree (plan_estudio_id, nombre);

CREATE UNIQUE INDEX lineas_plan_pkey ON public.lineas_plan USING btree (id);

CREATE UNIQUE INDEX notificaciones_pkey ON public.notificaciones USING btree (id);

CREATE UNIQUE INDEX planes_estudio_pkey ON public.planes_estudio USING btree (id);

CREATE UNIQUE INDEX responsables_asignatura_pkey ON public.responsables_asignatura USING btree (id);

CREATE UNIQUE INDEX responsables_asignatura_unico ON public.responsables_asignatura USING btree (asignatura_id, usuario_id, rol);

CREATE UNIQUE INDEX roles_clave_key ON public.roles USING btree (clave);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX tareas_revision_pkey ON public.tareas_revision USING btree (id);

CREATE UNIQUE INDEX transiciones_estado_plan_pkey ON public.transiciones_estado_plan USING btree (id);

CREATE UNIQUE INDEX transiciones_unica ON public.transiciones_estado_plan USING btree (desde_estado_id, hacia_estado_id, rol_permitido_id);

CREATE UNIQUE INDEX usuarios_app_email_unico ON public.usuarios_app USING btree (email);

CREATE UNIQUE INDEX usuarios_app_pkey ON public.usuarios_app USING btree (id);

CREATE UNIQUE INDEX usuarios_roles_pkey ON public.usuarios_roles USING btree (id);

CREATE UNIQUE INDEX vector_stores_pkey ON public.vector_stores USING btree (id);

alter table "public"."archivos" add constraint "archivos_pkey" PRIMARY KEY using index "archivos_pkey";

alter table "public"."asignaturas" add constraint "asignaturas_pkey" PRIMARY KEY using index "asignaturas_pkey";

alter table "public"."bibliografia_asignatura" add constraint "bibliografia_asignatura_pkey" PRIMARY KEY using index "bibliografia_asignatura_pkey";

alter table "public"."cambios_asignatura" add constraint "cambios_asignatura_pkey" PRIMARY KEY using index "cambios_asignatura_pkey";

alter table "public"."cambios_plan" add constraint "cambios_plan_pkey" PRIMARY KEY using index "cambios_plan_pkey";

alter table "public"."carreras" add constraint "carreras_pkey" PRIMARY KEY using index "carreras_pkey";

alter table "public"."conversaciones_asignatura" add constraint "conversaciones_asignatura_pkey" PRIMARY KEY using index "conversaciones_asignatura_pkey";

alter table "public"."conversaciones_plan" add constraint "conversaciones_plan_pkey" PRIMARY KEY using index "conversaciones_plan_pkey";

alter table "public"."estados_plan" add constraint "estados_plan_pkey" PRIMARY KEY using index "estados_plan_pkey";

alter table "public"."estructuras_asignatura" add constraint "estructuras_asignatura_pkey" PRIMARY KEY using index "estructuras_asignatura_pkey";

alter table "public"."estructuras_plan" add constraint "estructuras_plan_pkey" PRIMARY KEY using index "estructuras_plan_pkey";

alter table "public"."facultades" add constraint "facultades_pkey" PRIMARY KEY using index "facultades_pkey";

alter table "public"."interacciones_ia" add constraint "interacciones_ia_pkey" PRIMARY KEY using index "interacciones_ia_pkey";

alter table "public"."lineas_plan" add constraint "lineas_plan_pkey" PRIMARY KEY using index "lineas_plan_pkey";

alter table "public"."notificaciones" add constraint "notificaciones_pkey" PRIMARY KEY using index "notificaciones_pkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_pkey" PRIMARY KEY using index "planes_estudio_pkey";

alter table "public"."responsables_asignatura" add constraint "responsables_asignatura_pkey" PRIMARY KEY using index "responsables_asignatura_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."tareas_revision" add constraint "tareas_revision_pkey" PRIMARY KEY using index "tareas_revision_pkey";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_estado_plan_pkey" PRIMARY KEY using index "transiciones_estado_plan_pkey";

alter table "public"."usuarios_app" add constraint "usuarios_app_pkey" PRIMARY KEY using index "usuarios_app_pkey";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_pkey" PRIMARY KEY using index "usuarios_roles_pkey";

alter table "public"."vector_stores" add constraint "vector_stores_pkey" PRIMARY KEY using index "vector_stores_pkey";

alter table "public"."archivos" add constraint "archivos_subido_por_fkey" FOREIGN KEY (subido_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."archivos" validate constraint "archivos_subido_por_fkey";

alter table "public"."asignaturas" add constraint "asignaturas_actualizado_por_fkey" FOREIGN KEY (actualizado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_actualizado_por_fkey";

alter table "public"."asignaturas" add constraint "asignaturas_ciclo_chk" CHECK (((numero_ciclo IS NULL) OR (numero_ciclo > 0))) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_ciclo_chk";

alter table "public"."asignaturas" add constraint "asignaturas_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_creado_por_fkey";

alter table "public"."asignaturas" add constraint "asignaturas_creditos_check" CHECK ((creditos >= (0)::numeric)) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_creditos_check";

alter table "public"."asignaturas" add constraint "asignaturas_estructura_id_fkey" FOREIGN KEY (estructura_id) REFERENCES public.estructuras_asignatura(id) ON DELETE RESTRICT not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_estructura_id_fkey";

alter table "public"."asignaturas" add constraint "asignaturas_horas_academicas_check" CHECK (((horas_academicas IS NULL) OR (horas_academicas >= 0))) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_horas_academicas_check";

alter table "public"."asignaturas" add constraint "asignaturas_horas_independientes_check" CHECK (((horas_independientes IS NULL) OR (horas_independientes >= 0))) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_horas_independientes_check";

alter table "public"."asignaturas" add constraint "asignaturas_linea_plan_fk_compuesta" FOREIGN KEY (linea_plan_id, plan_estudio_id) REFERENCES public.lineas_plan(id, plan_estudio_id) ON DELETE SET NULL not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_linea_plan_fk_compuesta";

alter table "public"."asignaturas" add constraint "asignaturas_orden_celda_chk" CHECK (((orden_celda IS NULL) OR (orden_celda >= 0))) not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_orden_celda_chk";

alter table "public"."asignaturas" add constraint "asignaturas_plan_estudio_id_fkey" FOREIGN KEY (plan_estudio_id) REFERENCES public.planes_estudio(id) ON DELETE CASCADE not valid;

alter table "public"."asignaturas" validate constraint "asignaturas_plan_estudio_id_fkey";

alter table "public"."bibliografia_asignatura" add constraint "bibliografia_asignatura_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."bibliografia_asignatura" validate constraint "bibliografia_asignatura_asignatura_id_fkey";

alter table "public"."bibliografia_asignatura" add constraint "bibliografia_asignatura_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."bibliografia_asignatura" validate constraint "bibliografia_asignatura_creado_por_fkey";

alter table "public"."cambios_asignatura" add constraint "cambios_asignatura_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."cambios_asignatura" validate constraint "cambios_asignatura_asignatura_id_fkey";

alter table "public"."cambios_asignatura" add constraint "cambios_asignatura_cambiado_por_fkey" FOREIGN KEY (cambiado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."cambios_asignatura" validate constraint "cambios_asignatura_cambiado_por_fkey";

alter table "public"."cambios_plan" add constraint "cambios_plan_cambiado_por_fkey" FOREIGN KEY (cambiado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."cambios_plan" validate constraint "cambios_plan_cambiado_por_fkey";

alter table "public"."carreras" add constraint "carreras_facultad_id_fkey" FOREIGN KEY (facultad_id) REFERENCES public.facultades(id) ON DELETE RESTRICT not valid;

alter table "public"."carreras" validate constraint "carreras_facultad_id_fkey";

alter table "public"."conversaciones_asignatura" add constraint "conversaciones_asignatura_archivado_por_fkey" FOREIGN KEY (archivado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."conversaciones_asignatura" validate constraint "conversaciones_asignatura_archivado_por_fkey";

alter table "public"."conversaciones_asignatura" add constraint "conversaciones_asignatura_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."conversaciones_asignatura" validate constraint "conversaciones_asignatura_asignatura_id_fkey";

alter table "public"."conversaciones_asignatura" add constraint "conversaciones_asignatura_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."conversaciones_asignatura" validate constraint "conversaciones_asignatura_creado_por_fkey";

alter table "public"."conversaciones_asignatura" add constraint "conversaciones_asignatura_openai_id_unico" UNIQUE using index "conversaciones_asignatura_openai_id_unico";

alter table "public"."conversaciones_plan" add constraint "conversaciones_plan_archivado_por_fkey" FOREIGN KEY (archivado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."conversaciones_plan" validate constraint "conversaciones_plan_archivado_por_fkey";

alter table "public"."conversaciones_plan" add constraint "conversaciones_plan_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."conversaciones_plan" validate constraint "conversaciones_plan_creado_por_fkey";

alter table "public"."conversaciones_plan" add constraint "conversaciones_plan_openai_id_unico" UNIQUE using index "conversaciones_plan_openai_id_unico";

alter table "public"."conversaciones_plan" add constraint "conversaciones_plan_plan_estudio_id_fkey" FOREIGN KEY (plan_estudio_id) REFERENCES public.planes_estudio(id) ON DELETE CASCADE not valid;

alter table "public"."conversaciones_plan" validate constraint "conversaciones_plan_plan_estudio_id_fkey";

alter table "public"."estados_plan" add constraint "estados_plan_clave_key" UNIQUE using index "estados_plan_clave_key";

alter table "public"."interacciones_ia" add constraint "interacciones_ia_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."interacciones_ia" validate constraint "interacciones_ia_asignatura_id_fkey";

alter table "public"."interacciones_ia" add constraint "interacciones_ia_plan_estudio_id_fkey" FOREIGN KEY (plan_estudio_id) REFERENCES public.planes_estudio(id) ON DELETE CASCADE not valid;

alter table "public"."interacciones_ia" validate constraint "interacciones_ia_plan_estudio_id_fkey";

alter table "public"."interacciones_ia" add constraint "interacciones_ia_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."interacciones_ia" validate constraint "interacciones_ia_usuario_id_fkey";

alter table "public"."lineas_plan" add constraint "lineas_plan_id_plan_unico" UNIQUE using index "lineas_plan_id_plan_unico";

alter table "public"."lineas_plan" add constraint "lineas_plan_nombre_unico" UNIQUE using index "lineas_plan_nombre_unico";

alter table "public"."lineas_plan" add constraint "lineas_plan_plan_estudio_id_fkey" FOREIGN KEY (plan_estudio_id) REFERENCES public.planes_estudio(id) ON DELETE CASCADE not valid;

alter table "public"."lineas_plan" validate constraint "lineas_plan_plan_estudio_id_fkey";

alter table "public"."notificaciones" add constraint "notificaciones_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios_app(id) ON DELETE CASCADE not valid;

alter table "public"."notificaciones" validate constraint "notificaciones_usuario_id_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_actualizado_por_fkey" FOREIGN KEY (actualizado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_actualizado_por_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_carrera_id_fkey" FOREIGN KEY (carrera_id) REFERENCES public.carreras(id) ON DELETE RESTRICT not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_carrera_id_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_creado_por_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_estado_actual_id_fkey" FOREIGN KEY (estado_actual_id) REFERENCES public.estados_plan(id) ON DELETE SET NULL not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_estado_actual_id_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_estructura_id_fkey" FOREIGN KEY (estructura_id) REFERENCES public.estructuras_plan(id) ON DELETE RESTRICT not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_estructura_id_fkey";

alter table "public"."planes_estudio" add constraint "planes_estudio_numero_ciclos_check" CHECK ((numero_ciclos > 0)) not valid;

alter table "public"."planes_estudio" validate constraint "planes_estudio_numero_ciclos_check";

alter table "public"."responsables_asignatura" add constraint "responsables_asignatura_asignatura_id_fkey" FOREIGN KEY (asignatura_id) REFERENCES public.asignaturas(id) ON DELETE CASCADE not valid;

alter table "public"."responsables_asignatura" validate constraint "responsables_asignatura_asignatura_id_fkey";

alter table "public"."responsables_asignatura" add constraint "responsables_asignatura_unico" UNIQUE using index "responsables_asignatura_unico";

alter table "public"."responsables_asignatura" add constraint "responsables_asignatura_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios_app(id) ON DELETE CASCADE not valid;

alter table "public"."responsables_asignatura" validate constraint "responsables_asignatura_usuario_id_fkey";

alter table "public"."roles" add constraint "roles_clave_key" UNIQUE using index "roles_clave_key";

alter table "public"."tareas_revision" add constraint "tareas_revision_asignado_a_fkey" FOREIGN KEY (asignado_a) REFERENCES public.usuarios_app(id) ON DELETE CASCADE not valid;

alter table "public"."tareas_revision" validate constraint "tareas_revision_asignado_a_fkey";

alter table "public"."tareas_revision" add constraint "tareas_revision_estado_id_fkey" FOREIGN KEY (estado_id) REFERENCES public.estados_plan(id) ON DELETE SET NULL not valid;

alter table "public"."tareas_revision" validate constraint "tareas_revision_estado_id_fkey";

alter table "public"."tareas_revision" add constraint "tareas_revision_plan_estudio_id_fkey" FOREIGN KEY (plan_estudio_id) REFERENCES public.planes_estudio(id) ON DELETE CASCADE not valid;

alter table "public"."tareas_revision" validate constraint "tareas_revision_plan_estudio_id_fkey";

alter table "public"."tareas_revision" add constraint "tareas_revision_rol_id_fkey" FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE SET NULL not valid;

alter table "public"."tareas_revision" validate constraint "tareas_revision_rol_id_fkey";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_estado_plan_desde_estado_id_fkey" FOREIGN KEY (desde_estado_id) REFERENCES public.estados_plan(id) ON DELETE CASCADE not valid;

alter table "public"."transiciones_estado_plan" validate constraint "transiciones_estado_plan_desde_estado_id_fkey";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_estado_plan_hacia_estado_id_fkey" FOREIGN KEY (hacia_estado_id) REFERENCES public.estados_plan(id) ON DELETE CASCADE not valid;

alter table "public"."transiciones_estado_plan" validate constraint "transiciones_estado_plan_hacia_estado_id_fkey";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_estado_plan_rol_permitido_id_fkey" FOREIGN KEY (rol_permitido_id) REFERENCES public.roles(id) ON DELETE RESTRICT not valid;

alter table "public"."transiciones_estado_plan" validate constraint "transiciones_estado_plan_rol_permitido_id_fkey";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_no_auto_chk" CHECK ((desde_estado_id <> hacia_estado_id)) not valid;

alter table "public"."transiciones_estado_plan" validate constraint "transiciones_no_auto_chk";

alter table "public"."transiciones_estado_plan" add constraint "transiciones_unica" UNIQUE using index "transiciones_unica";

alter table "public"."usuarios_app" add constraint "usuarios_app_email_unico" UNIQUE using index "usuarios_app_email_unico";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_alcance_chk" CHECK (((facultad_id IS NOT NULL) OR (carrera_id IS NOT NULL))) not valid;

alter table "public"."usuarios_roles" validate constraint "usuarios_roles_alcance_chk";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_carrera_id_fkey" FOREIGN KEY (carrera_id) REFERENCES public.carreras(id) ON DELETE CASCADE not valid;

alter table "public"."usuarios_roles" validate constraint "usuarios_roles_carrera_id_fkey";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_facultad_id_fkey" FOREIGN KEY (facultad_id) REFERENCES public.facultades(id) ON DELETE CASCADE not valid;

alter table "public"."usuarios_roles" validate constraint "usuarios_roles_facultad_id_fkey";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_rol_id_fkey" FOREIGN KEY (rol_id) REFERENCES public.roles(id) ON DELETE RESTRICT not valid;

alter table "public"."usuarios_roles" validate constraint "usuarios_roles_rol_id_fkey";

alter table "public"."usuarios_roles" add constraint "usuarios_roles_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios_app(id) ON DELETE CASCADE not valid;

alter table "public"."usuarios_roles" validate constraint "usuarios_roles_usuario_id_fkey";

alter table "public"."vector_stores" add constraint "vector_stores_creado_por_fkey" FOREIGN KEY (creado_por) REFERENCES public.usuarios_app(id) ON DELETE SET NULL not valid;

alter table "public"."vector_stores" validate constraint "vector_stores_creado_por_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_log_cambios_planes_estudio()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$declare
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
end;$function$
;

create or replace view "public"."plantilla_plan" as  SELECT plan.id AS plan_estudio_id,
    struct.id AS estructura_id,
    struct.template_id
   FROM (public.planes_estudio plan
     JOIN public.estructuras_plan struct ON ((plan.estructura_id = struct.id)));


CREATE OR REPLACE FUNCTION public.set_actualizado_en()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.actualizado_en = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.unaccent_immutable(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
AS $function$
  SELECT public.unaccent('public.unaccent', $1);
$function$
;

CREATE OR REPLACE FUNCTION public.validar_numero_ciclo_asignatura()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

grant delete on table "public"."archivos" to "anon";

grant insert on table "public"."archivos" to "anon";

grant references on table "public"."archivos" to "anon";

grant select on table "public"."archivos" to "anon";

grant trigger on table "public"."archivos" to "anon";

grant truncate on table "public"."archivos" to "anon";

grant update on table "public"."archivos" to "anon";

grant delete on table "public"."archivos" to "authenticated";

grant insert on table "public"."archivos" to "authenticated";

grant references on table "public"."archivos" to "authenticated";

grant select on table "public"."archivos" to "authenticated";

grant trigger on table "public"."archivos" to "authenticated";

grant truncate on table "public"."archivos" to "authenticated";

grant update on table "public"."archivos" to "authenticated";

grant delete on table "public"."archivos" to "service_role";

grant insert on table "public"."archivos" to "service_role";

grant references on table "public"."archivos" to "service_role";

grant select on table "public"."archivos" to "service_role";

grant trigger on table "public"."archivos" to "service_role";

grant truncate on table "public"."archivos" to "service_role";

grant update on table "public"."archivos" to "service_role";

grant delete on table "public"."asignaturas" to "anon";

grant insert on table "public"."asignaturas" to "anon";

grant references on table "public"."asignaturas" to "anon";

grant select on table "public"."asignaturas" to "anon";

grant trigger on table "public"."asignaturas" to "anon";

grant truncate on table "public"."asignaturas" to "anon";

grant update on table "public"."asignaturas" to "anon";

grant delete on table "public"."asignaturas" to "authenticated";

grant insert on table "public"."asignaturas" to "authenticated";

grant references on table "public"."asignaturas" to "authenticated";

grant select on table "public"."asignaturas" to "authenticated";

grant trigger on table "public"."asignaturas" to "authenticated";

grant truncate on table "public"."asignaturas" to "authenticated";

grant update on table "public"."asignaturas" to "authenticated";

grant delete on table "public"."asignaturas" to "service_role";

grant insert on table "public"."asignaturas" to "service_role";

grant references on table "public"."asignaturas" to "service_role";

grant select on table "public"."asignaturas" to "service_role";

grant trigger on table "public"."asignaturas" to "service_role";

grant truncate on table "public"."asignaturas" to "service_role";

grant update on table "public"."asignaturas" to "service_role";

grant delete on table "public"."bibliografia_asignatura" to "anon";

grant insert on table "public"."bibliografia_asignatura" to "anon";

grant references on table "public"."bibliografia_asignatura" to "anon";

grant select on table "public"."bibliografia_asignatura" to "anon";

grant trigger on table "public"."bibliografia_asignatura" to "anon";

grant truncate on table "public"."bibliografia_asignatura" to "anon";

grant update on table "public"."bibliografia_asignatura" to "anon";

grant delete on table "public"."bibliografia_asignatura" to "authenticated";

grant insert on table "public"."bibliografia_asignatura" to "authenticated";

grant references on table "public"."bibliografia_asignatura" to "authenticated";

grant select on table "public"."bibliografia_asignatura" to "authenticated";

grant trigger on table "public"."bibliografia_asignatura" to "authenticated";

grant truncate on table "public"."bibliografia_asignatura" to "authenticated";

grant update on table "public"."bibliografia_asignatura" to "authenticated";

grant delete on table "public"."bibliografia_asignatura" to "service_role";

grant insert on table "public"."bibliografia_asignatura" to "service_role";

grant references on table "public"."bibliografia_asignatura" to "service_role";

grant select on table "public"."bibliografia_asignatura" to "service_role";

grant trigger on table "public"."bibliografia_asignatura" to "service_role";

grant truncate on table "public"."bibliografia_asignatura" to "service_role";

grant update on table "public"."bibliografia_asignatura" to "service_role";

grant delete on table "public"."cambios_asignatura" to "anon";

grant insert on table "public"."cambios_asignatura" to "anon";

grant references on table "public"."cambios_asignatura" to "anon";

grant select on table "public"."cambios_asignatura" to "anon";

grant trigger on table "public"."cambios_asignatura" to "anon";

grant truncate on table "public"."cambios_asignatura" to "anon";

grant update on table "public"."cambios_asignatura" to "anon";

grant delete on table "public"."cambios_asignatura" to "authenticated";

grant insert on table "public"."cambios_asignatura" to "authenticated";

grant references on table "public"."cambios_asignatura" to "authenticated";

grant select on table "public"."cambios_asignatura" to "authenticated";

grant trigger on table "public"."cambios_asignatura" to "authenticated";

grant truncate on table "public"."cambios_asignatura" to "authenticated";

grant update on table "public"."cambios_asignatura" to "authenticated";

grant delete on table "public"."cambios_asignatura" to "service_role";

grant insert on table "public"."cambios_asignatura" to "service_role";

grant references on table "public"."cambios_asignatura" to "service_role";

grant select on table "public"."cambios_asignatura" to "service_role";

grant trigger on table "public"."cambios_asignatura" to "service_role";

grant truncate on table "public"."cambios_asignatura" to "service_role";

grant update on table "public"."cambios_asignatura" to "service_role";

grant delete on table "public"."cambios_plan" to "anon";

grant insert on table "public"."cambios_plan" to "anon";

grant references on table "public"."cambios_plan" to "anon";

grant select on table "public"."cambios_plan" to "anon";

grant trigger on table "public"."cambios_plan" to "anon";

grant truncate on table "public"."cambios_plan" to "anon";

grant update on table "public"."cambios_plan" to "anon";

grant delete on table "public"."cambios_plan" to "authenticated";

grant insert on table "public"."cambios_plan" to "authenticated";

grant references on table "public"."cambios_plan" to "authenticated";

grant select on table "public"."cambios_plan" to "authenticated";

grant trigger on table "public"."cambios_plan" to "authenticated";

grant truncate on table "public"."cambios_plan" to "authenticated";

grant update on table "public"."cambios_plan" to "authenticated";

grant delete on table "public"."cambios_plan" to "service_role";

grant insert on table "public"."cambios_plan" to "service_role";

grant references on table "public"."cambios_plan" to "service_role";

grant select on table "public"."cambios_plan" to "service_role";

grant trigger on table "public"."cambios_plan" to "service_role";

grant truncate on table "public"."cambios_plan" to "service_role";

grant update on table "public"."cambios_plan" to "service_role";

grant delete on table "public"."carreras" to "anon";

grant insert on table "public"."carreras" to "anon";

grant references on table "public"."carreras" to "anon";

grant select on table "public"."carreras" to "anon";

grant trigger on table "public"."carreras" to "anon";

grant truncate on table "public"."carreras" to "anon";

grant update on table "public"."carreras" to "anon";

grant delete on table "public"."carreras" to "authenticated";

grant insert on table "public"."carreras" to "authenticated";

grant references on table "public"."carreras" to "authenticated";

grant select on table "public"."carreras" to "authenticated";

grant trigger on table "public"."carreras" to "authenticated";

grant truncate on table "public"."carreras" to "authenticated";

grant update on table "public"."carreras" to "authenticated";

grant delete on table "public"."carreras" to "service_role";

grant insert on table "public"."carreras" to "service_role";

grant references on table "public"."carreras" to "service_role";

grant select on table "public"."carreras" to "service_role";

grant trigger on table "public"."carreras" to "service_role";

grant truncate on table "public"."carreras" to "service_role";

grant update on table "public"."carreras" to "service_role";

grant delete on table "public"."conversaciones_asignatura" to "anon";

grant insert on table "public"."conversaciones_asignatura" to "anon";

grant references on table "public"."conversaciones_asignatura" to "anon";

grant select on table "public"."conversaciones_asignatura" to "anon";

grant trigger on table "public"."conversaciones_asignatura" to "anon";

grant truncate on table "public"."conversaciones_asignatura" to "anon";

grant update on table "public"."conversaciones_asignatura" to "anon";

grant delete on table "public"."conversaciones_asignatura" to "authenticated";

grant insert on table "public"."conversaciones_asignatura" to "authenticated";

grant references on table "public"."conversaciones_asignatura" to "authenticated";

grant select on table "public"."conversaciones_asignatura" to "authenticated";

grant trigger on table "public"."conversaciones_asignatura" to "authenticated";

grant truncate on table "public"."conversaciones_asignatura" to "authenticated";

grant update on table "public"."conversaciones_asignatura" to "authenticated";

grant delete on table "public"."conversaciones_asignatura" to "service_role";

grant insert on table "public"."conversaciones_asignatura" to "service_role";

grant references on table "public"."conversaciones_asignatura" to "service_role";

grant select on table "public"."conversaciones_asignatura" to "service_role";

grant trigger on table "public"."conversaciones_asignatura" to "service_role";

grant truncate on table "public"."conversaciones_asignatura" to "service_role";

grant update on table "public"."conversaciones_asignatura" to "service_role";

grant delete on table "public"."conversaciones_plan" to "anon";

grant insert on table "public"."conversaciones_plan" to "anon";

grant references on table "public"."conversaciones_plan" to "anon";

grant select on table "public"."conversaciones_plan" to "anon";

grant trigger on table "public"."conversaciones_plan" to "anon";

grant truncate on table "public"."conversaciones_plan" to "anon";

grant update on table "public"."conversaciones_plan" to "anon";

grant delete on table "public"."conversaciones_plan" to "authenticated";

grant insert on table "public"."conversaciones_plan" to "authenticated";

grant references on table "public"."conversaciones_plan" to "authenticated";

grant select on table "public"."conversaciones_plan" to "authenticated";

grant trigger on table "public"."conversaciones_plan" to "authenticated";

grant truncate on table "public"."conversaciones_plan" to "authenticated";

grant update on table "public"."conversaciones_plan" to "authenticated";

grant delete on table "public"."conversaciones_plan" to "service_role";

grant insert on table "public"."conversaciones_plan" to "service_role";

grant references on table "public"."conversaciones_plan" to "service_role";

grant select on table "public"."conversaciones_plan" to "service_role";

grant trigger on table "public"."conversaciones_plan" to "service_role";

grant truncate on table "public"."conversaciones_plan" to "service_role";

grant update on table "public"."conversaciones_plan" to "service_role";

grant delete on table "public"."estados_plan" to "anon";

grant insert on table "public"."estados_plan" to "anon";

grant references on table "public"."estados_plan" to "anon";

grant select on table "public"."estados_plan" to "anon";

grant trigger on table "public"."estados_plan" to "anon";

grant truncate on table "public"."estados_plan" to "anon";

grant update on table "public"."estados_plan" to "anon";

grant delete on table "public"."estados_plan" to "authenticated";

grant insert on table "public"."estados_plan" to "authenticated";

grant references on table "public"."estados_plan" to "authenticated";

grant select on table "public"."estados_plan" to "authenticated";

grant trigger on table "public"."estados_plan" to "authenticated";

grant truncate on table "public"."estados_plan" to "authenticated";

grant update on table "public"."estados_plan" to "authenticated";

grant delete on table "public"."estados_plan" to "service_role";

grant insert on table "public"."estados_plan" to "service_role";

grant references on table "public"."estados_plan" to "service_role";

grant select on table "public"."estados_plan" to "service_role";

grant trigger on table "public"."estados_plan" to "service_role";

grant truncate on table "public"."estados_plan" to "service_role";

grant update on table "public"."estados_plan" to "service_role";

grant delete on table "public"."estructuras_asignatura" to "anon";

grant insert on table "public"."estructuras_asignatura" to "anon";

grant references on table "public"."estructuras_asignatura" to "anon";

grant select on table "public"."estructuras_asignatura" to "anon";

grant trigger on table "public"."estructuras_asignatura" to "anon";

grant truncate on table "public"."estructuras_asignatura" to "anon";

grant update on table "public"."estructuras_asignatura" to "anon";

grant delete on table "public"."estructuras_asignatura" to "authenticated";

grant insert on table "public"."estructuras_asignatura" to "authenticated";

grant references on table "public"."estructuras_asignatura" to "authenticated";

grant select on table "public"."estructuras_asignatura" to "authenticated";

grant trigger on table "public"."estructuras_asignatura" to "authenticated";

grant truncate on table "public"."estructuras_asignatura" to "authenticated";

grant update on table "public"."estructuras_asignatura" to "authenticated";

grant delete on table "public"."estructuras_asignatura" to "service_role";

grant insert on table "public"."estructuras_asignatura" to "service_role";

grant references on table "public"."estructuras_asignatura" to "service_role";

grant select on table "public"."estructuras_asignatura" to "service_role";

grant trigger on table "public"."estructuras_asignatura" to "service_role";

grant truncate on table "public"."estructuras_asignatura" to "service_role";

grant update on table "public"."estructuras_asignatura" to "service_role";

grant delete on table "public"."estructuras_plan" to "anon";

grant insert on table "public"."estructuras_plan" to "anon";

grant references on table "public"."estructuras_plan" to "anon";

grant select on table "public"."estructuras_plan" to "anon";

grant trigger on table "public"."estructuras_plan" to "anon";

grant truncate on table "public"."estructuras_plan" to "anon";

grant update on table "public"."estructuras_plan" to "anon";

grant delete on table "public"."estructuras_plan" to "authenticated";

grant insert on table "public"."estructuras_plan" to "authenticated";

grant references on table "public"."estructuras_plan" to "authenticated";

grant select on table "public"."estructuras_plan" to "authenticated";

grant trigger on table "public"."estructuras_plan" to "authenticated";

grant truncate on table "public"."estructuras_plan" to "authenticated";

grant update on table "public"."estructuras_plan" to "authenticated";

grant delete on table "public"."estructuras_plan" to "service_role";

grant insert on table "public"."estructuras_plan" to "service_role";

grant references on table "public"."estructuras_plan" to "service_role";

grant select on table "public"."estructuras_plan" to "service_role";

grant trigger on table "public"."estructuras_plan" to "service_role";

grant truncate on table "public"."estructuras_plan" to "service_role";

grant update on table "public"."estructuras_plan" to "service_role";

grant delete on table "public"."facultades" to "anon";

grant insert on table "public"."facultades" to "anon";

grant references on table "public"."facultades" to "anon";

grant select on table "public"."facultades" to "anon";

grant trigger on table "public"."facultades" to "anon";

grant truncate on table "public"."facultades" to "anon";

grant update on table "public"."facultades" to "anon";

grant delete on table "public"."facultades" to "authenticated";

grant insert on table "public"."facultades" to "authenticated";

grant references on table "public"."facultades" to "authenticated";

grant select on table "public"."facultades" to "authenticated";

grant trigger on table "public"."facultades" to "authenticated";

grant truncate on table "public"."facultades" to "authenticated";

grant update on table "public"."facultades" to "authenticated";

grant delete on table "public"."facultades" to "service_role";

grant insert on table "public"."facultades" to "service_role";

grant references on table "public"."facultades" to "service_role";

grant select on table "public"."facultades" to "service_role";

grant trigger on table "public"."facultades" to "service_role";

grant truncate on table "public"."facultades" to "service_role";

grant update on table "public"."facultades" to "service_role";

grant delete on table "public"."interacciones_ia" to "anon";

grant insert on table "public"."interacciones_ia" to "anon";

grant references on table "public"."interacciones_ia" to "anon";

grant select on table "public"."interacciones_ia" to "anon";

grant trigger on table "public"."interacciones_ia" to "anon";

grant truncate on table "public"."interacciones_ia" to "anon";

grant update on table "public"."interacciones_ia" to "anon";

grant delete on table "public"."interacciones_ia" to "authenticated";

grant insert on table "public"."interacciones_ia" to "authenticated";

grant references on table "public"."interacciones_ia" to "authenticated";

grant select on table "public"."interacciones_ia" to "authenticated";

grant trigger on table "public"."interacciones_ia" to "authenticated";

grant truncate on table "public"."interacciones_ia" to "authenticated";

grant update on table "public"."interacciones_ia" to "authenticated";

grant delete on table "public"."interacciones_ia" to "service_role";

grant insert on table "public"."interacciones_ia" to "service_role";

grant references on table "public"."interacciones_ia" to "service_role";

grant select on table "public"."interacciones_ia" to "service_role";

grant trigger on table "public"."interacciones_ia" to "service_role";

grant truncate on table "public"."interacciones_ia" to "service_role";

grant update on table "public"."interacciones_ia" to "service_role";

grant delete on table "public"."lineas_plan" to "anon";

grant insert on table "public"."lineas_plan" to "anon";

grant references on table "public"."lineas_plan" to "anon";

grant select on table "public"."lineas_plan" to "anon";

grant trigger on table "public"."lineas_plan" to "anon";

grant truncate on table "public"."lineas_plan" to "anon";

grant update on table "public"."lineas_plan" to "anon";

grant delete on table "public"."lineas_plan" to "authenticated";

grant insert on table "public"."lineas_plan" to "authenticated";

grant references on table "public"."lineas_plan" to "authenticated";

grant select on table "public"."lineas_plan" to "authenticated";

grant trigger on table "public"."lineas_plan" to "authenticated";

grant truncate on table "public"."lineas_plan" to "authenticated";

grant update on table "public"."lineas_plan" to "authenticated";

grant delete on table "public"."lineas_plan" to "service_role";

grant insert on table "public"."lineas_plan" to "service_role";

grant references on table "public"."lineas_plan" to "service_role";

grant select on table "public"."lineas_plan" to "service_role";

grant trigger on table "public"."lineas_plan" to "service_role";

grant truncate on table "public"."lineas_plan" to "service_role";

grant update on table "public"."lineas_plan" to "service_role";

grant delete on table "public"."notificaciones" to "anon";

grant insert on table "public"."notificaciones" to "anon";

grant references on table "public"."notificaciones" to "anon";

grant select on table "public"."notificaciones" to "anon";

grant trigger on table "public"."notificaciones" to "anon";

grant truncate on table "public"."notificaciones" to "anon";

grant update on table "public"."notificaciones" to "anon";

grant delete on table "public"."notificaciones" to "authenticated";

grant insert on table "public"."notificaciones" to "authenticated";

grant references on table "public"."notificaciones" to "authenticated";

grant select on table "public"."notificaciones" to "authenticated";

grant trigger on table "public"."notificaciones" to "authenticated";

grant truncate on table "public"."notificaciones" to "authenticated";

grant update on table "public"."notificaciones" to "authenticated";

grant delete on table "public"."notificaciones" to "service_role";

grant insert on table "public"."notificaciones" to "service_role";

grant references on table "public"."notificaciones" to "service_role";

grant select on table "public"."notificaciones" to "service_role";

grant trigger on table "public"."notificaciones" to "service_role";

grant truncate on table "public"."notificaciones" to "service_role";

grant update on table "public"."notificaciones" to "service_role";

grant delete on table "public"."planes_estudio" to "anon";

grant insert on table "public"."planes_estudio" to "anon";

grant references on table "public"."planes_estudio" to "anon";

grant select on table "public"."planes_estudio" to "anon";

grant trigger on table "public"."planes_estudio" to "anon";

grant truncate on table "public"."planes_estudio" to "anon";

grant update on table "public"."planes_estudio" to "anon";

grant delete on table "public"."planes_estudio" to "authenticated";

grant insert on table "public"."planes_estudio" to "authenticated";

grant references on table "public"."planes_estudio" to "authenticated";

grant select on table "public"."planes_estudio" to "authenticated";

grant trigger on table "public"."planes_estudio" to "authenticated";

grant truncate on table "public"."planes_estudio" to "authenticated";

grant update on table "public"."planes_estudio" to "authenticated";

grant delete on table "public"."planes_estudio" to "service_role";

grant insert on table "public"."planes_estudio" to "service_role";

grant references on table "public"."planes_estudio" to "service_role";

grant select on table "public"."planes_estudio" to "service_role";

grant trigger on table "public"."planes_estudio" to "service_role";

grant truncate on table "public"."planes_estudio" to "service_role";

grant update on table "public"."planes_estudio" to "service_role";

grant delete on table "public"."responsables_asignatura" to "anon";

grant insert on table "public"."responsables_asignatura" to "anon";

grant references on table "public"."responsables_asignatura" to "anon";

grant select on table "public"."responsables_asignatura" to "anon";

grant trigger on table "public"."responsables_asignatura" to "anon";

grant truncate on table "public"."responsables_asignatura" to "anon";

grant update on table "public"."responsables_asignatura" to "anon";

grant delete on table "public"."responsables_asignatura" to "authenticated";

grant insert on table "public"."responsables_asignatura" to "authenticated";

grant references on table "public"."responsables_asignatura" to "authenticated";

grant select on table "public"."responsables_asignatura" to "authenticated";

grant trigger on table "public"."responsables_asignatura" to "authenticated";

grant truncate on table "public"."responsables_asignatura" to "authenticated";

grant update on table "public"."responsables_asignatura" to "authenticated";

grant delete on table "public"."responsables_asignatura" to "service_role";

grant insert on table "public"."responsables_asignatura" to "service_role";

grant references on table "public"."responsables_asignatura" to "service_role";

grant select on table "public"."responsables_asignatura" to "service_role";

grant trigger on table "public"."responsables_asignatura" to "service_role";

grant truncate on table "public"."responsables_asignatura" to "service_role";

grant update on table "public"."responsables_asignatura" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."tareas_revision" to "anon";

grant insert on table "public"."tareas_revision" to "anon";

grant references on table "public"."tareas_revision" to "anon";

grant select on table "public"."tareas_revision" to "anon";

grant trigger on table "public"."tareas_revision" to "anon";

grant truncate on table "public"."tareas_revision" to "anon";

grant update on table "public"."tareas_revision" to "anon";

grant delete on table "public"."tareas_revision" to "authenticated";

grant insert on table "public"."tareas_revision" to "authenticated";

grant references on table "public"."tareas_revision" to "authenticated";

grant select on table "public"."tareas_revision" to "authenticated";

grant trigger on table "public"."tareas_revision" to "authenticated";

grant truncate on table "public"."tareas_revision" to "authenticated";

grant update on table "public"."tareas_revision" to "authenticated";

grant delete on table "public"."tareas_revision" to "service_role";

grant insert on table "public"."tareas_revision" to "service_role";

grant references on table "public"."tareas_revision" to "service_role";

grant select on table "public"."tareas_revision" to "service_role";

grant trigger on table "public"."tareas_revision" to "service_role";

grant truncate on table "public"."tareas_revision" to "service_role";

grant update on table "public"."tareas_revision" to "service_role";

grant delete on table "public"."transiciones_estado_plan" to "anon";

grant insert on table "public"."transiciones_estado_plan" to "anon";

grant references on table "public"."transiciones_estado_plan" to "anon";

grant select on table "public"."transiciones_estado_plan" to "anon";

grant trigger on table "public"."transiciones_estado_plan" to "anon";

grant truncate on table "public"."transiciones_estado_plan" to "anon";

grant update on table "public"."transiciones_estado_plan" to "anon";

grant delete on table "public"."transiciones_estado_plan" to "authenticated";

grant insert on table "public"."transiciones_estado_plan" to "authenticated";

grant references on table "public"."transiciones_estado_plan" to "authenticated";

grant select on table "public"."transiciones_estado_plan" to "authenticated";

grant trigger on table "public"."transiciones_estado_plan" to "authenticated";

grant truncate on table "public"."transiciones_estado_plan" to "authenticated";

grant update on table "public"."transiciones_estado_plan" to "authenticated";

grant delete on table "public"."transiciones_estado_plan" to "service_role";

grant insert on table "public"."transiciones_estado_plan" to "service_role";

grant references on table "public"."transiciones_estado_plan" to "service_role";

grant select on table "public"."transiciones_estado_plan" to "service_role";

grant trigger on table "public"."transiciones_estado_plan" to "service_role";

grant truncate on table "public"."transiciones_estado_plan" to "service_role";

grant update on table "public"."transiciones_estado_plan" to "service_role";

grant delete on table "public"."usuarios_app" to "anon";

grant insert on table "public"."usuarios_app" to "anon";

grant references on table "public"."usuarios_app" to "anon";

grant select on table "public"."usuarios_app" to "anon";

grant trigger on table "public"."usuarios_app" to "anon";

grant truncate on table "public"."usuarios_app" to "anon";

grant update on table "public"."usuarios_app" to "anon";

grant delete on table "public"."usuarios_app" to "authenticated";

grant insert on table "public"."usuarios_app" to "authenticated";

grant references on table "public"."usuarios_app" to "authenticated";

grant select on table "public"."usuarios_app" to "authenticated";

grant trigger on table "public"."usuarios_app" to "authenticated";

grant truncate on table "public"."usuarios_app" to "authenticated";

grant update on table "public"."usuarios_app" to "authenticated";

grant delete on table "public"."usuarios_app" to "service_role";

grant insert on table "public"."usuarios_app" to "service_role";

grant references on table "public"."usuarios_app" to "service_role";

grant select on table "public"."usuarios_app" to "service_role";

grant trigger on table "public"."usuarios_app" to "service_role";

grant truncate on table "public"."usuarios_app" to "service_role";

grant update on table "public"."usuarios_app" to "service_role";

grant delete on table "public"."usuarios_roles" to "anon";

grant insert on table "public"."usuarios_roles" to "anon";

grant references on table "public"."usuarios_roles" to "anon";

grant select on table "public"."usuarios_roles" to "anon";

grant trigger on table "public"."usuarios_roles" to "anon";

grant truncate on table "public"."usuarios_roles" to "anon";

grant update on table "public"."usuarios_roles" to "anon";

grant delete on table "public"."usuarios_roles" to "authenticated";

grant insert on table "public"."usuarios_roles" to "authenticated";

grant references on table "public"."usuarios_roles" to "authenticated";

grant select on table "public"."usuarios_roles" to "authenticated";

grant trigger on table "public"."usuarios_roles" to "authenticated";

grant truncate on table "public"."usuarios_roles" to "authenticated";

grant update on table "public"."usuarios_roles" to "authenticated";

grant delete on table "public"."usuarios_roles" to "service_role";

grant insert on table "public"."usuarios_roles" to "service_role";

grant references on table "public"."usuarios_roles" to "service_role";

grant select on table "public"."usuarios_roles" to "service_role";

grant trigger on table "public"."usuarios_roles" to "service_role";

grant truncate on table "public"."usuarios_roles" to "service_role";

grant update on table "public"."usuarios_roles" to "service_role";

grant delete on table "public"."vector_stores" to "anon";

grant insert on table "public"."vector_stores" to "anon";

grant references on table "public"."vector_stores" to "anon";

grant select on table "public"."vector_stores" to "anon";

grant trigger on table "public"."vector_stores" to "anon";

grant truncate on table "public"."vector_stores" to "anon";

grant update on table "public"."vector_stores" to "anon";

grant delete on table "public"."vector_stores" to "authenticated";

grant insert on table "public"."vector_stores" to "authenticated";

grant references on table "public"."vector_stores" to "authenticated";

grant select on table "public"."vector_stores" to "authenticated";

grant trigger on table "public"."vector_stores" to "authenticated";

grant truncate on table "public"."vector_stores" to "authenticated";

grant update on table "public"."vector_stores" to "authenticated";

grant delete on table "public"."vector_stores" to "service_role";

grant insert on table "public"."vector_stores" to "service_role";

grant references on table "public"."vector_stores" to "service_role";

grant select on table "public"."vector_stores" to "service_role";

grant trigger on table "public"."vector_stores" to "service_role";

grant truncate on table "public"."vector_stores" to "service_role";

grant update on table "public"."vector_stores" to "service_role";

CREATE TRIGGER trg_asignaturas_actualizado_en BEFORE UPDATE ON public.asignaturas FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_validar_numero_ciclo_asignatura BEFORE INSERT OR UPDATE OF numero_ciclo, plan_estudio_id ON public.asignaturas FOR EACH ROW EXECUTE FUNCTION public.validar_numero_ciclo_asignatura();

CREATE TRIGGER trg_bibliografia_asignatura_actualizado_en BEFORE UPDATE ON public.bibliografia_asignatura FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_carreras_actualizado_en BEFORE UPDATE ON public.carreras FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_estructuras_asignatura_actualizado_en BEFORE UPDATE ON public.estructuras_asignatura FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_estructuras_plan_actualizado_en BEFORE UPDATE ON public.estructuras_plan FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_facultades_actualizado_en BEFORE UPDATE ON public.facultades FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_lineas_plan_actualizado_en BEFORE UPDATE ON public.lineas_plan FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_planes_estudio_actualizado_en BEFORE UPDATE ON public.planes_estudio FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();

CREATE TRIGGER trg_planes_estudio_log_cambios AFTER INSERT OR DELETE OR UPDATE ON public.planes_estudio FOR EACH ROW EXECUTE FUNCTION public.fn_log_cambios_planes_estudio();

CREATE TRIGGER trg_usuarios_app_actualizado_en BEFORE UPDATE ON public.usuarios_app FOR EACH ROW EXECUTE FUNCTION public.set_actualizado_en();


