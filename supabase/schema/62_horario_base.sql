-- ============================================================================
-- 62. HORARIO BASE: franjas horarias compartidas por todos los días de la
-- semana, y actividades no curriculares (globales al colegio). Redefine
-- schedule_slots (60_horario.sql) para que cada bloque se ubique en una
-- franja compartida (period_id) en vez de tener su propio start_time/end_time,
-- y pueda contener un curso O una actividad — antes solo admitía un curso.
-- ============================================================================

-- La data de prueba de la sesión anterior usaba el modelo viejo
-- (start_time/end_time directos, siempre con course_offering_id) — se borra
-- antes del rediseño, se vuelve a sembrar con el modelo nuevo más abajo.
delete from schedule_slots;

-- Franjas horarias: mismas horas para lunes a viernes (o los días que se
-- usen). is_break marca un recreo — se pinta como una fila completa "RECREO"
-- en la grilla, sin necesitar bloques propios por día.
create table schedule_periods (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  start_time  time not null,
  end_time    time not null,
  is_break    boolean not null default false,
  label       text, -- ej. "Recreo 1"; si es null y is_break, la UI muestra "Recreo"
  created_at  timestamptz not null default now(),
  constraint chk_schedule_period_time check (end_time > start_time),
  unique (school_id, start_time)
);

create index idx_schedule_periods_school on schedule_periods(school_id);

-- Catálogo de actividades no curriculares (hora de formación, plan lector,
-- reunión de docentes, pausa activa...). Son globales al colegio: cuando se
-- ubican en una franja+día, aparecen igual para todos (a diferencia de un
-- curso, que solo lo ve su docente y la sección correspondiente).
create table schedule_activities (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (school_id, name)
);

create index idx_schedule_activities_school on schedule_activities(school_id);

-- Rediseño de schedule_slots.
alter table schedule_slots drop constraint chk_schedule_slot_time;
alter table schedule_slots drop column start_time;
alter table schedule_slots drop column end_time;

alter table schedule_slots add column school_id uuid references schools(id) on delete cascade;
alter table schedule_slots add column period_id uuid references schedule_periods(id) on delete cascade;
alter table schedule_slots add column activity_id uuid references schedule_activities(id) on delete cascade;
alter table schedule_slots alter column course_offering_id drop not null;

-- La tabla queda vacía por el delete de arriba, así que exigir not null acá
-- no falla contra filas existentes.
alter table schedule_slots alter column school_id set not null;
alter table schedule_slots alter column period_id set not null;

alter table schedule_slots add constraint chk_schedule_slot_content check (
  (course_offering_id is not null and activity_id is null)
  or (course_offering_id is null and activity_id is not null)
);

-- Una actividad global ocupa una franja+día una sola vez (no tiene sentido
-- "Plan Lector" duplicado en la misma celda). Los cursos sí pueden
-- coexistir varios en la misma franja+día (distintas secciones en paralelo).
create unique index idx_schedule_slots_activity_unique
  on schedule_slots(period_id, day_of_week) where activity_id is not null;

create index idx_schedule_slots_school on schedule_slots(school_id);
create index idx_schedule_slots_period on schedule_slots(period_id);
