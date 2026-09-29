"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = ["admin", "administrativo", "docente"];

export type ActionResult = { error: string } | undefined;

export async function startSession(sessionId: string): Promise<ActionResult> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para iniciar la sesión." };
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("quiz_sessions")
    .select("quiz_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return { error: "Sesión no encontrada." };

  const { data: firstQuestion } = await supabase
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", session.quiz_id)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("quiz_sessions")
    .update({
      status: "activo",
      opened_at: new Date().toISOString(),
      current_question_id: firstQuestion?.id ?? null,
    })
    .eq("id", sessionId);

  if (error) return { error: "No se pudo iniciar la sesión." };

  revalidatePath(`/cuestionarios/sesiones/${sessionId}`);
  return undefined;
}

export async function goToQuestion(
  sessionId: string,
  questionId: string
): Promise<ActionResult> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para cambiar de pregunta." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ current_question_id: questionId })
    .eq("id", sessionId);

  if (error) return { error: "No se pudo cambiar de pregunta." };

  revalidatePath(`/cuestionarios/sesiones/${sessionId}`);
  return undefined;
}

export async function closeSession(sessionId: string): Promise<ActionResult> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para cerrar la sesión." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .update({
      status: "cerrado",
      closed_at: new Date().toISOString(),
      current_question_id: null,
    })
    .eq("id", sessionId);

  if (error) return { error: "No se pudo cerrar la sesión." };

  revalidatePath(`/cuestionarios/sesiones/${sessionId}`);
  return undefined;
}

export async function getAnsweredCount(
  sessionId: string,
  questionId: string
): Promise<number> {
  await requireAppContext();
  const supabase = await createClient();
  const { count } = await supabase
    .from("quiz_responses")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  return count ?? 0;
}

export async function reopenSession(sessionId: string): Promise<ActionResult> {
  const ctx = await requireAppContext();
  if (!STAFF_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para reabrir la sesión." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("quiz_sessions")
    .update({ status: "activo", closed_at: null })
    .eq("id", sessionId);

  if (error) return { error: "No se pudo reabrir la sesión." };

  revalidatePath(`/cuestionarios/sesiones/${sessionId}`);
  return undefined;
}
