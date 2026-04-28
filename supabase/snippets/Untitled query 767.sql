ALTER TABLE carreras
ADD COLUMN nivel nivel_plan_estudio;

UPDATE carreras c
SET nivel = p.nivel
FROM planes_estudio p
WHERE p.carrera_id = c.id;


ALTER TABLE planes_estudio
DROP COLUMN nivel;


with
  x as (
    select
      id,
      nombre,
      nivel,
      case
        when nombre ilike 'Licenciatura en %'
        or nombre ilike 'Licenciatura %' then 'Licenciatura'
        when nombre ilike 'Especialidad en %'
        or nombre ilike 'Especialidad %' then 'Especialidad'
        when nombre ilike 'Maestría en %'
        or nombre ilike 'Master en %' then 'Maestría'
        when nombre ilike 'Doctorado en %' then 'Doctorado'
        else null
      end as nuevo_nivel
    from
      carreras
  )
update carreras c
set
  nombre = COALESCE(
    case
      when x.nombre ilike 'Licenciatura en %' then REGEXP_REPLACE(x.nombre, '^Licenciatura en\s+', '')
      when x.nombre ilike 'Licenciatura %' then REGEXP_REPLACE(x.nombre, '^Licenciatura\s+', '')
      when x.nombre ilike 'Maestría en %' then REGEXP_REPLACE(x.nombre, '^Maestría en\s+', '')
      when x.nombre ilike 'Master en %' then REGEXP_REPLACE(x.nombre, '^Master en\s+', '')
      when x.nombre ilike 'Doctorado en %' then REGEXP_REPLACE(x.nombre, '^Doctorado en\s+', '')
      when x.nombre ilike 'Especialidad en %' then REGEXP_REPLACE(x.nombre, '^Especialidad en\s+', '')
      else c.nombre
    end,
    c.nombre
  ),
  nivel = x.nuevo_nivel::nivel_plan_estudio
from
  x
where
  c.id = x.id
  and x.nuevo_nivel is not null;

UPDATE facultades
SET nombre = regexp_replace(nombre, '^Facultad de (.+)$', '\1', 'i');

UPDATE facultades
SET nombre = regexp_replace(nombre, '^Facultad Mexicana de (.+)$', '\1', 'i');