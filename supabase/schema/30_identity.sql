-- ============================================================================
-- 30. IDENTIDAD: perfiles, memberships, invitaciones, MFA
-- ============================================================================

create table user_profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  username                text unique,
  contact_email           text,
  contact_email_verified  boolean not null default false,
  full_name               text,
  phone                   text,
  avatar_url              text,
  locale                  text default 'es-PE',
  mfa_required            boolean not null default false,
  last_active_school_id   uuid references schools(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Trigger estándar de Supabase: crea el perfil apenas se crea el auth.users
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into user_profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Solo el trigger debe poder invocarla, nunca vía RPC directo. `revoke ... from
-- public` es necesario: Postgres otorga EXECUTE a PUBLIC por defecto en cada
-- función nueva, y anon/authenticated heredan ese grant a través de PUBLIC
-- aunque no se les otorgue explícitamente.
revoke execute on function handle_new_auth_user() from public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create table memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  school_id     uuid not null references schools(id) on delete cascade,
  role          membership_role not null,
  is_owner      boolean not null default false,

  student_id    uuid references students(id) on delete cascade,
  guardian_id   uuid references guardians(id) on delete cascade,
  staff_id      uuid references staff_members(id) on delete cascade,

  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint chk_membership_target check (
    (role = 'alumno' and student_id is not null and guardian_id is null and staff_id is null)
    or (role = 'padre' and guardian_id is not null and student_id is null and staff_id is null)
    or (role in ('admin','administrativo','docente') and staff_id is not null and student_id is null and guardian_id is null)
  )
);

create index idx_memberships_user on memberships(user_id);
create index idx_memberships_school on memberships(school_id);
create unique index one_owner_per_school on memberships(school_id) where is_owner = true;

create table membership_invites (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  email         text not null,
  role          membership_role not null,
  student_id    uuid references students(id) on delete cascade,
  guardian_id   uuid references guardians(id) on delete cascade,
  staff_id      uuid references staff_members(id) on delete cascade,
  token         text not null unique,
  status        invite_status not null default 'pending',
  invited_by    uuid references auth.users(id),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_membership_invites_email on membership_invites(email);

create table mfa_factors (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  factor_type   mfa_factor_type not null,
  enabled       boolean not null default true,
  verified_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, factor_type)
);

create table auth_challenges (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  purpose             challenge_purpose not null,
  code_hash           text not null,
  device_fingerprint  text,
  status              challenge_status not null default 'pending',
  attempts            int not null default 0,
  max_attempts        int not null default 5,
  requested_ip        text,
  expires_at          timestamptz not null,
  verified_at         timestamptz,
  created_at          timestamptz not null default now()
);

create index idx_auth_challenges_user on auth_challenges(user_id, purpose, status);

create table trusted_devices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  device_fingerprint  text not null,
  device_label        text,
  ip_address          text,
  trusted_at          timestamptz not null default now(),
  last_seen_at        timestamptz not null default now(),
  revoked_at          timestamptz,
  created_at          timestamptz not null default now(),
  unique (user_id, device_fingerprint)
);

create trigger trg_user_profiles_updated_at before update on user_profiles
  for each row execute function set_updated_at();
create trigger trg_memberships_updated_at before update on memberships
  for each row execute function set_updated_at();

-- Resuelve username -> email real, para permitir login por usuario (no solo email)
create or replace function resolve_login_email(p_username text)
returns text
language sql stable security definer
set search_path = public
as $$
  select au.email
  from user_profiles up
  join auth.users au on au.id = up.id
  where lower(up.username) = lower(p_username)
  limit 1;
$$;
