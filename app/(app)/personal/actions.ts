"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type StaffType = Database["public"]["Enums"]["staff_type"];
type DocumentIdType = Database["public"]["Enums"]["document_id_type"];
type StaffMember = Database["public"]["Tables"]["staff_members"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function staffFields(formData: FormData) {
  return {
    full_name: str(formData, "full_name"),
    staff_type: str(formData, "staff_type") as StaffType | null,
    document_type: (str(formData, "document_type") ?? "DNI") as DocumentIdType,
    document_number: str(formData, "document_number"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    hire_date: str(formData, "hire_date"),
  };
}

export async function createStaffMember(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear personal." };
  }

  const fields = staffFields(formData);
  if (!fields.full_name || !fields.staff_type) {
    return { error: "Nombre completo y tipo de personal son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_members").insert({
    school_id: ctx.schoolId,
    full_name: fields.full_name,
    staff_type: fields.staff_type,
    document_type: fields.document_type,
    document_number: fields.document_number,
    phone: fields.phone,
    email: fields.email,
    hire_date: fields.hire_date,
  });

  if (error) return { error: "No se pudo guardar el personal." };

  revalidatePath("/personal");
  return undefined;
}

export async function updateStaffMember(
  staffId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar personal." };
  }

  const fields = staffFields(formData);
  if (!fields.full_name || !fields.staff_type) {
    return { error: "Nombre completo y tipo de personal son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_members")
    .update({
      full_name: fields.full_name,
      staff_type: fields.staff_type,
      document_type: fields.document_type,
      document_number: fields.document_number,
      phone: fields.phone,
      email: fields.email,
      hire_date: fields.hire_date,
      active: bool(formData, "active"),
    })
    .eq("id", staffId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo guardar el personal." };

  revalidatePath("/personal");
  return undefined;
}

export type { StaffMember };
