-- ============================================================================
-- 50. TALONARIO Y REGISTRO DE PAGOS
-- ============================================================================

create table document_types (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  name           text not null,             -- 'Boleta', 'Factura', 'Boleta electrónica'...
  short_code     text,
  is_electronic  boolean not null default false,
  requires_igv   boolean not null default false,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table document_series (
  id                uuid primary key default gen_random_uuid(),
  document_type_id  uuid not null references document_types(id) on delete cascade,
  series_code       text not null,          -- '001'
  next_correlative  int not null default 1,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  unique (document_type_id, series_code)
);

create table payment_origins (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references schools(id) on delete cascade,
  name                text not null,        -- 'Efectivo', 'Yape', 'Transferencia'...
  requires_reference  boolean not null default false,
  active              boolean not null default true,
  created_at          timestamptz not null default now()
);

create table payment_documents (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  series_id       uuid not null references document_series(id) on delete restrict,
  correlative     int not null,

  student_id      uuid not null references students(id) on delete restrict,
  guardian_id     uuid references guardians(id) on delete set null,   -- responsable de pago
  origin_id       uuid not null references payment_origins(id) on delete restrict,

  issue_date      date not null default current_date,
  payment_date    date not null default current_date,
  reference       text,                                                -- nro operación banco/transferencia
  currency        currency_type not null default 'PEN',

  subtotal        numeric(10,2) not null default 0,
  discount_total  numeric(10,2) not null default 0,
  mora_total      numeric(10,2) not null default 0,
  igv_total       numeric(10,2) not null default 0,
  total_amount    numeric(10,2) not null default 0,

  status          document_status not null default 'emitido',
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),

  unique (series_id, correlative)
);

create index idx_payment_documents_school on payment_documents(school_id);
create index idx_payment_documents_student on payment_documents(student_id);

create table payment_document_items (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references payment_documents(id) on delete cascade,
  invoice_id       uuid not null references invoices(id) on delete restrict,
  item_order       int not null default 1,

  academic_year    int,
  month            int,
  concept_type     concept_type,            -- snapshot, por si el concepto cambia luego

  unit_amount      numeric(10,2) not null,
  quantity         numeric(10,2) not null default 1,
  amount           numeric(10,2) generated always as (unit_amount * quantity) stored,
  discount_amount  numeric(10,2) not null default 0,
  mora_amount      numeric(10,2) not null default 0,
  igv_amount       numeric(10,2) not null default 0,
  total_pago       numeric(10,2) not null,

  created_at       timestamptz not null default now()
);

create index idx_payment_document_items_document on payment_document_items(document_id);
create index idx_payment_document_items_invoice on payment_document_items(invoice_id);

-- ============================================================================
-- Trigger: recalcular paid_amount / status de la boleta con cada línea de pago
-- ============================================================================

create or replace function recalc_invoice_status()
returns trigger as $$
declare
  v_invoice_id uuid;
  v_total_paid numeric(10,2);
  v_amount     numeric(10,2);
  v_due_date   date;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select coalesce(sum(total_pago), 0) into v_total_paid
  from payment_document_items where invoice_id = v_invoice_id;

  select amount, due_date into v_amount, v_due_date
  from invoices where id = v_invoice_id;

  -- Cast explícito a invoice_status en cada rama: un CASE anidado de solo
  -- literales de texto no siempre hereda el tipo de la columna destino en
  -- una asignación dentro de plpgsql (a diferencia de SQL estático), y falla
  -- con "column is of type invoice_status but expression is of type text".
  update invoices
  set paid_amount = least(v_total_paid, v_amount),
      status = case
        when v_total_paid <= 0 then
          case when due_date < current_date then 'vencido'::invoice_status else 'pendiente'::invoice_status end
        when v_total_paid < v_amount then
          case when due_date < current_date then 'vencido'::invoice_status else 'parcial'::invoice_status end
        else 'pagado'::invoice_status
      end,
      updated_at = now()
  where id = v_invoice_id;

  return coalesce(new, old);
end;
$$ language plpgsql set search_path = public;

create trigger trg_payment_document_items_recalc
after insert or update or delete on payment_document_items
for each row execute function recalc_invoice_status();

-- ============================================================================
-- Función: obtener el siguiente correlativo de una serie, de forma atómica
-- ============================================================================

create or replace function next_document_correlative(p_series_id uuid)
returns int as $$
declare
  v_next int;
begin
  update document_series
  set next_correlative = next_correlative + 1
  where id = p_series_id
  returning next_correlative - 1 into v_next;

  return v_next;
end;
$$ language plpgsql set search_path = public;

-- ============================================================================
-- Función: crea el catálogo por defecto (talonario + orígenes de pago)
-- para un colegio recién registrado
-- ============================================================================

create or replace function seed_default_school_catalog(p_school_id uuid)
returns void as $$
declare
  v_boleta_id uuid;
  v_factura_id uuid;
begin
  insert into document_types (school_id, name, short_code, is_electronic, requires_igv)
  values (p_school_id, 'Boleta', 'B', false, false)
  returning id into v_boleta_id;

  insert into document_types (school_id, name, short_code, is_electronic, requires_igv)
  values (p_school_id, 'Factura', 'F', false, true)
  returning id into v_factura_id;

  insert into document_series (document_type_id, series_code) values (v_boleta_id, '001');
  insert into document_series (document_type_id, series_code) values (v_factura_id, '001');

  insert into payment_origins (school_id, name, requires_reference) values
    (p_school_id, 'Efectivo', false),
    (p_school_id, 'Transferencia', true),
    (p_school_id, 'Yape', true),
    (p_school_id, 'Plin', true),
    (p_school_id, 'POS', true);
end;
$$ language plpgsql set search_path = public;

-- Vista de solo lectura para el historial del padre (2 estados, no 4).
-- security_invoker = true: debe respetar el RLS de `invoices` según quien
-- consulta (padre/alumno), no los permisos del creador de la vista.
create view student_invoices_display
with (security_invoker = true)
as
select
  i.*,
  case
    when i.status = 'pagado' then 'Pagado'
    when i.status = 'anulado' then 'Anulado'
    else 'Pendiente de pago'
  end as display_status
from invoices i;
