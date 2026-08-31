-- ============================================================================
-- 31. RLS: identidad
-- ============================================================================

alter table user_profiles enable row level security;
alter table memberships enable row level security;
alter table membership_invites enable row level security;
alter table mfa_factors enable row level security;
alter table auth_challenges enable row level security;
alter table trusted_devices enable row level security;

create policy "user_profiles_select_own" on user_profiles for select
  using (id = auth.uid() or is_platform_staff());
create policy "user_profiles_update_own" on user_profiles for update
  using (id = auth.uid());

create policy "memberships_select" on memberships for select
  using (user_id = auth.uid() or is_platform_staff() or has_school_role(school_id, array['admin']));
create policy "memberships_write" on memberships for all
  using (is_platform_staff() or has_school_role(school_id, array['admin']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin']));

create policy "membership_invites_select" on membership_invites for select
  using (is_platform_staff() or has_school_role(school_id, array['admin']));
create policy "membership_invites_write" on membership_invites for all
  using (is_platform_staff() or has_school_role(school_id, array['admin']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin']));

create policy "mfa_factors_own" on mfa_factors for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "auth_challenges_own" on auth_challenges for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "trusted_devices_own" on trusted_devices for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
