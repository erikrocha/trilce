import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { QuizList } from "./quiz-list";

export default async function CuestionariosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*, staff_members(full_name)")
    .order("created_at", { ascending: false });

  const canWrite = ["admin", "administrativo", "docente"].includes(
    ctx.role ?? ""
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Cuestionarios</h1>
        <p className="text-sm text-muted-foreground">
          Banco de preguntas reutilizable — aplícalo a una sección desde una
          sesión.
        </p>
      </div>
      <QuizList quizzes={quizzes ?? []} canWrite={canWrite} />
    </div>
  );
}
