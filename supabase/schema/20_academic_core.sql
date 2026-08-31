-- ============================================================================
-- 20. NÚCLEO ACADÉMICO: alumnos, apoderados, personal
-- ============================================================================

create table students (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references schools(id) on delete cascade,
  code                  text not null,
  paternal_surname      text not null,
  maternal_surname      text,
  first_names           text not null,
  sex                   sex_type,
  birth_date            date,
  document_type         document_id_type default 'DNI',
  document_number       text,
  photo_url             text,
  institutional_email   text,

  enrolled              boolean not null default true,
  status                student_status not null default 'activo',
  entry_year            int,
  level                 enrollment_level,
  grade                 text,
  section               text,

  entry_date            date,
  exit_date             date,
  exit_reason           text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (school_id, code)
);

create index idx_students_school on students(school_id);
create index idx_students_level_grade_section on students(school_id, level, grade, section);

create table guardians (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references schools(id) on delete cascade,

  paternal_surname      text,
  maternal_surname      text,
  first_names           text not null,
  sex                   sex_type,
  birth_date            date,
  document_type         document_id_type default 'DNI',
  document_number       text,

  address               text,
  phone                 text,
  mobile                text,
  email                 text,

  education_level       text,
  profession            text,
  job_title             text,
  workplace             text,
  work_phone            text,
  work_address          text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_guardians_school on guardians(school_id);
create index idx_guardians_document on guardians(school_id, document_number);

create table staff_members (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  staff_type       staff_type not null,
  full_name        text not null,
  document_type    document_id_type default 'DNI',
  document_number  text,
  phone            text,
  email            text,
  hire_date        date,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_staff_members_school on staff_members(school_id);

create table student_guardians (
  student_id              uuid not null references students(id) on delete cascade,
  guardian_id             uuid not null references guardians(id) on delete cascade,
  relationship_type       relationship_type not null,
  lives_with              boolean not null default false,
  is_billing_responsible  boolean not null default false,
  is_emergency_contact    boolean not null default false,
  created_at              timestamptz not null default now(),
  primary key (student_id, guardian_id)
);

create table academic_years (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  year          int not null,
  level         enrollment_level,
  grade         text,
  section       text,
  classroom     text,
  school_name   text,
  final_status  text,
  created_at    timestamptz not null default now(),
  unique (student_id, year)
);

create table previous_schools (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  year_start    int,
  year_end      int,
  institution   text,
  district      text,
  created_at    timestamptz not null default now()
);

create trigger trg_students_updated_at before update on students
  for each row execute function set_updated_at();
create trigger trg_guardians_updated_at before update on guardians
  for each row execute function set_updated_at();
create trigger trg_staff_members_updated_at before update on staff_members
  for each row execute function set_updated_at();
