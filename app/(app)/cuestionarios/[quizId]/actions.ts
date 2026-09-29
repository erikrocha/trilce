"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string } | undefined;

const STAFF_ROLES = ["admin", "administrativo", "docente"];

type OptionInput = {
  id?: string;
  label: string;
  text: string;
  is_correct: boolean;
};

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function parseOptions(formData: FormData): OptionInput[] | null {
  try {
    const raw = JSON.parse(String(formData.get("options_json") ?? "[]"));
    if (!Array.isArray(raw)) return null;
    return raw.map((o) => ({
      id: typeof o.id === "string" ? o.id : undefined,
      label: String(o.label ?? "").trim(),
      text: String(o.text ?? "").trim(),
      is_correct: Boolean(o.is_correct),
    }));
  } catch {
    return null;
  }
}

function validateOptions(options: OptionInput[] | null): string | null {
  if (!options || options.length < 2) {
    return "Agrega al menos 2 alternativas.";
  }
  if (options.some((o) => !o.text)) {
    return "Todas las alternativas necesitan texto.";
  }
  if (options.filter((o) => o.is_correct).length !== 1) {
    return "Marca exactamente una alternativa como correcta.";
  }
  return null;
}

export async function saveQuestion(
  quizId: string,
  questionId: string | null,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar preguntas." };
  }

  const text = str(formData, "text");
  if (!text) return { error: "El texto de la pregunta es obligatorio." };

  const options = parseOptions(formData);
  const optionsError = validateOptions(options);
  if (optionsError) return { error: optionsError };

  const supabase = await createClient();

  if (questionId) {
    const { error: updateError } = await supabase
      .from("quiz_questions")
      .update({ text })
      .eq("id", questionId);
    if (updateError) return { error: "No se pudo guardar la pregunta." };

    const { data: existing } = await supabase
      .from("quiz_question_options")
      .select("id")
      .eq("question_id", questionId);
    const keepIds = new Set(
      (options ?? []).filter((o) => o.id).map((o) => o.id)
    );
    const toDelete = (existing ?? [])
      .map((o) => o.id)
      .filter((id) => !keepIds.has(id));

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("quiz_question_options")
        .delete()
        .in("id", toDelete);
      if (deleteError) return { error: "No se pudo actualizar las alternativas." };
    }

    for (const [index, option] of (options ?? []).entries()) {
      if (option.id) {
        const { error: optError } = await supabase
          .from("quiz_question_options")
          .update({
            label: option.label,
            text: option.text,
            is_correct: option.is_correct,
            order_index: index,
          })
          .eq("id", option.id);
        if (optError) return { error: "No se pudo actualizar una alternativa." };
      } else {
        const { error: optError } = await supabase
          .from("quiz_question_options")
          .insert({
            question_id: questionId,
            label: option.label,
            text: option.text,
            is_correct: option.is_correct,
            order_index: index,
          });
        if (optError) return { error: "No se pudo agregar una alternativa." };
      }
    }
  } else {
    const { count } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId);

    const { data: newQuestion, error: insertError } = await supabase
      .from("quiz_questions")
      .insert({ quiz_id: quizId, text, order_index: count ?? 0 })
      .select("id")
      .single();
    if (insertError || !newQuestion) {
      return { error: "No se pudo crear la pregunta." };
    }

    const { error: optError } = await supabase
      .from("quiz_question_options")
      .insert(
        (options ?? []).map((option, index) => ({
          question_id: newQuestion.id,
          label: option.label,
          text: option.text,
          is_correct: option.is_correct,
          order_index: index,
        }))
      );
    if (optError) return { error: "No se pudieron crear las alternativas." };
  }

  revalidatePath(`/cuestionarios/${quizId}`);
  return undefined;
}

export async function deleteQuestion(
  quizId: string,
  questionId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar preguntas." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_questions")
    .delete()
    .eq("id", questionId);

  if (error) return { error: "No se pudo eliminar la pregunta." };

  revalidatePath(`/cuestionarios/${quizId}`);
  return undefined;
}

export async function createSession(
  quizId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear sesiones." };
  }

  const courseOfferingId = str(formData, "course_offering_id");
  if (!courseOfferingId) return { error: "Elige una sección." };

  const supabase = await createClient();
  const { error } = await supabase.from("quiz_sessions").insert({
    quiz_id: quizId,
    course_offering_id: courseOfferingId,
    status: "borrador",
  });

  if (error) return { error: "No se pudo crear la sesión." };

  revalidatePath(`/cuestionarios/${quizId}`);
  return undefined;
}

export async function deleteSession(
  quizId: string,
  sessionId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar sesiones." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { error: "No se pudo eliminar la sesión." };

  revalidatePath(`/cuestionarios/${quizId}`);
  return undefined;
}
