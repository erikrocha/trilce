"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DiscountReason = Database["public"]["Enums"]["discount_reason"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function numberOrZero(formData: FormData, key: string) {
  const value = str(formData, key);
  if (value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Nota: nunca se toca paid_amount ni status aquí — eso lo mantiene
// recalc_invoice_status() en base a payment_document_items (CLAUDE.md §2).
export async function updateInvoice(
  invoiceId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar boletas." };
  }

  const discountAmount = numberOrZero(formData, "discount_amount");
  const moraAmount = numberOrZero(formData, "mora_amount");
  const discountReason = str(formData, "discount_reason") as
    | DiscountReason
    | null;
  const prorrogaDate = str(formData, "prorroga_date");

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      discount_amount: discountAmount,
      discount_reason: discountAmount > 0 ? discountReason : null,
      mora_amount: moraAmount,
      prorroga_date: prorrogaDate,
    })
    .eq("id", invoiceId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return { error: "No se pudo guardar la boleta." };
  }

  revalidatePath("/cobros");
  return undefined;
}
