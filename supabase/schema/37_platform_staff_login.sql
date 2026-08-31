-- ============================================================================
-- 37. Crear acceso para un miembro del equipo de plataforma (superadmin/support).
-- Mismo patrón que create_membership_login (35_membership_login.sql): SECURITY
-- DEFINER para poder escribir en auth.users, autorización real dentro de la
-- función. Solo un superadmin existente puede crear a otro miembro del equipo.
-- ============================================================================

create or replace function create_platform_staff_login(
  p_role platform_staff_role,
  p_email text,
  p_username text,
  p_password text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_is_superadmin boolean;
begin
  select exists (
    select 1 from platform_staff
    where user_id = auth.uid() and role = 'superadmin' and active = true
  ) into v_is_superadmin;

  if not v_is_superadmin then
    raise exception 'Solo un superadmin puede crear miembros del equipo de plataforma';
  end if;

  if exists (select 1 from auth.users where lower(email) = lower(p_email)) then
    raise exception 'Ya existe una cuenta con ese correo';
  end if;
  if exists (select 1 from user_profiles where lower(username) = lower(p_username)) then
    raise exception 'Ese nombre de usuario ya está en uso';
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(), now(),
    '', '', '', ''
  );

  update user_profiles set username = p_username where id = v_user_id;

  insert into platform_staff (user_id, role, active)
  values (v_user_id, p_role, true);

  return v_user_id;
end;
$$;

revoke execute on function create_platform_staff_login(platform_staff_role, text, text, text, text) from public;
grant execute on function create_platform_staff_login(platform_staff_role, text, text, text, text) to authenticated;
