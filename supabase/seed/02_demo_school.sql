-- ============================================================================
-- SEED (solo desarrollo local): colegio demo con catálogo y precios 2026
-- ============================================================================
do $$
declare
  v_school_id uuid;
  v_plan_id uuid;
begin
  insert into schools (name, slug, school_type, status)
  values ('Colegio Demo', 'colegio-demo', 'privado', 'active')
  returning id into v_school_id;

  select id into v_plan_id from plans where code = 'pro';

  insert into subscriptions (school_id, plan_id, status, activation_type, current_period_end)
  values (v_school_id, v_plan_id, 'active', 'manual', now() + interval '30 days');

  perform seed_default_school_catalog(v_school_id);

  insert into tuition_schedule (school_id, academic_year, concept_type, month, amount) values
    (v_school_id, 2026, 'matricula', null, 200.00),
    (v_school_id, 2026, 'pension', 3, 300.00),
    (v_school_id, 2026, 'pension', 4, 300.00),
    (v_school_id, 2026, 'pension', 5, 300.00),
    (v_school_id, 2026, 'pension', 6, 300.00),
    (v_school_id, 2026, 'pension', 7, 300.00),
    (v_school_id, 2026, 'pension', 8, 300.00),
    (v_school_id, 2026, 'pension', 9, 300.00),
    (v_school_id, 2026, 'pension', 10, 300.00),
    (v_school_id, 2026, 'pension', 11, 300.00),
    (v_school_id, 2026, 'pension', 12, 250.00);
end $$;
