import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformDashboard } from "./platform-dashboard";

export default async function PlataformaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("platform_staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!staffRow) redirect("/dashboard");

  const [
    { data: schools },
    { data: plans },
    { data: platformStaff },
    { data: auditLogs },
  ] = await Promise.all([
    supabase
      .from("schools")
      .select("*, subscriptions(id, status, plan_id, current_period_end, plans(name))")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("plans").select("*").order("created_at", { ascending: true }),
    supabase.from("platform_staff").select("*").order("created_at", { ascending: true }),
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const staffUserIds = (platformStaff ?? []).map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, contact_email, full_name")
    .in("id", staffUserIds.length > 0 ? staffUserIds : [""]);
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const platformStaffWithProfile = (platformStaff ?? []).map((s) => ({
    ...s,
    profile: profileByUserId.get(s.user_id) ?? null,
  }));

  return (
    <PlatformDashboard
      isSuperadmin={staffRow.role === "superadmin"}
      schools={schools ?? []}
      plans={plans ?? []}
      platformStaff={platformStaffWithProfile}
      auditLogs={auditLogs ?? []}
    />
  );
}
