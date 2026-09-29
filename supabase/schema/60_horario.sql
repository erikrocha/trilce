-- ============================================================================
-- 60. HORARIO ACADÉMICO: secciones reales, cursos, asignación docente-curso
-- y bloques de horario semanal.
-- ============================================================================

-- Secciones reales por año lectivo. Distinta de students.level/grade/section
-- (texto libre sin relación formal, que se mantiene tal cual) — el vínculo
-- desde students es opcional, ver students.class_group_id más abajo.
create table class_groups (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  academic_year  int not null,
  level          enrollment_level not null,
  grade          text not null,
  section        text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (school_id, academic_year, level, grade, section)
);

create index idx_class_groups_school on class_groups(school_id);
create index idx_class_groups_year on class_groups(school_id, academic_year);

create trigger trg_class_groups_updated_at before update on class_groups
  for each row execute function set_updated_at();

-- Vínculo opcional alumno -> sección real. Nullable a propósito: no rompe a
-- los alumnos que hoy solo usan level/grade/section como texto libre; se les
-- puede ir asignando class_group_id progresivamente.
alter table students add column class_group_id uuid references class_groups(id) on delete set null;

create index idx_students_class_group on students(class_group_id);

-- Catálogo de materias del colegio.
create table courses (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  name        text not null,
  short_code  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, name)
);

create index idx_courses_school on courses(school_id);

create trigger trg_courses_updated_at before update on courses
  for each row execute function set_updated_at();

-- Qué curso dicta qué docente a qué sección. El año lectivo no se repite
-- aquí — ya viene dado por class_group_id (class_groups.academic_year).
create table course_offerings (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  course_id       uuid not null references courses(id) on delete cascade,
  class_group_id  uuid not null references class_groups(id) on delete cascade,
  teacher_id      uuid not null references staff_members(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (course_id, class_group_id)
);

create index idx_course_offerings_school on course_offerings(school_id);
create index idx_course_offerings_teacher on course_offerings(teacher_id);
create index idx_course_offerings_class_group on course_offerings(class_group_id);

create trigger trg_course_offerings_updated_at before update on course_offerings
  for each row execute function set_updated_at();

-- Bloques de horario semanal de un course_offering. Sin school_id propio a
-- propósito — mismo patrón que document_series -> document_types: se llega
-- al colegio uniendo con course_offerings en la política RLS.
create table schedule_slots (
  id                  uuid primary key default gen_random_uuid(),
  course_offering_id  uuid not null references course_offerings(id) on delete cascade,
  day_of_week         int not null check (day_of_week between 1 and 7), -- 1 = lunes ... 7 = domingo (ISO-8601)
  start_time          time not null,
  end_time            time not null,
  classroom           text,
  created_at          timestamptz not null default now(),
  constraint chk_schedule_slot_time check (end_time > start_time)
);

create index idx_schedule_slots_offering on schedule_slots(course_offering_id);
create index idx_schedule_slots_day on schedule_slots(day_of_week);

-- ============================================================================
-- Función: staff_id del usuario logueado en este colegio (cualquier rol de
-- staff: admin/administrativo/docente). La usa RLS de horario para saber
-- "cuál es mi teacher_id" sin exponer el colegio entero.
-- ============================================================================

create or replace function current_staff_id(target_school_id uuid)
returns uuid
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_staff_id uuid;
begin
  select staff_id into v_staff_id
  from memberships
  where user_id = auth.uid()
    and school_id = target_school_id
    and staff_id is not null
    and active = true
  limit 1;

  return v_staff_id;
end;
$$;

-- ¿el usuario actual (alumno o padre) pertenece a esta sección? Reutiliza
-- is_guardian_of_student/is_own_student (01_shared_functions.sql) — a
-- propósito NO incluye is_assigned_to_student aquí: el acceso de un docente
-- a horario pasa solo por teacher_id, nunca por su sección asignada.
create or replace function has_class_group_access(target_class_group_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from students s
    where s.class_group_id = target_class_group_id
      and (is_guardian_of_student(s.id) or is_own_student(s.id))
  );
end;
$$;
