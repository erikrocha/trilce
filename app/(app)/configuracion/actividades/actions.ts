"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ScheduleActivity = Database["public"]["Tables"]["schedule_activities"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export async function createScheduleActivity(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear actividades." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_activities").insert({
    school_id: ctx.schoolId,
    name,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe una actividad con ese nombre."
          : "No se pudo crear la actividad.",
    };
  }

  revalidatePath("/configuracion/actividades");
  revalidatePath("/horario");
  return undefined;
}

export async function updateScheduleActivity(
  activityId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar actividades." };
  }

  const name = str(formData, "name");
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_activities")
    .update({
      name,
      active: bool(formData, "active"),
    })
    .eq("id", activityId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe una actividad con ese nombre."
          : "No se pudo guardar la actividad.",
    };
  }

  revalidatePath("/configuracion/actividades");
  revalidatePath("/horario");
  return undefined;
}

export type { ScheduleActivity };
