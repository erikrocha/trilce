-- ============================================================================
-- 73. Fix: check_quiz_response_consistency() necesita SECURITY DEFINER.
-- Sin esto, la función corre con los privilegios (y el RLS) de quien
-- escanea -- un docente normalmente NO tiene SELECT sobre `students` de su
-- sección vía RLS (students_select solo lo da por is_assigned_to_student(),
-- un mecanismo de asignación aparte, no por ser teacher_id de un
-- course_offering) así que la validación de "el alumno pertenece a la
-- sección" fallaba siempre con falso negativo, aunque el dato fuera
-- correcto. Esta función solo valida integridad referencial -- el control
-- de acceso real ya lo hace la política RLS de quiz_responses -- así que
-- mirar más allá de esa RLS puntual aquí es correcto (mismo criterio que
-- current_staff_id/has_class_group_access en 60_horario.sql).
-- ============================================================================

create or replace function check_quiz_response_consistency()
returns trigger as $$
declare
  v_quiz_id uuid;
  v_class_group_id uuid;
begin
  select qs.quiz_id, co.class_group_id
    into v_quiz_id, v_class_group_id
  from quiz_sessions qs
  join course_offerings co on co.id = qs.course_offering_id
  where qs.id = new.session_id;

  if not exists (
    select 1 from quiz_questions q
    where q.id = new.question_id and q.quiz_id = v_quiz_id
  ) then
    raise exception 'La pregunta no pertenece al cuestionario de esta sesión';
  end if;

  if not exists (
    select 1 from quiz_question_options o
    where o.id = new.option_id and o.question_id = new.question_id
  ) then
    raise exception 'La opción no pertenece a esta pregunta';
  end if;

  if not exists (
    select 1 from students s
    where s.id = new.student_id and s.class_group_id = v_class_group_id
  ) then
    raise exception 'El alumno no pertenece a la sección de esta sesión';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
