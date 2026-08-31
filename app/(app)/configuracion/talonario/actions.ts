"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type DocumentType = Database["public"]["Tables"]["document_types"]["Row"];

export type FormState =
  | { error: string }
  | { documentType: DocumentType }
  | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createDocumentType(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear tipos de documento." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { data: documentType, error } = await supabase
    .from("document_types")
    .insert({
      school_id: ctx.schoolId,
      name,
      short_code: str(formData, "short_code"),
      is_electronic: bool(formData, "is_electronic"),
      requires_igv: bool(formData, "requires_igv"),
    })
    .select()
    .single();

  if (error || !documentType) {
    return { error: "No se pudo crear el tipo de documento." };
  }

  revalidatePath("/configuracion/talonario");
  // Dejamos el panel abierto en modo edición: recién ahí existe un
  // document_type_id con el que crear series.
  return { documentType };
}

export async function updateDocumentType(
  documentTypeId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar tipos de documento." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_types")
    .update({
      name,
      short_code: str(formData, "short_code"),
      is_electronic: bool(formData, "is_electronic"),
      requires_igv: bool(formData, "requires_igv"),
      active: bool(formData, "active"),
    })
    .eq("id", documentTypeId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo guardar el tipo de documento." };

  revalidatePath("/configuracion/talonario");
  return undefined;
}

export async function addDocumentSeries(
  documentTypeId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear series." };
  }

  const seriesCode = str(formData, "series_code");
  if (!seriesCode) return { error: "El código de serie es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("document_series").insert({
    document_type_id: documentTypeId,
    series_code: seriesCode,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe esa serie para este tipo de documento."
          : "No se pudo crear la serie.",
    };
  }

  revalidatePath("/configuracion/talonario");
  return undefined;
}

export async function toggleDocumentSeriesActive(
  seriesId: string,
  active: boolean
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar series." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_series")
    .update({ active })
    .eq("id", seriesId);

  if (error) return { error: "No se pudo actualizar la serie." };

  revalidatePath("/configuracion/talonario");
  return undefined;
}

export type { DocumentType };
