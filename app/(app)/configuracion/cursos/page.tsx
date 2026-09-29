import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { CourseList } from "./course-list";

export default async function CursosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("name", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de materias del colegio
        </p>
      </div>
      <CourseList courses={courses ?? []} canWrite={canWrite} />
    </div>
  );
}
