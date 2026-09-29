import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { ScheduleActivityList } from "./schedule-activity-list";

export default async function ActividadesPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: activities } = await supabase
    .from("schedule_activities")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("name", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Actividades</h1>
        <p className="text-sm text-muted-foreground">
          Actividades no curriculares que se ubican en el Horario (hora de
          formación, plan lector, reuniones, etc.)
        </p>
      </div>
      <ScheduleActivityList activities={activities ?? []} canWrite={canWrite} />
    </div>
  );
}
