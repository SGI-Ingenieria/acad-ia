SELECT 
    pg_get_triggerdef(t.oid) as trigger_definition,
    p.prosrc as function_body
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'trigger_track_cambios_asignatura';

ALTER TABLE public.cambios_asignatura 
DROP CONSTRAINT cambios_asignatura_asignatura_id_fkey,
ADD CONSTRAINT cambios_asignatura_asignatura_id_fkey 
  FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;