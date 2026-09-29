import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { classGroupLabel } from "@/lib/class-group";
import { Presenter } from "./presenter";

export default async function PresentarPage(
  props: PageProps<"/cuestionarios/sesiones/[sessionId]/presentar">
) {
  const { sessionId } = await props.params;
  await requireAppContext();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("quiz_sessions")
    .select(
      "id, status, current_question_id, quiz_id, quizzes(title), course_offerings(class_group_id, courses(name), class_groups(academic_year, level, grade, section))"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, text, order_index, quiz_question_options(id, label, text, order_index)")
    .eq("quiz_id", session.quiz_id)
    .order("order_index", { ascending: true });

  const classGroupId = session.course_offerings?.class_group_id;
  const { count: totalStudents } = classGroupId
    ? await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("class_group_id", classGroupId)
    : { count: 0 };

  const sortedQuestions = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    order_index: q.order_index,
    options: [...q.quiz_question_options].sort(
      (a, b) => a.order_index - b.order_index
    ),
  }));

  const sectionLabel = session.course_offerings?.class_groups
    ? classGroupLabel(session.course_offerings.class_groups)
    : "—";

  return (
    <Presenter
      session={{
        id: session.id,
        status: session.status,
        current_question_id: session.current_question_id,
      }}
      questions={sortedQuestions}
      totalStudents={totalStudents ?? 0}
      quizTitle={session.quizzes?.title ?? ""}
      courseName={session.course_offerings?.courses?.name ?? ""}
      sectionLabel={sectionLabel}
    />
  );
}
