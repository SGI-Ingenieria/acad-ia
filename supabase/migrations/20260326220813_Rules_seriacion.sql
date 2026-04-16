set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_ajustar_seriacion_por_cambio_ciclo()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- 1. Validar materias que DEPENDEN de esta (Hijas)
    -- Si muevo 'Mate 1' al ciclo 3, y 'Cálculo' está en el ciclo 3,
    -- la relación se rompe porque el prerrequisito debe ser de un ciclo menor.
    UPDATE public.asignaturas
    SET prerrequisito_asignatura_id = NULL
    WHERE prerrequisito_asignatura_id = NEW.id
      AND numero_ciclo <= NEW.numero_ciclo;

    -- 2. Validar si la materia que estoy moviendo (la actual) 
    -- ahora rompe la regla con SU PROPIO prerrequisito (Padre)
    IF NEW.prerrequisito_asignatura_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.asignaturas 
            WHERE id = NEW.prerrequisito_asignatura_id 
            AND numero_ciclo >= NEW.numero_ciclo
        ) THEN
            NEW.prerrequisito_asignatura_id := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE TRIGGER trg_limpiar_seriacion_conflictiva BEFORE UPDATE OF numero_ciclo ON public.asignaturas FOR EACH ROW EXECUTE FUNCTION public.fn_ajustar_seriacion_por_cambio_ciclo();


