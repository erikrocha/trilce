-- ============================================================================
-- SEED: los 3 planes del SaaS
-- ============================================================================
insert into plans (code, name, pricing_model, price_per_student, max_students, trial_days, requires_manual_approval) values
('gratuito', 'Gratuito (colegios públicos)', 'free', null, null, null, true),
('prueba',   'Prueba 30 días',               'free', null, 50,   30,   false),
('pro',      'Pro',                          'per_student', 1.00, null, null, false);
