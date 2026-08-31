-- ============================================================================
-- 41. RLS: tesorería
-- ============================================================================

alter table tuition_schedule enable row level security;
alter table invoices enable row level security;

create policy "tuition_schedule_select" on tuition_schedule for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "tuition_schedule_write" on tuition_schedule for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "invoices_select" on invoices for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_guardian_of_student(student_id)
    or is_own_student(student_id)
  );
create policy "invoices_write" on invoices for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));
