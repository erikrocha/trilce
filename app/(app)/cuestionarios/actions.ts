"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

export type FormState = { error: string } | undefined;

const STAFF_ROLES = ["admin", "administrativo", "docente"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createQuiz(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !ctx.targetId || !STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear cuestionarios." };
  }

  const title = str(formData, "title");
  if (!title) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      school_id: ctx.schoolId,
      title,
      description: str(formData, "description"),
      created_by: ctx.targetId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear el cuestionario." };

  revalidatePath("/cuestionarios");
  redirect(`/cuestionarios/${data.id}`);
}

export async function updateQuiz(
  quizId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar cuestionarios." };
  }

  const title = str(formData, "title");
  if (!title) return { error: "El título es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ title, description: str(formData, "description") })
    .eq("id", quizId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo guardar el cuestionario." };

  revalidatePath("/cuestionarios");
  revalidatePath(`/cuestionarios/${quizId}`);
  return undefined;
}

export async function deleteQuiz(
  quizId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar cuestionarios." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo eliminar el cuestionario." };

  revalidatePath("/cuestionarios");
  return undefined;
}

export type { Quiz };
