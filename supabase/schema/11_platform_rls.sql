-- ============================================================================
-- 11. RLS: plataforma
-- ============================================================================

alter table platform_staff enable row level security;
alter table schools enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table billing_invoices enable row level security;
alter table payment_gateway_accounts enable row level security;
alter table audit_logs enable row level security;

create policy "platform_staff_select" on platform_staff for select
  using (is_platform_staff() or user_id = auth.uid());
create policy "platform_staff_write" on platform_staff for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "schools_select" on schools for select
  using (is_platform_staff() or has_school_access(id));
create policy "schools_write" on schools for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "plans_select" on plans for select using (true);
create policy "plans_write" on plans for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "subscriptions_select" on subscriptions for select
  using (is_platform_staff() or has_school_role(school_id, array['admin']));
create policy "subscriptions_write" on subscriptions for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "billing_invoices_select" on billing_invoices for select
  using (
    is_platform_staff()
    or exists (
      select 1 from subscriptions s
      where s.id = subscription_id and has_school_role(s.school_id, array['admin'])
    )
  );
create policy "billing_invoices_write" on billing_invoices for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "payment_gateway_accounts_select" on payment_gateway_accounts for select
  using (is_platform_staff() or has_school_role(school_id, array['admin']));
create policy "payment_gateway_accounts_write" on payment_gateway_accounts for all
  using (is_platform_staff()) with check (is_platform_staff());

create policy "audit_logs_select" on audit_logs for select
  using (is_platform_staff());
create policy "audit_logs_insert" on audit_logs for insert
  with check (is_platform_staff());
