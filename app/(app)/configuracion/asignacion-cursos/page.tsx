import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { CourseOfferingList } from "./course-offering-list";

export default async function AsignacionCursosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const [{ data: offerings }, { data: courses }, { data: classGroups }, { data: teachers }] =
    await Promise.all([
      supabase
        .from("course_offerings")
        .select(
          "*, courses(name), class_groups(academic_year, level, grade, section), staff_members(full_name)"
        )
        .eq("school_id", ctx.schoolId!)
        .order("created_at", { ascending: false }),
      supabase
        .from("courses")
        .select("id, name")
        .eq("school_id", ctx.schoolId!)
        .eq("active", true)
        .order("name"),
      supabase
        .from("class_groups")
        .select("id, academic_year, level, grade, section")
        .eq("school_id", ctx.schoolId!)
        .order("academic_year", { ascending: false })
        .order("grade")
        .order("section"),
      supabase
        .from("staff_members")
        .select("id, full_name")
        .eq("school_id", ctx.schoolId!)
        .eq("staff_type", "docente")
        .eq("active", true)
        .order("full_name"),
    ]);

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Asignación de Cursos</h1>
        <p className="text-sm text-muted-foreground">
          Qué docente dicta cada curso, a qué sección
        </p>
      </div>
      <CourseOfferingList
        offerings={offerings ?? []}
        courses={courses ?? []}
        classGroups={classGroups ?? []}
        teachers={teachers ?? []}
        canWrite={canWrite}
      />
    </div>
  );
}
