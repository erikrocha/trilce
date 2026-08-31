"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SexType = Database["public"]["Enums"]["sex_type"];
type DocumentIdType = Database["public"]["Enums"]["document_id_type"];
type Guardian = Database["public"]["Tables"]["guardians"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function guardianFields(formData: FormData) {
  return {
    paternal_surname: str(formData, "paternal_surname"),
    maternal_surname: str(formData, "maternal_surname"),
    first_names: str(formData, "first_names"),
    sex: str(formData, "sex") as SexType | null,
    birth_date: str(formData, "birth_date"),
    document_type: (str(formData, "document_type") ?? "DNI") as DocumentIdType,
    document_number: str(formData, "document_number"),
    address: str(formData, "address"),
    phone: str(formData, "phone"),
    mobile: str(formData, "mobile"),
    email: str(formData, "email"),
    education_level: str(formData, "education_level"),
    profession: str(formData, "profession"),
    job_title: str(formData, "job_title"),
    workplace: str(formData, "workplace"),
    work_phone: str(formData, "work_phone"),
    work_address: str(formData, "work_address"),
  };
}

export async function createGuardian(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear apoderados." };
  }

  const fields = guardianFields(formData);
  const first_names = fields.first_names;
  if (!first_names) {
    return { error: "Los nombres son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("guardians").insert({
    school_id: ctx.schoolId,
    ...fields,
    first_names,
  });

  if (error) {
    return { error: "No se pudo guardar el apoderado." };
  }

  revalidatePath("/apoderados");
  return undefined;
}

export async function updateGuardian(
  guardianId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar apoderados." };
  }

  const fields = guardianFields(formData);
  const first_names = fields.first_names;
  if (!first_names) {
    return { error: "Los nombres son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .update({ ...fields, first_names })
    .eq("id", guardianId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return { error: "No se pudo guardar el apoderado." };
  }

  revalidatePath("/apoderados");
  return undefined;
}

export async function deleteGuardian(
  guardianId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar apoderados." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .delete()
    .eq("id", guardianId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return { error: "No se pudo eliminar el apoderado." };
  }

  revalidatePath("/apoderados");
  return undefined;
}

export type { Guardian };
