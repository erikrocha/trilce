import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { QuestionList } from "./question-list";
import { SessionList } from "./session-list";
import type { OfferingOption, QuestionWithOptions, SessionRow } from "./types";

export default async function QuizDetailPage(
  props: PageProps<"/cuestionarios/[quizId]">
) {
  const { quizId } = await props.params;
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz) notFound();

  const canWrite = ["admin", "administrativo", "docente"].includes(
    ctx.role ?? ""
  );

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, text, order_index, quiz_question_options(*)")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });

  const { data: sessions } = await supabase
    .from("quiz_sessions")
    .select(
      "id, status, course_offering_id, course_offerings(courses(name), class_groups(academic_year, level, grade, section), staff_members(full_name))"
    )
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });

  let offerings: OfferingOption[] = [];
  if (canWrite) {
    const { data: offeringsData } = await supabase
      .from("course_offerings")
      .select(
        "id, class_group_id, courses(name), class_groups(academic_year, level, grade, section), staff_members(full_name)"
      );
    offerings = offeringsData ?? [];
  }

  const sortedQuestions = (questions ?? []).map((q) => ({
    ...q,
    quiz_question_options: [...q.quiz_question_options].sort(
      (a, b) => a.order_index - b.order_index
    ),
  })) as QuestionWithOptions[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-sm text-muted-foreground">{quiz.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase">
          Preguntas
        </h2>
        <QuestionList
          quizId={quizId}
          questions={sortedQuestions}
          canWrite={canWrite}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase">
          Sesiones
        </h2>
        <SessionList
          quizId={quizId}
          sessions={(sessions ?? []) as SessionRow[]}
          offerings={offerings}
          canWrite={canWrite}
          hasQuestions={sortedQuestions.length > 0}
        />
      </div>
    </div>
  );
}
