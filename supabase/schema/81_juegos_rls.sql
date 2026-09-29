-- ============================================================================
-- 81. RLS: juegos. El alumno escribe y ve solo lo suyo; el padre ve el de sus
-- hijos; el docente el de los alumnos de las secciones que dicta (vía
-- course_offerings.teacher_id, nunca has_school_role(...,'docente'));
-- admin/administrativo ven todo el colegio. Los intentos son inmutables: no hay
-- política de UPDATE ni DELETE (solo se borran en cascada).
-- ============================================================================

alter table game_sessions enable row level security;
alter table game_attempts enable row level security;

create policy "game_sessions_select" on game_sessions for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_own_student(student_id)
    or is_guardian_of_student(student_id)
    or exists (
      select 1
      from students s
      join course_offerings co on co.class_group_id = s.class_group_id
      where s.id = game_sessions.student_id
        and co.teacher_id = current_staff_id(co.school_id)
    )
  );
create policy "game_sessions_insert" on game_sessions for insert
  with check (is_own_student(student_id) and has_school_access(school_id));
create policy "game_sessions_update" on game_sessions for update
  using (is_own_student(student_id))
  with check (is_own_student(student_id) and has_school_access(school_id));

create policy "game_attempts_select" on game_attempts for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_own_student(student_id)
    or is_guardian_of_student(student_id)
    or exists (
      select 1
      from students s
      join course_offerings co on co.class_group_id = s.class_group_id
      where s.id = game_attempts.student_id
        and co.teacher_id = current_staff_id(co.school_id)
    )
  );
create policy "game_attempts_insert" on game_attempts for insert
  with check (is_own_student(student_id) and has_school_access(school_id));
