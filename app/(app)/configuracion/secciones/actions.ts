"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type EnrollmentLevel = Database["public"]["Enums"]["enrollment_level"];
type ClassGroup = Database["public"]["Tables"]["class_groups"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function classGroupFields(formData: FormData) {
  return {
    academic_year: Number(formData.get("academic_year")),
    level: str(formData, "level") as EnrollmentLevel | null,
    grade: str(formData, "grade"),
    section: str(formData, "section"),
  };
}

export async function createClassGroup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear secciones." };
  }

  const fields = classGroupFields(formData);
  if (!fields.academic_year || !fields.level || !fields.grade || !fields.section) {
    return { error: "Año, nivel, grado y sección son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_groups").insert({
    school_id: ctx.schoolId,
    academic_year: fields.academic_year,
    level: fields.level,
    grade: fields.grade,
    section: fields.section,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe esa sección para ese año."
          : "No se pudo crear la sección.",
    };
  }

  revalidatePath("/configuracion/secciones");
  return undefined;
}

export async function updateClassGroup(
  classGroupId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar secciones." };
  }

  const fields = classGroupFields(formData);
  if (!fields.academic_year || !fields.level || !fields.grade || !fields.section) {
    return { error: "Año, nivel, grado y sección son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_groups")
    .update({
      academic_year: fields.academic_year,
      level: fields.level,
      grade: fields.grade,
      section: fields.section,
    })
    .eq("id", classGroupId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe esa sección para ese año."
          : "No se pudo guardar la sección.",
    };
  }

  revalidatePath("/configuracion/secciones");
  return undefined;
}

export async function deleteClassGroup(
  classGroupId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar secciones." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_groups")
    .delete()
    .eq("id", classGroupId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo eliminar la sección." };

  revalidatePath("/configuracion/secciones");
  return undefined;
}

export type { ClassGroup };
