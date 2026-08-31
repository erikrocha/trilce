-- ============================================================================
-- 40. TESORERÍA: lista de precios y boletas por cobrar
-- ============================================================================

create table tuition_schedule (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  academic_year  int not null,
  concept_type   concept_type not null,
  month          int check (month between 1 and 12),
  amount         numeric(10,2) not null,
  currency       currency_type not null default 'PEN',
  created_at     timestamptz not null default now(),
  unique (school_id, academic_year, concept_type, month)
);

create table invoices (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  student_id     uuid not null references students(id) on delete restrict,
  schedule_id    uuid references tuition_schedule(id) on delete set null,

  academic_year  int not null,
  concept_type   concept_type not null,
  month          int check (month between 1 and 12),
  description    text not null,

  currency       currency_type not null default 'PEN',
  amount         numeric(10,2) not null,

  paid_amount    numeric(10,2) not null default 0,
  balance        numeric(10,2) generated always as (amount - paid_amount) stored,
  status         invoice_status not null default 'pendiente',

  due_date         date not null,
  prorroga_date    date,
  discount_amount  numeric(10,2) not null default 0,
  discount_reason  discount_reason,
  mora_amount      numeric(10,2) not null default 0,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint chk_paid_not_negative check (paid_amount >= 0),
  constraint chk_paid_not_over check (paid_amount <= amount)
);

create index idx_invoices_school on invoices(school_id);
create index idx_invoices_student on invoices(student_id);
create index idx_invoices_status on invoices(school_id, status);

create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();
