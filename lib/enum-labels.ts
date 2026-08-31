// Etiquetas en español para enums de Postgres compartidos entre módulos
// (alumnos, apoderados, personal). Ver supabase/schema/00_extensions_and_enums.sql.

export const SEX_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DNI: "DNI",
  CE: "Carné de Extranjería",
  Pasaporte: "Pasaporte",
  Otro: "Otro",
};

export const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const CONCEPT_TYPE_LABELS: Record<string, string> = {
  matricula: "Matrícula",
  pension: "Pensión",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
  vencido: "Vencido",
  anulado: "Anulado",
};

export const SCHOOL_STATUS_LABELS: Record<string, string> = {
  trial: "Prueba",
  active: "Activo",
  past_due: "Pago vencido",
  suspended: "Suspendido",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago vencido",
  suspended: "Suspendida",
  canceled: "Cancelada",
};

export const PLATFORM_STAFF_ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  support: "Soporte",
};

export const STAFF_TYPE_LABELS: Record<string, string> = {
  docente: "Docente",
  administrativo: "Administrativo",
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  papa: "Papá",
  mama: "Mamá",
  apoderado: "Apoderado",
  abuelo: "Abuelo",
  abuela: "Abuela",
  tio: "Tío",
  tia: "Tía",
  hermano: "Hermano",
  otro: "Otro",
};

export const DISCOUNT_REASON_LABELS: Record<string, string> = {
  beca: "Beca",
  exoneracion: "Exoneración",
  descuento_comercial: "Descuento comercial",
  otro: "Otro",
};
