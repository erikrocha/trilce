-- ============================================================================
-- 36. Un admin/administrativo del colegio debe poder ver el username/perfil
-- de sus propios miembros (Miembros del Colegio) — la política original solo
-- dejaba ver el propio perfil o a platform_staff.
-- ============================================================================

drop policy "user_profiles_select_own" on user_profiles;
create policy "user_profiles_select_own" on user_profiles for select
  using (
    id = auth.uid()
    or is_platform_staff()
    or exists (
      select 1 from memberships m
      where m.user_id = user_profiles.id
        and has_school_role(m.school_id, array['admin','administrativo'])
    )
  );
