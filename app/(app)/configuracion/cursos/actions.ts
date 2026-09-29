"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Course = Database["public"]["Tables"]["courses"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createCourse(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear cursos." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({
    school_id: ctx.schoolId,
    name,
    short_code: str(formData, "short_code"),
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un curso con ese nombre."
          : "No se pudo crear el curso.",
    };
  }

  revalidatePath("/configuracion/cursos");
  return undefined;
}

export async function updateCourse(
  courseId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar cursos." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      name,
      short_code: str(formData, "short_code"),
      active: bool(formData, "active"),
    })
    .eq("id", courseId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un curso con ese nombre."
          : "No se pudo guardar el curso.",
    };
  }

  revalidatePath("/configuracion/cursos");
  return undefined;
}

export type { Course };
