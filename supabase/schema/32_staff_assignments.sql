-- ============================================================================
-- 32. ASIGNACIÓN DOCENTE → SECCIÓN
-- Mínimo necesario para acotar la visibilidad de un docente a "sus alumnos"
-- sin construir el módulo académico completo (cursos, course_teachers) que
-- CLAUDE.md reserva para más adelante. Se apoya en level/grade/section, que
-- ya existen en `students`. `section = null` significa "todas las secciones
-- de ese grado".
-- ============================================================================

create table staff_assigned_sections (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  staff_id    uuid not null references staff_members(id) on delete cascade,
  level       enrollment_level not null,
  grade       text not null,
  section     text,
  created_at  timestamptz not null default now(),
  unique (staff_id, level, grade, section)
);

create index idx_staff_assigned_sections_staff on staff_assigned_sections(staff_id);
create index idx_staff_assigned_sections_school on staff_assigned_sections(school_id);
