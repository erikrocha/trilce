-- ============================================================================
-- 74. Los resultados de un cuestionario (pantalla de sesión) necesitan
-- mostrar el nombre del alumno. Hoy students_select (34_docente_scope_rls.sql)
-- solo da acceso a un docente vía is_assigned_to_student() -- un mecanismo
-- de asignación aparte (33_staff_assignments_rls.sql) que no tiene relación
-- con course_offerings. Un docente que dicta un curso a una sección (Horario,
-- Cuestionarios) no podía ver el nombre de sus propios alumnos. Se agrega esa
-- ruta de acceso, igual de acotada: solo la sección que efectivamente dicta.
-- ============================================================================

drop policy "students_select" on students;
create policy "students_select" on students for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_assigned_to_student(id)
    or is_guardian_of_student(id)
    or is_own_student(id)
    or exists (
      select 1 from course_offerings co
      where co.class_group_id = students.class_group_id
        and co.teacher_id = current_staff_id(co.school_id)
    )
  );
