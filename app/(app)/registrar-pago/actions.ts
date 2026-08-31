"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const CAN_WRITE_ROLES = ["admin", "administrativo"];
const IGV_RATE = 0.18;

export type PaymentItemInput = { invoiceId: string; amount: number };

export type RegisterPaymentInput = {
  studentId: string;
  guardianId: string | null;
  seriesId: string;
  originId: string;
  reference: string | null;
  paymentDate: string;
  items: PaymentItemInput[];
};

export type RegisterPaymentResult =
  | { error: string }
  | { documentId: string; correlativeLabel: string };

// round a 2 decimales evitando el clásico error de coma flotante
function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function registerPayment(
  input: RegisterPaymentInput
): Promise<RegisterPaymentResult> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para registrar pagos." };
  }
  if (input.items.length === 0) {
    return { error: "Selecciona al menos una boleta." };
  }

  const supabase = await createClient();
  const schoolId = ctx.schoolId;

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", input.studentId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!student) return { error: "Alumno no encontrado." };

  const { data: series } = await supabase
    .from("document_series")
    .select("id, series_code, active, document_types!inner(school_id, requires_igv)")
    .eq("id", input.seriesId)
    .eq("document_types.school_id", schoolId)
    .maybeSingle();
  if (!series || !series.active) {
    return { error: "La serie de documento no es válida." };
  }

  const { data: origin } = await supabase
    .from("payment_origins")
    .select("id, active, requires_reference")
    .eq("id", input.originId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!origin || !origin.active) {
    return { error: "El origen de pago no es válido." };
  }
  if (origin.requires_reference && !input.reference) {
    return { error: "Este origen de pago requiere un número de referencia." };
  }

  if (input.guardianId) {
    const { data: link } = await supabase
      .from("student_guardians")
      .select("guardian_id")
      .eq("student_id", input.studentId)
      .eq("guardian_id", input.guardianId)
      .maybeSingle();
    if (!link) return { error: "El apoderado no está vinculado a este alumno." };
  }

  const invoiceIds = input.items.map((i) => i.invoiceId);
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, student_id, academic_year, month, concept_type, balance, status")
    .in("id", invoiceIds)
    .eq("student_id", input.studentId)
    .eq("school_id", schoolId);

  if (!invoices || invoices.length !== invoiceIds.length) {
    return { error: "Alguna boleta seleccionada no es válida." };
  }

  for (const item of input.items) {
    const invoice = invoices.find((inv) => inv.id === item.invoiceId)!;
    if (invoice.status === "pagado" || invoice.status === "anulado") {
      return { error: "Alguna boleta seleccionada ya no está pendiente." };
    }
    if (item.amount <= 0) {
      return { error: "El monto a pagar debe ser mayor a cero." };
    }
    if (item.amount > (invoice.balance ?? 0) + 0.01) {
      return { error: "El monto a pagar no puede superar el saldo pendiente." };
    }
  }

  const requiresIgv = series.document_types.requires_igv;
  const totalAmount = round2(input.items.reduce((sum, i) => sum + i.amount, 0));
  const igvTotal = requiresIgv ? round2((totalAmount * IGV_RATE) / (1 + IGV_RATE)) : 0;
  const subtotal = round2(totalAmount - igvTotal);

  const { data: correlative, error: correlativeError } = await supabase.rpc(
    "next_document_correlative",
    { p_series_id: input.seriesId }
  );
  if (correlativeError || correlative === null) {
    return { error: "No se pudo asignar el correlativo del documento." };
  }

  const { data: document, error: documentError } = await supabase
    .from("payment_documents")
    .insert({
      school_id: schoolId,
      series_id: input.seriesId,
      correlative,
      student_id: input.studentId,
      guardian_id: input.guardianId,
      origin_id: input.originId,
      payment_date: input.paymentDate,
      reference: input.reference,
      subtotal,
      discount_total: 0,
      mora_total: 0,
      igv_total: igvTotal,
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    return { error: "No se pudo crear el documento de pago." };
  }

  const items = input.items.map((item, index) => {
    const invoice = invoices.find((inv) => inv.id === item.invoiceId)!;
    const itemIgv = requiresIgv
      ? round2((item.amount * IGV_RATE) / (1 + IGV_RATE))
      : 0;
    return {
      document_id: document.id,
      invoice_id: item.invoiceId,
      item_order: index + 1,
      academic_year: invoice.academic_year,
      month: invoice.month,
      concept_type: invoice.concept_type,
      unit_amount: item.amount,
      quantity: 1,
      discount_amount: 0,
      mora_amount: 0,
      igv_amount: itemIgv,
      total_pago: item.amount,
    };
  });

  const { error: itemsError } = await supabase
    .from("payment_document_items")
    .insert(items);

  if (itemsError) {
    // El documento quedó creado sin items — lo anulamos para no dejar un
    // comprobante fantasma con correlativo consumido pero sin líneas.
    await supabase
      .from("payment_documents")
      .update({ status: "anulado" })
      .eq("id", document.id);
    return { error: "No se pudieron registrar los conceptos del pago." };
  }

  revalidatePath("/cobros");
  revalidatePath("/registrar-pago");

  return {
    documentId: document.id,
    correlativeLabel: `${series.series_code}-${String(correlative).padStart(6, "0")}`,
  };
}
