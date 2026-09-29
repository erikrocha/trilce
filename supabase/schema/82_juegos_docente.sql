-- ============================================================================
-- 82. Modo "un solo dispositivo": el docente (o admin/administrativo) inicia
-- sesión, abre un juego y elige qué alumno de su sección juega; las respuestas
-- se guardan a nombre de ese alumno. Requiere 80 y 81. recorded_by deja
-- constancia de quién operó el dispositivo (null = el propio alumno).
-- ============================================================================

alter table game_attempts add column recorded_by uuid references staff_members(id) on delete set null;
alter table game_sessions add column recorded_by uuid references staff_members(id) on delete set null;

-- ¿el usuario actual puede registrar juego a nombre de este alumno? Mismo
-- alcance que ya tiene para VERLO (81): él mismo, admin/administrativo del
-- colegio, o el docente que dicta una materia a su sección (teacher_id,
-- nunca has_school_role 'docente'). Security definer: mira `students` sin
-- depender de su RLS, igual que has_class_group_access (60).
create or replace function can_play_for_student(target_student_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return
    is_own_student(target_student_id)
    or exists (
      select 1 from students s
      where s.id = target_student_id
        and has_school_role(s.school_id, array['admin','administrativo'])
    )
    or exists (
      select 1
      from students s
      join course_offerings co on co.class_group_id = s.class_group_id
      where s.id = target_student_id
        and co.teacher_id = current_staff_id(co.school_id)
    );
end;
$$;

drop policy "game_sessions_insert" on game_sessions;
create policy "game_sessions_insert" on game_sessions for insert
  with check (can_play_for_student(student_id) and has_school_access(school_id));

drop policy "game_sessions_update" on game_sessions;
create policy "game_sessions_update" on game_sessions for update
  using (can_play_for_student(student_id))
  with check (can_play_for_student(student_id) and has_school_access(school_id));

drop policy "game_attempts_insert" on game_attempts;
create policy "game_attempts_insert" on game_attempts for insert
  with check (can_play_for_student(student_id) and has_school_access(school_id));
