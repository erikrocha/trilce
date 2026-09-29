import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { SchedulePeriodList } from "./schedule-period-list";

export default async function HorarioBasePage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("schedule_periods")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("start_time", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Horario Base</h1>
        <p className="text-sm text-muted-foreground">
          Franjas horarias del día, iguales de lunes a viernes — incluye los
          recreos
        </p>
      </div>
      <SchedulePeriodList periods={periods ?? []} canWrite={canWrite} />
    </div>
  );
}
