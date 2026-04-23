UPDATE facultades
SET nombre = regexp_replace(nombre, '^Facultad de (.+)$', '\1', 'i');