-- ============================================================================
-- 61. RLS: horario académico
-- ============================================================================

alter table class_groups enable row level security;
alter table courses enable row level security;
alter table course_offerings enable row level security;
alter table schedule_slots enable row level security;

-- class_groups y courses son catálogos de solo nombre/etiqueta — igual que
-- document_types/payment_origins, cualquier miembro activo del colegio los
-- lee; solo admin/administrativo los edita.
create policy "class_groups_select" on class_groups for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "class_groups_write" on class_groups for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "courses_select" on courses for select
  using (is_platform_staff() or has_school_access(school_id));
create policy "courses_write" on courses for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

-- course_offerings / schedule_slots: NUNCA has_school_role(...,'docente') —
-- eso le daría al docente el colegio entero. Su único camino de acceso es
-- teacher_id = current_staff_id(school_id). Alumno/padre solo ven su propia
-- class_group_id vía has_class_group_access().
create policy "course_offerings_select" on course_offerings for select
  using (
    is_platform_staff()
    or has_school_role(school_id, array['admin','administrativo'])
    or teacher_id = current_staff_id(school_id)
    or has_class_group_access(class_group_id)
  );
create policy "course_offerings_write" on course_offerings for all
  using (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']))
  with check (is_platform_staff() or has_school_role(school_id, array['admin','administrativo']));

create policy "schedule_slots_select" on schedule_slots for select
  using (
    is_platform_staff()
    or exists (
      select 1 from course_offerings co
      where co.id = course_offering_id
        and (
          has_school_role(co.school_id, array['admin','administrativo'])
          or co.teacher_id = current_staff_id(co.school_id)
          or has_class_group_access(co.class_group_id)
        )
    )
  );
create policy "schedule_slots_write" on schedule_slots for all
  using (exists (
    select 1 from course_offerings co
    where co.id = course_offering_id
      and (is_platform_staff() or has_school_role(co.school_id, array['admin','administrativo']))
  ))
  with check (exists (
    select 1 from course_offerings co
    where co.id = course_offering_id
      and (is_platform_staff() or has_school_role(co.school_id, array['admin','administrativo']))
  ));
