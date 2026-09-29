"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function slotFields(formData: FormData) {
  const contentType = String(formData.get("content_type") ?? "");
  return {
    period_id: String(formData.get("period_id") ?? "").trim() || null,
    day_of_week: Number(formData.get("day_of_week")),
    classroom: String(formData.get("classroom") ?? "").trim() || null,
    course_offering_id:
      contentType === "course"
        ? String(formData.get("course_offering_id") ?? "").trim() || null
        : null,
    activity_id:
      contentType === "activity"
        ? String(formData.get("activity_id") ?? "").trim() || null
        : null,
  };
}

export async function createScheduleSlot(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar el horario." };
  }

  const fields = slotFields(formData);
  if (!fields.period_id) return { error: "Falta la franja horaria." };
  if (!fields.course_offering_id && !fields.activity_id) {
    return { error: "Elige un curso o una actividad." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_slots").insert({
    school_id: ctx.schoolId,
    period_id: fields.period_id,
    day_of_week: fields.day_of_week,
    course_offering_id: fields.course_offering_id,
    activity_id: fields.activity_id,
    classroom: fields.classroom,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Esa actividad ya está en esa franja y día."
          : "No se pudo crear el bloque de horario.",
    };
  }

  revalidatePath("/horario");
  return undefined;
}

export async function updateScheduleSlot(
  slotId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar el horario." };
  }

  const fields = slotFields(formData);
  if (!fields.course_offering_id && !fields.activity_id) {
    return { error: "Elige un curso o una actividad." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_slots")
    .update({
      course_offering_id: fields.course_offering_id,
      activity_id: fields.activity_id,
      classroom: fields.classroom,
    })
    .eq("id", slotId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Esa actividad ya está en esa franja y día."
          : "No se pudo guardar el bloque de horario.",
    };
  }

  revalidatePath("/horario");
  return undefined;
}

export async function deleteScheduleSlot(
  slotId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar el horario." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_slots")
    .delete()
    .eq("id", slotId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo eliminar el bloque de horario." };

  revalidatePath("/horario");
  return undefined;
}
