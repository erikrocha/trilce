-- ============================================================================
-- 72. Fix: check_quiz_response_consistency() (70_cuestionarios.sql) le
-- faltaba `set search_path = public` -- convención ya usada por las demás
-- funciones plpgsql del proyecto (ver 50_talonario.sql), señalada por el
-- advisor de seguridad (function_search_path_mutable).
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
$$ language plpgsql set search_path = public;
