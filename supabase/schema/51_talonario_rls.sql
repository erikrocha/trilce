-- ============================================================================
-- 51. RLS: talonario y pagos
-- ============================================================================

alter table document_types enable row level security;
alter table document_series enable row level security;
alter table payment_origins enable row level security;
alter table payment_documents enable row level security;
alter table payment_document_items enable row level security;

create policy "document_types_select" on document_types for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "document_types_write" on document_types for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "document_series_select" on document_series for select
  using (is_platform_staff() or exists (select 1 from document_types dt where dt.id = document_type_id and has_school_access(dt.school_id)));
create policy "document_series_write" on document_series for all
  using (is_platform_staff() or exists (select 1 from document_types dt where dt.id = document_type_id and has_school_role(dt.school_id, array['admin','administrativo'])))
  with check (is_platform_staff() or exists (select 1 from document_types dt where dt.id = document_type_id and has_school_role(dt.school_id, array['admin','administrativo'])));

create policy "payment_origins_select" on payment_origins for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "payment_origins_write" on payment_origins for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "payment_documents_select" on payment_documents for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or is_guardian_of_student(student_id)
    or is_own_student(student_id)
  );
create policy "payment_documents_write" on payment_documents for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "payment_document_items_select" on payment_document_items for select
  using (
    is_platform_staff()
    or exists (select 1 from payment_documents pd where pd.id = document_id and (
      has_school_role(pd.school_id, array['admin','administrativo'])
      or is_guardian_of_student(pd.student_id)
      or is_own_student(pd.student_id)
    ))
  );
create policy "payment_document_items_write" on payment_document_items for all
  using (exists (select 1 from payment_documents pd where pd.id = document_id and (is_platform_staff() or has_school_role(pd.school_id, array['admin','administrativo']))))
  with check (exists (select 1 from payment_documents pd where pd.id = document_id and (is_platform_staff() or has_school_role(pd.school_id, array['admin','administrativo']))));
