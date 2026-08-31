import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { GuardianDashboard } from "./guardian-dashboard";
import { StudentDashboard } from "./student-dashboard";

export default async function DashboardPage() {
  const ctx = await requireAppContext();

  if (ctx.role === "padre" && ctx.targetId) {
    return <GuardianDashboard guardianId={ctx.targetId} />;
  }

  if (ctx.role === "alumno" && ctx.targetId) {
    return <StudentDashboard studentId={ctx.targetId} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">
        Sesión iniciada como {user?.email}
        {ctx.role === "docente" && " — revisa tus alumnos en Alumnos."}
      </p>
    </div>
  );
}
