import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { StaffList } from "./staff-list";

export default async function PersonalPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("staff_members")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("full_name", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Personal</h1>
        <p className="text-sm text-muted-foreground">
          {staff?.length ?? 0} miembro(s) del personal
        </p>
      </div>
      <StaffList staff={staff ?? []} canWrite={canWrite} />
    </div>
  );
}
