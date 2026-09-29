import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { ClassGroupList } from "./class-group-list";

export default async function SeccionesPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: classGroups } = await supabase
    .from("class_groups")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("academic_year", { ascending: false })
    .order("grade", { ascending: true })
    .order("section", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Secciones</h1>
        <p className="text-sm text-muted-foreground">
          Secciones reales por año lectivo, usadas en Horario
        </p>
      </div>
      <ClassGroupList classGroups={classGroups ?? []} canWrite={canWrite} />
    </div>
  );
}
