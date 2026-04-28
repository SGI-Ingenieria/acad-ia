update carreras
set
  nivel = 'Otro'
where
  nivel is null;

alter table carreras alter column nivel set default 'Otro';
alter table carreras alter column nivel set not null;
