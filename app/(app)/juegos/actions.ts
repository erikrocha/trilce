"use server";

import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { checkAnswer, correctAnswerString, nextScore } from "@/lib/games/check";
import { getSkill } from "@/lib/games/catalog";
import { makeRng } from "@/lib/games/rng";
import type { Json } from "@/lib/supabase/database.types";

export type RecordResult =
  | { ok: true; sessionId: string; isCorrect: boolean; score: number }
  | { ok: false; error: string };

const STAFF_ROLES = ["admin", "administrativo", "docente"];

// Guarda la respuesta a nombre de un alumno: el propio alumno (modo sala de
// cómputo) o, en modo un-solo-dispositivo, el docente/admin que eligió a qué
// alumno le toca jugar. La pregunta se regenera desde el seed para que la
// respuesta se verifique aquí y no se confíe en el navegador.
export async function recordAttempt(input: {
  sessionId: string | null;
  skillId: string;
  seed: number;
  answer: string;
  studentId?: string;
}): Promise<RecordResult> {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  let studentId: string;
  let schoolId: string;
  let recordedBy: string | null = null;
  if (ctx.role === "alumno" && ctx.targetId && ctx.schoolId) {
    studentId = ctx.targetId;
    schoolId = ctx.schoolId;
  } else if (STAFF_ROLES.includes(ctx.role ?? "") && ctx.targetId && input.studentId) {
    // RLS de students limita qué alumnos ve cada docente; can_play_for_student
    // (82) vuelve a exigirlo al insertar.
    const { data: student } = await supabase
      .from("students")
      .select("id, school_id")
      .eq("id", input.studentId)
      .maybeSingle();
    if (!student || student.school_id !== ctx.schoolId) {
      return { ok: false, error: "Alumno no disponible." };
    }
    studentId = student.id;
    schoolId = student.school_id;
    recordedBy = ctx.targetId;
  } else {
    return { ok: false, error: "No se pueden guardar resultados." };
  }
  const skill = getSkill(input.skillId);
  if (!skill || !Number.isInteger(input.seed) || input.seed < 0) {
    return { ok: false, error: "Juego no válido." };
  }

  const question = skill.generate(makeRng(input.seed));
  const isCorrect = checkAnswer(question, input.answer);

  let session: { id: string; score: number; answered: number; correct_count: number; mastered_at: string | null } | null = null;
  if (input.sessionId) {
    const { data } = await supabase
      .from("game_sessions")
      .select("id, score, answered, correct_count, mastered_at")
      .eq("id", input.sessionId)
      .eq("student_id", studentId)
      .eq("skill_id", skill.id)
      .maybeSingle();
    session = data;
  }
  if (!session) {
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({ school_id: schoolId, student_id: studentId, skill_id: skill.id, recorded_by: recordedBy })
      .select("id, score, answered, correct_count, mastered_at")
      .single();
    if (error || !data) return { ok: false, error: "No se pudo guardar el resultado." };
    session = data;
  }

  const { error: attemptError } = await supabase.from("game_attempts").insert({
    session_id: session.id,
    school_id: schoolId,
    student_id: studentId,
    skill_id: skill.id,
    recorded_by: recordedBy,
    seed: input.seed,
    tag: question.tag ?? null,
    question: question as unknown as Json,
    given_answer: input.answer,
    correct_answer: correctAnswerString(question),
    is_correct: isCorrect,
  });
  if (attemptError) return { ok: false, error: "No se pudo guardar el resultado." };

  const score = nextScore(session.score, isCorrect);
  await supabase
    .from("game_sessions")
    .update({
      score,
      answered: session.answered + 1,
      correct_count: session.correct_count + (isCorrect ? 1 : 0),
      mastered_at: session.mastered_at ?? (score >= 100 ? new Date().toISOString() : null),
    })
    .eq("id", session.id);

  return { ok: true, sessionId: session.id, isCorrect, score };
}
