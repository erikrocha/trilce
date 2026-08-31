import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type MembershipRole = Database["public"]["Enums"]["membership_role"];

export type AppContext = {
  userId: string;
  email: string | null;
  /** user_profiles.full_name, o el username, o el email — lo primero disponible. */
  displayName: string;
  isPlatformStaff: boolean;
  schoolId: string | null;
  schoolName: string | null;
  role: MembershipRole | null;
  isOwner: boolean;
  /** student_id | guardian_id | staff_id de la membership, según `role`. */
  targetId: string | null;
};

/**
 * Resuelve quién es el usuario actual y en qué colegio está operando.
 * Redirige a /login o /seleccionar-colegio si falta contexto. Úsalo en
 * layouts/páginas del área autenticada en vez de repetir esta lógica.
 */
export async function requireAppContext(): Promise<AppContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const displayName =
    profile?.full_name || profile?.username || user.email || "Usuario";

  const { data: staffRow } = await supabase
    .from("platform_staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (staffRow) {
    return {
      userId: user.id,
      email: user.email ?? null,
      displayName,
      isPlatformStaff: true,
      schoolId: null,
      schoolName: null,
      role: null,
      isOwner: false,
      targetId: null,
    };
  }

  const cookieStore = await cookies();
  const schoolId = cookieStore.get("active_school_id")?.value;

  if (!schoolId) {
    redirect("/seleccionar-colegio");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, is_owner, student_id, guardian_id, staff_id, schools(name)")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("active", true)
    .maybeSingle();

  if (!membership) {
    redirect("/seleccionar-colegio");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    displayName,
    isPlatformStaff: false,
    schoolId,
    schoolName: membership.schools?.name ?? null,
    role: membership.role,
    isOwner: membership.is_owner,
    targetId:
      membership.student_id ?? membership.guardian_id ?? membership.staff_id,
  };
}
