-- ============================================================================
-- 80. JUEGOS EDUCATIVOS: cada vez que un alumno juega una habilidad
-- (game_sessions) se guarda cada respuesta, correcta o no (game_attempts),
-- para saber en qué temas falla y necesita repasar. El catálogo de
-- habilidades (A.1, B.2...) vive en código (lib/games/catalog.ts); aquí solo
-- se guarda el id como texto. Cada pregunta se genera a partir de un seed
-- determinista, así que el servidor puede regenerarla y verificar la
-- respuesta en vez de creerle al navegador.
-- ============================================================================

create table game_sessions (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  student_id     uuid not null references students(id) on delete cascade,
  skill_id       text not null,
  score          int not null default 0 check (score between 0 and 100),
  answered       int not null default 0,
  correct_count  int not null default 0,
  mastered_at    timestamptz,
  started_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_game_sessions_student_skill on game_sessions(student_id, skill_id);
create index idx_game_sessions_school on game_sessions(school_id);

create trigger trg_game_sessions_updated_at before update on game_sessions
  for each row execute function set_updated_at();

create table game_attempts (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references game_sessions(id) on delete cascade,
  school_id       uuid not null references schools(id) on delete cascade,
  student_id      uuid not null references students(id) on delete cascade,
  skill_id        text not null,
  seed            int not null,
  tag             text,
  question        jsonb not null,
  given_answer    text not null,
  correct_answer  text not null,
  is_correct      boolean not null,
  answered_at     timestamptz not null default now()
);

create index idx_game_attempts_student_skill on game_attempts(student_id, skill_id, answered_at desc);
create index idx_game_attempts_session on game_attempts(session_id);

-- El intento debe coincidir con su sesión (alumno, colegio, habilidad). Es una
-- validación de integridad, no de acceso, por eso security definer (mismo
-- criterio que check_quiz_response_consistency en 73).
create or replace function check_game_attempt_consistency()
returns trigger as $$
begin
  if not exists (
    select 1 from game_sessions s
    where s.id = new.session_id
      and s.student_id = new.student_id
      and s.school_id = new.school_id
      and s.skill_id = new.skill_id
  ) then
    raise exception 'El intento no coincide con su sesión de juego';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_game_attempt_consistency
  before insert on game_attempts
  for each row execute function check_game_attempt_consistency();
