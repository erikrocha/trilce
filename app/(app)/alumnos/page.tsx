import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { StudentList } from "./student-list";

export default async function AlumnosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("paternal_surname", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";
  // Borrar un alumno con cobros/pagos arrastra documentos tributarios: solo admin.
  const canForceDelete = ctx.role === "admin";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Alumnos</h1>
          <p className="text-sm text-muted-foreground">
            {(students ?? []).filter((s) => s.status !== "inactivo").length}{" "}
            alumno(s) registrados
          </p>
        </div>
      </div>
      <StudentList students={students ?? []} canWrite={canWrite}
        canForceDelete={canForceDelete}
      />
    </div>
  );
}
