ALTER TABLE carreras
ADD COLUMN nivel nivel_plan_estudio;

UPDATE carreras c
SET nivel = p.nivel
FROM planes_estudio p
WHERE p.carrera_id = c.id;


ALTER TABLE planes_estudio
DROP COLUMN nivel;