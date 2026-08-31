"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PaymentOrigin = Database["public"]["Tables"]["payment_origins"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createPaymentOrigin(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear orígenes de pago." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("payment_origins").insert({
    school_id: ctx.schoolId,
    name,
    requires_reference: bool(formData, "requires_reference"),
  });

  if (error) return { error: "No se pudo crear el origen de pago." };

  revalidatePath("/configuracion/pagos");
  return undefined;
}

export async function updatePaymentOrigin(
  originId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar orígenes de pago." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_origins")
    .update({
      name,
      requires_reference: bool(formData, "requires_reference"),
      active: bool(formData, "active"),
    })
    .eq("id", originId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo guardar el origen de pago." };

  revalidatePath("/configuracion/pagos");
  return undefined;
}

export type { PaymentOrigin };
