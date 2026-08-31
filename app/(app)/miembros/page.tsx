import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { MemberList } from "./member-list";

export default async function MiembrosPage() {
  const ctx = await requireAppContext();
  if (ctx.role !== "admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Solo el admin del colegio puede gestionar miembros.
      </p>
    );
  }
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select(
      "*, students(code, paternal_surname, maternal_surname, first_names), guardians(paternal_surname, maternal_surname, first_names), staff_members(full_name, staff_type)"
    )
    .eq("school_id", ctx.schoolId!)
    .order("created_at", { ascending: true });

  const userIds = (memberships ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, username, contact_email")
    .in("id", userIds.length > 0 ? userIds : [""]);

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const membershipsWithProfile = (memberships ?? []).map((m) => ({
    ...m,
    profile: profileByUserId.get(m.user_id) ?? null,
  }));

  // Candidatos disponibles para crear un nuevo acceso: personas sin membership.
  const existingStaffIds = new Set(
    (memberships ?? []).map((m) => m.staff_id).filter(Boolean)
  );
  const existingGuardianIds = new Set(
    (memberships ?? []).map((m) => m.guardian_id).filter(Boolean)
  );
  const existingStudentIds = new Set(
    (memberships ?? []).map((m) => m.student_id).filter(Boolean)
  );

  const [{ data: staff }, { data: guardians }, { data: students }] =
    await Promise.all([
      supabase
        .from("staff_members")
        .select("id, full_name, staff_type, email")
        .eq("school_id", ctx.schoolId!)
        .eq("active", true),
      supabase
        .from("guardians")
        .select("id, paternal_surname, maternal_surname, first_names, email")
        .eq("school_id", ctx.schoolId!),
      supabase
        .from("students")
        .select("id, code, paternal_surname, maternal_surname, first_names, institutional_email")
        .eq("school_id", ctx.schoolId!),
    ]);

  const availableStaff = (staff ?? []).filter((s) => !existingStaffIds.has(s.id));
  const availableGuardians = (guardians ?? []).filter(
    (g) => !existingGuardianIds.has(g.id)
  );
  const availableStudents = (students ?? []).filter(
    (s) => !existingStudentIds.has(s.id)
  );

  const isOwner = ctx.isOwner;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Miembros del Colegio</h1>
        <p className="text-sm text-muted-foreground">
          Quién tiene acceso al sistema y con qué rol
        </p>
      </div>
      <MemberList
        memberships={membershipsWithProfile}
        availableStaff={availableStaff}
        availableGuardians={availableGuardians}
        availableStudents={availableStudents}
        isOwner={isOwner}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
