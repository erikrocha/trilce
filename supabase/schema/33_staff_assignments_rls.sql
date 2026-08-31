-- ============================================================================
-- 33. RLS: asignaciones docente → sección + helper is_assigned_to_student()
-- ============================================================================

alter table staff_assigned_sections enable row level security;

create policy "staff_assigned_sections_select" on staff_assigned_sections for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "staff_assigned_sections_write" on staff_assigned_sections for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

-- ¿el docente actual tiene asignada la sección de este alumno?
create or replace function is_assigned_to_student(target_student_id uuid)
returns boolean
language plpgsql stable security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from students s
    join memberships m
      on m.school_id = s.school_id
      and m.role = 'docente'
      and m.user_id = auth.uid()
      and m.active = true
    join staff_assigned_sections sas
      on sas.staff_id = m.staff_id
      and sas.level = s.level
      and sas.grade = s.grade
      and (sas.section is null or sas.section = s.section)
    where s.id = target_student_id
  );
end;
$$;
