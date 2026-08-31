-- ============================================================================
-- 10. PLATAFORMA SAAS: colegios, planes, suscripciones, billing, staff
-- ============================================================================

create table platform_staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  role        platform_staff_role not null default 'support',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table schools (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique,
  subdomain         text unique,
  school_type       school_type not null default 'privado',
  status            school_status not null default 'trial',
  trial_ends_at     timestamptz,
  suspended_at      timestamptz,
  suspended_reason  text,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_schools_status on schools(status) where deleted_at is null;

create table plans (
  id                        uuid primary key default gen_random_uuid(),
  code                      text unique not null,       -- 'gratuito' | 'prueba' | 'pro'
  name                      text not null,
  pricing_model             pricing_model not null,
  price_per_student         numeric(10,2),               -- solo si pricing_model = 'per_student'
  fixed_price               numeric(10,2),                -- solo si pricing_model = 'fixed'
  max_students              int,                            -- null = ilimitado
  max_teachers              int,
  max_guardians             int,
  trial_days                int,
  requires_manual_approval  boolean not null default false,
  active                    boolean not null default true,
  created_at                timestamptz not null default now()
);

create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references schools(id) on delete cascade,
  plan_id               uuid not null references plans(id) on delete restrict,
  status                subscription_status not null default 'trialing',
  activation_type       activation_type not null default 'manual',
  activated_by          uuid references auth.users(id),
  trial_ends_at         timestamptz,
  current_period_start  timestamptz not null default now(),
  current_period_end    timestamptz,
  cancel_at_period_end  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_subscriptions_school on subscriptions(school_id);

create table billing_invoices (
  id                      uuid primary key default gen_random_uuid(),
  subscription_id         uuid not null references subscriptions(id) on delete restrict,
  period_start             date not null,
  period_end               date not null,
  student_count_snapshot   int,
  amount                   numeric(10,2) not null,
  currency                 currency_type not null default 'PEN',
  provider                 gateway_provider not null default 'manual',
  provider_reference       text,
  status                   billing_invoice_status not null default 'pendiente',
  due_date                 date,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now()
);

create index idx_billing_invoices_subscription on billing_invoices(subscription_id);

create table payment_gateway_accounts (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references schools(id) on delete cascade,
  provider              gateway_provider not null,
  external_customer_id  text,
  metadata              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  unique (school_id, provider)
);

create table audit_logs (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users(id),
  action         text not null,      -- 'school.created', 'school.suspended', ...
  entity_type    text not null,
  entity_id      uuid,
  changes        jsonb,
  created_at     timestamptz not null default now()
);

create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

create trigger trg_schools_updated_at before update on schools
  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();
