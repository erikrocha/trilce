-- ============================================================================
-- 21. RLS: núcleo académico
-- ============================================================================

alter table students enable row level security;
alter table guardians enable row level security;
alter table staff_members enable row level security;
alter table student_guardians enable row level security;
alter table academic_years enable row level security;
alter table previous_schools enable row level security;

create policy "students_select" on students for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo','docente'])
    or is_guardian_of_student(id)
    or is_own_student(id)
  );
create policy "students_write" on students for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "guardians_select" on guardians for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo','docente'])
    or exists (
      select 1 from student_guardians sg
      where sg.guardian_id = guardians.id and is_guardian_of_student(sg.student_id)
    )
  );
create policy "guardians_write" on guardians for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "staff_members_select" on staff_members for select
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo','docente']));
create policy "staff_members_write" on staff_members for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "student_guardians_select" on student_guardians for select
  using (
    is_platform_staff()
    or is_guardian_of_student(student_id)
    or is_own_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo','docente']))
  );
create policy "student_guardians_write" on student_guardians for all
  using (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))))
  with check (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))));

create policy "academic_years_select" on academic_years for select
  using (
    is_platform_staff() or is_guardian_of_student(student_id) or is_own_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo','docente']))
  );
create policy "academic_years_write" on academic_years for all
  using (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))))
  with check (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))));

create policy "previous_schools_select" on previous_schools for select
  using (
    is_platform_staff() or is_guardian_of_student(student_id) or is_own_student(student_id)
    or exists (select 1 from students s where s.id = student_id and has_school_role(s.school_id, array['admin','administrativo','docente']))
  );
create policy "previous_schools_write" on previous_schools for all
  using (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))))
  with check (exists (select 1 from students s where s.id = student_id and (is_platform_staff() or has_school_role(s.school_id, array['admin','administrativo']))));
