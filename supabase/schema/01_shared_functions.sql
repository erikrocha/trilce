-- ============================================================================
-- 01. FUNCIONES COMPARTIDAS
-- Nota: deben ser `language plpgsql` (no `sql`) para poder ir antes de crear
-- memberships/platform_staff/etc. Postgres compila y valida el cuerpo de una
-- función `sql` contra el catálogo al momento de crearla (falla si la tabla
-- referenciada no existe todavía); una función `plpgsql` guarda el cuerpo
-- como texto opaco y solo lo resuelve en su primera ejecución (resolución
-- diferida de nombres) — por eso, y solo por eso, estas pueden ir aquí.
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create or replace function is_platform_staff()
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from platform_staff
    where user_id = auth.uid() and active = true
  );
end;
$$;

create or replace function has_school_access(target_school_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from memberships
    where user_id = auth.uid()
      and school_id = target_school_id
      and active = true
  );
end;
$$;

create or replace function has_school_role(target_school_id uuid, roles text[])
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from memberships
    where user_id = auth.uid()
      and school_id = target_school_id
      and active = true
      and role::text = any(roles)
  );
end;
$$;

-- ¿el usuario actual es apoderado de este alumno?
create or replace function is_guardian_of_student(target_student_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from student_guardians sg
    join memberships m on m.guardian_id = sg.guardian_id
    where sg.student_id = target_student_id
      and m.user_id = auth.uid()
      and m.role = 'padre'
      and m.active = true
  );
end;
$$;

-- ¿el usuario actual ES este alumno (login propio)?
create or replace function is_own_student(target_student_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from memberships
    where user_id = auth.uid()
      and student_id = target_student_id
      and role = 'alumno'
      and active = true
  );
end;
$$;
