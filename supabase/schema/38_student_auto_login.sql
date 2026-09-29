-- ============================================================================
-- 38. Acceso automático para alumnos nuevos
-- ============================================================================
-- Al crear un alumno se le genera un login con:
--   - correo sintético: inicial del primer nombre + apellido paterno + inicial
--     del materno, @ el dominio del colegio (ARAGON MENDOZA, RICARDO NICOLAS →
--     raragonm@<dominio>). Si ya existe, se agrega un número (raragonm2...).
--   - usuario: la parte antes de la @ (raragonm).
--   - contraseña temporal alfanumérica de 8 caracteres.
--
-- La contraseña temporal se guarda en texto plano en `initial_credentials`
-- únicamente para poder imprimir la lista que se entrega a los alumnos. Solo
-- la ven admin/administrativo del colegio, y la fila se borra cuando el
-- alumno cambia su contraseña (o manualmente tras entregar la lista).
-- ============================================================================

-- Dominio de los correos sintéticos: propio de cada colegio.
alter table schools add column if not exists email_domain text;

create table if not exists initial_credentials (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  school_id      uuid not null references schools(id) on delete cascade,
  temp_password  text not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_initial_credentials_school on initial_credentials(school_id);

alter table initial_credentials enable row level security;

create policy "initial_credentials_select" on initial_credentials for select
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

-- El propio usuario puede borrar la suya (al cambiar su contraseña), y el
-- admin/administrativo del colegio también (tras entregar la lista).
create policy "initial_credentials_delete" on initial_credentials for delete
  using (
    user_id = auth.uid()
    or is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
  );
-- Sin política de insert/update: solo se escriben desde provision_student_login.

-- Normaliza un texto a [a-z] (sin tildes, ñ → n, sin espacios ni símbolos).
create or replace function slug_letters(p_text text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    translate(lower(coalesce(p_text, '')), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc'),
    '[^a-z]', '', 'g'
  );
$$;

create or replace function provision_student_login(p_student_id uuid)
returns table (email text, username text, temp_password text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student   students%rowtype;
  v_domain    text;
  v_base      text;
  v_username  text;
  v_email     text;
  v_password  text;
  v_user_id   uuid;
  v_suffix    int := 1;
  -- Sin caracteres ambiguos al imprimir (0/O, 1/l/I).
  v_alphabet  constant text := 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes     bytea;
  i           int;
begin
  select * into v_student from students where id = p_student_id;
  if not found then
    raise exception 'Alumno no encontrado';
  end if;

  if not (is_platform_staff() or has_school_role(v_student.school_id, array['admin','administrativo'])) then
    raise exception 'No autorizado para crear accesos en este colegio';
  end if;

  if exists (select 1 from memberships m where m.student_id = p_student_id) then
    raise exception 'El alumno ya tiene una cuenta de acceso';
  end if;

  select s.email_domain into v_domain from schools s where s.id = v_student.school_id;
  if v_domain is null or btrim(v_domain) = '' then
    raise exception 'El colegio no tiene configurado un dominio de correo';
  end if;
  v_domain := lower(btrim(v_domain));

  v_base := left(slug_letters(split_part(btrim(v_student.first_names), ' ', 1)), 1)
         || slug_letters(v_student.paternal_surname)
         || left(slug_letters(v_student.maternal_surname), 1);
  if v_base = '' then
    raise exception 'No se pudo generar el correo: faltan nombres o apellidos';
  end if;

  loop
    v_username := v_base || case when v_suffix = 1 then '' else v_suffix::text end;
    v_email := v_username || '@' || v_domain;
    exit when not exists (select 1 from auth.users u where lower(u.email) = v_email)
          and not exists (select 1 from user_profiles up where lower(up.username) = v_username);
    v_suffix := v_suffix + 1;
  end loop;

  -- Contraseña de 8 caracteres con al menos una letra y un dígito.
  loop
    v_bytes := extensions.gen_random_bytes(8);
    v_password := '';
    for i in 0..7 loop
      v_password := v_password || substr(v_alphabet, (get_byte(v_bytes, i) % length(v_alphabet)) + 1, 1);
    end loop;
    exit when v_password ~ '[0-9]' and v_password ~ '[a-zA-Z]';
  end loop;

  v_user_id := create_membership_login(
    v_student.school_id,
    'alumno',
    p_student_id,
    v_email,
    v_username,
    v_password,
    btrim(v_student.first_names || ' ' || v_student.paternal_surname || ' ' || coalesce(v_student.maternal_surname, ''))
  );

  insert into initial_credentials (user_id, school_id, temp_password)
  values (v_user_id, v_student.school_id, v_password);

  update students set institutional_email = v_email where id = p_student_id;

  return query select v_email, v_username, v_password;
end;
$$;

revoke execute on function provision_student_login(uuid) from public;
grant execute on function provision_student_login(uuid) to authenticated;

-- Lista para imprimir: alumnos con contraseña temporal aún vigente.
-- security_invoker: respeta la RLS de quien consulta (solo admin/administrativo
-- ven filas de initial_credentials).
create or replace view student_initial_credentials
with (security_invoker = true) as
select
  st.school_id,
  st.id as student_id,
  st.code,
  st.paternal_surname,
  st.maternal_surname,
  st.first_names,
  st.level,
  st.grade,
  st.section,
  st.status,
  up.username,
  st.institutional_email as email,
  ic.temp_password,
  ic.created_at
from initial_credentials ic
join memberships m on m.user_id = ic.user_id and m.role = 'alumno'
join students st on st.id = m.student_id
join user_profiles up on up.id = ic.user_id;
