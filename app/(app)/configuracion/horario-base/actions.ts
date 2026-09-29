"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SchedulePeriod = Database["public"]["Tables"]["schedule_periods"]["Row"];

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function periodFields(formData: FormData) {
  return {
    start_time: str(formData, "start_time"),
    end_time: str(formData, "end_time"),
    is_break: bool(formData, "is_break"),
    label: str(formData, "label"),
  };
}

export async function createSchedulePeriod(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear franjas horarias." };
  }

  const fields = periodFields(formData);
  if (!fields.start_time || !fields.end_time) {
    return { error: "Hora de inicio y hora de fin son obligatorias." };
  }
  if (fields.end_time <= fields.start_time) {
    return { error: "La hora de fin debe ser posterior a la de inicio." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("schedule_periods").insert({
    school_id: ctx.schoolId,
    start_time: fields.start_time,
    end_time: fields.end_time,
    is_break: fields.is_break,
    label: fields.label,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe una franja que empieza a esa hora."
          : "No se pudo crear la franja horaria.",
    };
  }

  revalidatePath("/configuracion/horario-base");
  revalidatePath("/horario");
  return undefined;
}

export async function updateSchedulePeriod(
  periodId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar franjas horarias." };
  }

  const fields = periodFields(formData);
  if (!fields.start_time || !fields.end_time) {
    return { error: "Hora de inicio y hora de fin son obligatorias." };
  }
  if (fields.end_time <= fields.start_time) {
    return { error: "La hora de fin debe ser posterior a la de inicio." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_periods")
    .update({
      start_time: fields.start_time,
      end_time: fields.end_time,
      is_break: fields.is_break,
      label: fields.label,
    })
    .eq("id", periodId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe una franja que empieza a esa hora."
          : "No se pudo guardar la franja horaria.",
    };
  }

  revalidatePath("/configuracion/horario-base");
  revalidatePath("/horario");
  return undefined;
}

export async function deleteSchedulePeriod(
  periodId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar franjas horarias." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("schedule_periods")
    .delete()
    .eq("id", periodId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo eliminar la franja horaria." };

  revalidatePath("/configuracion/horario-base");
  revalidatePath("/horario");
  return undefined;
}

export type { SchedulePeriod };
