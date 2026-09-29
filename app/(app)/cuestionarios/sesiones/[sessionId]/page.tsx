import Link from "next/link";
import { notFound } from "next/navigation";
import { MonitorPlayIcon, PrinterIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { classGroupLabel } from "@/lib/class-group";
import { ControlPanel } from "./control-panel";
import { ResultsTable } from "./results-table";

export default async function SessionPage(
  props: PageProps<"/cuestionarios/sesiones/[sessionId]">
) {
  const { sessionId } = await props.params;
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("quiz_sessions")
    .select(
      "*, quizzes(id, title), course_offerings(class_group_id, courses(name), class_groups(academic_year, level, grade, section), staff_members(full_name))"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const canControl = ["admin", "administrativo", "docente"].includes(
    ctx.role ?? ""
  );

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, text, order_index")
    .eq("quiz_id", session.quiz_id)
    .order("order_index", { ascending: true });

  const classGroupId = session.course_offerings?.class_group_id;

  const { data: students } = classGroupId
    ? await supabase
        .from("students")
        .select("id, first_names, paternal_surname, code")
        .eq("class_group_id", classGroupId)
        .neq("status", "inactivo")
        .order("paternal_surname", { ascending: true })
    : { data: [] };

  const { data: responses } = await supabase
    .from("quiz_responses")
    .select("student_id, question_id, quiz_question_options(is_correct)")
    .eq("session_id", sessionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">{session.quizzes?.title}</h1>
          <p className="text-sm text-muted-foreground">
            {session.course_offerings?.class_groups
              ? classGroupLabel(session.course_offerings.class_groups)
              : "—"}{" "}
            — {session.course_offerings?.courses?.name ?? "—"} —{" "}
            {session.course_offerings?.staff_members?.full_name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canControl && (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/cuestionarios/sesiones/${sessionId}/presentar`} />}
            >
              <MonitorPlayIcon />
              Presentar
            </Button>
          )}
          {classGroupId && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/cuestionarios/tarjetas?classGroupId=${classGroupId}`} />}
            >
              <PrinterIcon />
              Tarjetas QR
            </Button>
          )}
        </div>
      </div>

      {canControl && (
        <ControlPanel
          session={session}
          questions={questions ?? []}
          totalStudents={(students ?? []).length}
          answeredCurrentQuestion={
            (responses ?? []).filter(
              (r) => r.question_id === session.current_question_id
            ).length
          }
        />
      )}

      <ResultsTable
        students={students ?? []}
        questions={questions ?? []}
        responses={responses ?? []}
      />
    </div>
  );
}
