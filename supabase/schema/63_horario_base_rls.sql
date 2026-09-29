-- ============================================================================
-- 63. RLS: horario base (franjas, actividades) + reemplazo de las políticas
-- de schedule_slots de 61_horario_rls.sql (ya no pueden asumir que
-- course_offering_id siempre existe).
-- ============================================================================

alter table schedule_periods enable row level security;
alter table schedule_activities enable row level security;

-- Catálogos de solo nombre/horario — cualquier miembro activo los lee,
-- mismo patrón que class_groups/courses (33/61).
create policy "schedule_periods_select" on schedule_periods for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "schedule_periods_write" on schedule_periods for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "schedule_activities_select" on schedule_activities for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "schedule_activities_write" on schedule_activities for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

-- schedule_slots ahora puede ser un curso (mismo alcance que antes: solo su
-- docente vía teacher_id, o quien tenga acceso a esa class_group) o una
-- actividad global (visible para cualquier miembro activo del colegio,
-- igual que un catálogo — no hay nada privado en "Recreo" o "Plan Lector").
drop policy "schedule_slots_select" on schedule_slots;
create policy "schedule_slots_select" on schedule_slots for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or (activity_id is not null and has_school_access(school_id))
    or (
      course_offering_id is not null
      and exists (
        select 1 from course_offerings co
        where co.id = course_offering_id
          and (
            co.teacher_id = current_staff_id(co.school_id)
            or has_class_group_access(co.class_group_id)
          )
      )
    )
  );

drop policy "schedule_slots_write" on schedule_slots;
create policy "schedule_slots_write" on schedule_slots for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));
