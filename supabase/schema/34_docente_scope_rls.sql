-- ============================================================================
-- 34. Acota el acceso de `docente` a solo sus alumnos asignados.
-- Las políticas originales (21_academic_core_rls.sql) daban a `docente`
-- acceso de lectura a TODOS los alumnos del colegio vía has_school_role(...,
-- ['admin','administrativo','docente']). CLAUDE.md ya advertía que esto era
-- temporal ("no construir permisos de todo el colegio para docentes"). Este
-- archivo reemplaza esas políticas por una versión que usa
-- is_assigned_to_student() (33_staff_assignments_rls.sql) en vez de dar
-- acceso plano por rol. admin/administrativo mantienen acceso total.
-- ============================================================================

drop policy "students_select" on students;
create policy "students_select" on students for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_assigned_to_student(id)
    or is_guardian_of_student(id)
    or is_own_student(id)
  );

drop policy "guardians_select" on guardians;
create policy "guardians_select" on guardians for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or exists (
      select 1 from student_guardians sg
      where sg.guardian_id = guardians.id
        and (is_guardian_of_student(sg.student_id) or is_assigned_to_student(sg.student_id))
    )
  );

drop policy "student_guardians_select" on student_guardians;
create policy "student_guardians_select" on student_guardians for select
  using (
    is_platform_staff()
    or is_guardian_of_student(student_id)
    or is_own_student(student_id)
    or is_assigned_to_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo']))
  );

drop policy "academic_years_select" on academic_years;
create policy "academic_years_select" on academic_years for select
  using (
    is_platform_staff() or is_guardian_of_student(student_id) or is_own_student(student_id)
    or is_assigned_to_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo']))
  );

drop policy "previous_schools_select" on previous_schools;
create policy "previous_schools_select" on previous_schools for select
  using (
    is_platform_staff() or is_guardian_of_student(student_id) or is_own_student(student_id)
    or is_assigned_to_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo']))
  );
