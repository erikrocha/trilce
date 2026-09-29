"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type CourseOffering = Database["public"]["Tables"]["course_offerings"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function offeringFields(formData: FormData) {
  return {
    course_id: String(formData.get("course_id") ?? "").trim() || null,
    class_group_id: String(formData.get("class_group_id") ?? "").trim() || null,
    teacher_id: String(formData.get("teacher_id") ?? "").trim() || null,
  };
}

export async function createCourseOffering(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para asignar cursos." };
  }

  const fields = offeringFields(formData);
  if (!fields.course_id || !fields.class_group_id || !fields.teacher_id) {
    return { error: "Curso, sección y docente son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("course_offerings").insert({
    school_id: ctx.schoolId,
    course_id: fields.course_id,
    class_group_id: fields.class_group_id,
    teacher_id: fields.teacher_id,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ese curso ya está asignado a esa sección."
          : "No se pudo crear la asignación.",
    };
  }

  revalidatePath("/configuracion/asignacion-cursos");
  revalidatePath("/horario");
  return undefined;
}

export async function updateCourseOffering(
  offeringId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar asignaciones." };
  }

  const fields = offeringFields(formData);
  if (!fields.course_id || !fields.class_group_id || !fields.teacher_id) {
    return { error: "Curso, sección y docente son obligatorios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_offerings")
    .update({
      course_id: fields.course_id,
      class_group_id: fields.class_group_id,
      teacher_id: fields.teacher_id,
    })
    .eq("id", offeringId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ese curso ya está asignado a esa sección."
          : "No se pudo guardar la asignación.",
    };
  }

  revalidatePath("/configuracion/asignacion-cursos");
  revalidatePath("/horario");
  return undefined;
}

export async function deleteCourseOffering(
  offeringId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar asignaciones." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_offerings")
    .delete()
    .eq("id", offeringId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo eliminar la asignación." };

  revalidatePath("/configuracion/asignacion-cursos");
  revalidatePath("/horario");
  return undefined;
}

export type { CourseOffering };
