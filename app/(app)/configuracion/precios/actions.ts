"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string } | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function amountFrom(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export async function savePriceList(
  academicYear: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar la lista de precios." };
  }

  const supabase = await createClient();
  const schoolId = ctx.schoolId;

  // Matrícula tiene month = NULL. El índice único de tuition_schedule no
  // dispara ON CONFLICT para NULLs (Postgres trata NULL <> NULL), así que
  // no se puede resolver con .upsert() — hay que buscar y luego insert/update.
  const matriculaAmount = amountFrom(formData, "amount_matricula");
  const { data: existingMatricula } = await supabase
    .from("tuition_schedule")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year", academicYear)
    .eq("concept_type", "matricula")
    .is("month", null)
    .maybeSingle();

  if (matriculaAmount === null) {
    if (existingMatricula) {
      await supabase
        .from("tuition_schedule")
        .delete()
        .eq("id", existingMatricula.id);
    }
  } else if (existingMatricula) {
    await supabase
      .from("tuition_schedule")
      .update({ amount: matriculaAmount })
      .eq("id", existingMatricula.id);
  } else {
    const { error } = await supabase.from("tuition_schedule").insert({
      school_id: schoolId,
      academic_year: academicYear,
      concept_type: "matricula",
      month: null,
      amount: matriculaAmount,
    });
    if (error) return { error: "No se pudo guardar el monto de matrícula." };
  }

  // Pensiones: month 1-12 no es NULL, así que .upsert() con onConflict sí
  // funciona sobre el índice único (school_id, academic_year, concept_type, month).
  const toUpsert: {
    school_id: string;
    academic_year: number;
    concept_type: "pension";
    month: number;
    amount: number;
  }[] = [];
  const monthsToDelete: number[] = [];

  for (let month = 1; month <= 12; month++) {
    const amount = amountFrom(formData, `amount_month_${month}`);
    if (amount === null) {
      monthsToDelete.push(month);
    } else {
      toUpsert.push({
        school_id: schoolId,
        academic_year: academicYear,
        concept_type: "pension",
        month,
        amount,
      });
    }
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("tuition_schedule")
      .upsert(toUpsert, {
        onConflict: "school_id,academic_year,concept_type,month",
      });
    if (error) {
      return { error: "No se pudo guardar la lista de pensiones." };
    }
  }

  if (monthsToDelete.length > 0) {
    await supabase
      .from("tuition_schedule")
      .delete()
      .eq("school_id", schoolId)
      .eq("academic_year", academicYear)
      .eq("concept_type", "pension")
      .in("month", monthsToDelete);
  }

  revalidatePath("/configuracion/precios");
  return undefined;
}
