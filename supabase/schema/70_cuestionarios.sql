-- ============================================================================
-- 70. CUESTIONARIOS: banco de preguntas reutilizable estilo Quizizz/Plickers.
-- Un quiz (preguntas + alternativas) es independiente de cualquier sección;
-- se "aplica" a una sección real mediante quiz_sessions (que sí está ligada
-- a un course_offering, igual que schedule_slots en 60_horario.sql). Las
-- respuestas se recogen luego con un celular escaneando el QR fijo de cada
-- alumno (ver 71_cuestionarios_rls.sql y el módulo de captura, fuera de este
-- repo) y quedan en quiz_responses.
-- ============================================================================

create type quiz_session_status as enum ('borrador', 'activo', 'cerrado');

-- Banco de preguntas: pertenece a quien lo crea (cualquier staff — docente,
-- administrativo o admin). Reutilizable en múltiples secciones/fechas vía
-- quiz_sessions, así no hay que duplicar preguntas para repetir el examen.
create table quizzes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  title       text not null,
  description text,
  created_by  uuid not null references staff_members(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quizzes_school on quizzes(school_id);
create index idx_quizzes_created_by on quizzes(created_by);

create trigger trg_quizzes_updated_at before update on quizzes
  for each row execute function set_updated_at();

create table quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  text        text not null,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_quiz_questions_quiz on quiz_questions(quiz_id);

create trigger trg_quiz_questions_updated_at before update on quiz_questions
  for each row execute function set_updated_at();

-- Alternativas de respuesta (por defecto 4, A-D, pero el número es libre).
-- Selección única por ahora -- regla de negocio explícita -- forzada aquí
-- con un índice único parcial: a lo más una alternativa correcta por
-- pregunta. Cuando se soporte selección múltiple, este índice se reemplaza
-- en un archivo nuevo (regla 10), no se edita este.
create table quiz_question_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  label       text not null,
  text        text not null,
  is_correct  boolean not null default false,
  order_index int not null default 0,
  created_at  timestamptz not null default now(),
  unique (question_id, label)
);

create index idx_quiz_question_options_question on quiz_question_options(question_id);

create unique index idx_quiz_question_options_one_correct
  on quiz_question_options(question_id) where is_correct;

-- Aplicación de un quiz a una sección real. course_offering_id ya resuelve
-- curso + sección + docente responsable (mismo patrón que schedule_slots) --
-- así la sesión hereda directamente el alcance docente-por-sección sin
-- inventar un mecanismo paralelo. current_question_id es la pregunta "en
-- vivo" mientras el docente camina escaneando las tarjetas QR del salón.
create table quiz_sessions (
  id                   uuid primary key default gen_random_uuid(),
  quiz_id              uuid not null references quizzes(id) on delete cascade,
  course_offering_id   uuid not null references course_offerings(id) on delete cascade,
  status               quiz_session_status not null default 'borrador',
  current_question_id  uuid references quiz_questions(id) on delete set null,
  opened_at            timestamptz,
  closed_at            timestamptz,
  created_at           timestamptz not null default now(),
  constraint chk_quiz_session_dates
    check (closed_at is null or opened_at is null or closed_at >= opened_at)
);

create index idx_quiz_sessions_quiz on quiz_sessions(quiz_id);
create index idx_quiz_sessions_offering on quiz_sessions(course_offering_id);

-- Una respuesta por alumno por pregunta por sesión. Volver a escanear la
-- misma pregunta para el mismo alumno hace un UPDATE (upsert), nunca un
-- segundo registro -- por eso el unique conjunto.
create table quiz_responses (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references quiz_sessions(id) on delete cascade,
  question_id  uuid not null references quiz_questions(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  option_id    uuid not null references quiz_question_options(id) on delete cascade,
  recorded_by  uuid references staff_members(id) on delete set null,
  answered_at  timestamptz not null default now(),
  unique (session_id, question_id, student_id)
);

create index idx_quiz_responses_session on quiz_responses(session_id);
create index idx_quiz_responses_student on quiz_responses(student_id);

-- Integridad cruzada (pregunta pertenece al quiz de la sesión, opción
-- pertenece a la pregunta, alumno pertenece a la sección de la sesión) --
-- un CHECK simple no puede mirar otras tablas, así que va en un trigger,
-- mismo criterio que recalc_invoice_status() en 40_tesoreria.sql.
create or replace function check_quiz_response_consistency()
returns trigger
language plpgsql
as $$
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
$$;

create trigger trg_quiz_response_consistency
  before insert or update on quiz_responses
  for each row execute function check_quiz_response_consistency();
