-- ============================================================================
-- 00. EXTENSIONS & ENUMS
-- ============================================================================
create extension if not exists "pgcrypto";

-- Plataforma / colegios
create type school_type as enum ('publico', 'privado');
create type school_status as enum ('trial', 'active', 'past_due', 'suspended');
create type platform_staff_role as enum ('superadmin', 'support');
create type pricing_model as enum ('free', 'per_student', 'fixed');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'suspended', 'canceled');
create type activation_type as enum ('manual', 'gateway');
create type billing_invoice_status as enum ('pendiente', 'pagado', 'vencido', 'anulado');
create type gateway_provider as enum ('manual', 'pagoefectivo', 'stripe', 'culqi');

-- Identidad / autenticación
create type membership_role as enum ('admin', 'administrativo', 'docente', 'padre', 'alumno');
create type invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type mfa_factor_type as enum ('device_trust', 'email_otp', 'totp', 'sms');
create type challenge_purpose as enum ('device_verification', 'login_otp', 'password_reset');
create type challenge_status as enum ('pending', 'verified', 'expired', 'failed');

-- Núcleo académico
create type staff_type as enum ('docente', 'administrativo');
create type relationship_type as enum ('papa', 'mama', 'apoderado', 'abuelo', 'abuela', 'tio', 'tia', 'hermano', 'otro');
create type sex_type as enum ('M', 'F');
create type document_id_type as enum ('DNI', 'CE', 'Pasaporte', 'Otro');
create type student_status as enum ('activo', 'retirado', 'egresado');
create type enrollment_level as enum ('inicial', 'primaria', 'secundaria');

-- Tesorería
create type concept_type as enum ('matricula', 'pension');
create type currency_type as enum ('PEN', 'USD');
create type invoice_status as enum ('pendiente', 'parcial', 'pagado', 'vencido', 'anulado');
create type discount_reason as enum ('beca', 'exoneracion', 'descuento_comercial', 'otro');
create type document_status as enum ('emitido', 'anulado');
