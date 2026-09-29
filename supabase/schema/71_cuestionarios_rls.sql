-- ============================================================================
-- 71. RLS: cuestionarios. El banco de preguntas es privado de quien lo crea;
-- admin/administrativo supervisan todo el colegio. Sesiones y respuestas
-- heredan el alcance docente-por-sección ya usado en horario (teacher_id vía
-- course_offerings), nunca has_school_role(...,'docente').
-- ============================================================================

alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_question_options enable row level security;
alter table quiz_sessions enable row level security;
alter table quiz_responses enable row level security;

create policy "quizzes_select" on quizzes for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or created_by = current_staff_id(school_id)
  );
create policy "quizzes_write" on quizzes for all
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or created_by = current_staff_id(school_id)
  )
  with check (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or created_by = current_staff_id(school_id)
  );

-- Preguntas: siguen el acceso del quiz padre (mismo patrón que
-- document_series -> document_types).
create policy "quiz_questions_select" on quiz_questions for select
  using (
    exists (
      select 1 from quizzes q
      where q.id = quiz_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  );
create policy "quiz_questions_write" on quiz_questions for all
  using (
    exists (
      select 1 from quizzes q
      where q.id = quiz_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  )
  with check (
    exists (
      select 1 from quizzes q
      where q.id = quiz_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  );

-- Alternativas: siguen el acceso de la pregunta -> quiz (dos saltos).
create policy "quiz_question_options_select" on quiz_question_options for select
  using (
    exists (
      select 1 from quiz_questions qq
      join quizzes q on q.id = qq.quiz_id
      where qq.id = question_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  );
create policy "quiz_question_options_write" on quiz_question_options for all
  using (
    exists (
      select 1 from quiz_questions qq
      join quizzes q on q.id = qq.quiz_id
      where qq.id = question_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  )
  with check (
    exists (
      select 1 from quiz_questions qq
      join quizzes q on q.id = qq.quiz_id
      where qq.id = question_id
        and (
          is_platform_staff()
          or has_school_role(q.school_id, array['admin','administrativo'])
          or q.created_by = current_staff_id(q.school_id)
        )
    )
  );

-- Sesiones: alcance por course_offering (igual que schedule_slots). El
-- WITH CHECK además exige que el quiz usado sea uno al que el actor tenga
-- acceso -- una FK por sí sola no respeta la RLS del quiz referenciado.
create policy "quiz_sessions_select" on quiz_sessions for select
  using (
    is_platform_staff()
    or exists (
      select 1 from course_offerings co
      where co.id = course_offering_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
        )
    )
  );
create policy "quiz_sessions_write" on quiz_sessions for all
  using (
    is_platform_staff()
    or exists (
      select 1 from course_offerings co
      where co.id = course_offering_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
        )
    )
  )
  with check (
    is_platform_staff()
    or (
      exists (
        select 1 from course_offerings co
        where co.id = course_offering_id
          and (
            has_school_role(co.school_id, array['admin','administrativo'])
            or co.teacher_id = current_staff_id(co.school_id)
          )
      )
      and exists (
        select 1 from quizzes q
        where q.id = quiz_id
          and (
            has_school_role(q.school_id, array['admin','administrativo'])
            or q.created_by = current_staff_id(q.school_id)
          )
      )
    )
  );

-- Respuestas: mismo alcance que la sesión (course_offering.teacher_id).
create policy "quiz_responses_select" on quiz_responses for select
  using (
    is_platform_staff()
    or exists (
      select 1 from quiz_sessions qs
      join course_offerings co on co.id = qs.course_offering_id
      where qs.id = session_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
        )
    )
  );
create policy "quiz_responses_write" on quiz_responses for all
  using (
    is_platform_staff()
    or exists (
      select 1 from quiz_sessions qs
      join course_offerings co on co.id = qs.course_offering_id
      where qs.id = session_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
        )
    )
  )
  with check (
    is_platform_staff()
    or exists (
      select 1 from quiz_sessions qs
      join course_offerings co on co.id = qs.course_offering_id
      where qs.id = session_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
        )
    )
  );
