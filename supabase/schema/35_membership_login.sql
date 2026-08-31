-- ============================================================================
-- 35. Crear acceso (login) para cualquier rol sin necesitar la service_role
-- key desde la app. SECURITY DEFINER: corre con los privilegios del dueño
-- de la función (postgres), que sí puede escribir en auth.users — pero la
-- autorización real la hace la función misma (solo admin/administrativo del
-- colegio, o platform_staff), igual que resolve_login_email/handle_new_auth_user.
-- ============================================================================

create or replace function create_membership_login(
  p_school_id uuid,
  p_role membership_role,
  p_target_id uuid,       -- student_id | guardian_id | staff_id, según p_role
  p_email text,
  p_username text,
  p_password text,
  p_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
-- pgcrypto (crypt/gen_salt) vive en el schema `extensions` en Supabase, no en
-- `public` — por eso se llaman calificadas más abajo en vez de ensanchar
-- search_path (que reintroduciría el riesgo de hijacking que ya se corrigió).
as $$
declare
  v_user_id uuid;
begin
  if not (is_platform_staff() or has_school_role(p_school_id, array['admin','administrativo'])) then
    raise exception 'No autorizado para crear accesos en este colegio';
  end if;

  if p_role = 'alumno' and not exists (
    select 1 from students where id = p_target_id and school_id = p_school_id
  ) then
    raise exception 'Alumno no encontrado en este colegio';
  elsif p_role = 'padre' and not exists (
    select 1 from guardians where id = p_target_id and school_id = p_school_id
  ) then
    raise exception 'Apoderado no encontrado en este colegio';
  elsif p_role in ('admin', 'administrativo', 'docente') and not exists (
    select 1 from staff_members where id = p_target_id and school_id = p_school_id
  ) then
    raise exception 'Personal no encontrado en este colegio';
  end if;

  if exists (select 1 from memberships where school_id = p_school_id and role = p_role and (
    (p_role = 'alumno' and student_id = p_target_id) or
    (p_role = 'padre' and guardian_id = p_target_id) or
    (p_role in ('admin','administrativo','docente') and staff_id = p_target_id)
  )) then
    raise exception 'Esta persona ya tiene una cuenta en este colegio';
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

  -- trg_on_auth_user_created ya crea la fila en user_profiles
  update user_profiles set username = p_username where id = v_user_id;

  insert into memberships (user_id, school_id, role, student_id, guardian_id, staff_id, is_owner)
  values (
    v_user_id, p_school_id, p_role,
    case when p_role = 'alumno' then p_target_id end,
    case when p_role = 'padre' then p_target_id end,
    case when p_role in ('admin', 'administrativo', 'docente') then p_target_id end,
    false
  );

  return v_user_id;
end;
$$;

revoke execute on function create_membership_login(uuid, membership_role, uuid, text, text, text, text) from public;
grant execute on function create_membership_login(uuid, membership_role, uuid, text, text, text, text) to authenticated;
