"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type MembershipRole = Database["public"]["Enums"]["membership_role"];

const CAN_WRITE_ROLES = ["admin", "administrativo"];
const STAFF_ROLES: MembershipRole[] = ["admin", "administrativo", "docente"];

export async function createMember(input: {
  role: MembershipRole;
  targetId: string;
  email: string;
  username: string;
  password: string;
  fullName: string;
}): Promise<{ error: string } | { userId: string }> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear miembros." };
  }

  if (input.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (!input.username.trim() || !input.email.trim()) {
    return { error: "Usuario y correo son obligatorios." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_membership_login", {
    p_school_id: ctx.schoolId,
    p_role: input.role,
    p_target_id: input.targetId,
    p_email: input.email.trim(),
    p_username: input.username.trim(),
    p_password: input.password,
    p_full_name: input.fullName,
  });

  if (error) {
    return { error: error.message || "No se pudo crear el acceso." };
  }

  revalidatePath("/miembros");
  return { userId: data as string };
}

export async function updateMembershipRole(
  membershipId: string,
  role: MembershipRole
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar miembros." };
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("role, staff_id, student_id, guardian_id")
    .eq("id", membershipId)
    .eq("school_id", ctx.schoolId)
    .maybeSingle();

  if (!membership) return { error: "Miembro no encontrado." };

  // Un rol solo puede cambiar dentro de su misma "familia" de destino
  // (chk_membership_target): admin/administrativo/docente comparten staff_id,
  // padre usa guardian_id, alumno usa student_id — no se puede saltar de familia.
  const isStaffRole = STAFF_ROLES.includes(membership.role);
  if (isStaffRole !== STAFF_ROLES.includes(role)) {
    return { error: "No se puede cambiar a un rol de otra naturaleza." };
  }

  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", membershipId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo cambiar el rol." };

  revalidatePath("/miembros");
  return undefined;
}

export async function toggleMembershipActive(
  membershipId: string,
  active: boolean
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar miembros." };
  }

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("is_owner")
    .eq("id", membershipId)
    .eq("school_id", ctx.schoolId)
    .maybeSingle();

  if (!membership) return { error: "Miembro no encontrado." };
  if (membership.is_owner && !active) {
    return {
      error: "El dueño del colegio no se puede desactivar — transfiere la titularidad primero.",
    };
  }

  const { error } = await supabase
    .from("memberships")
    .update({ active })
    .eq("id", membershipId)
    .eq("school_id", ctx.schoolId);

  if (error) return { error: "No se pudo actualizar el miembro." };

  revalidatePath("/miembros");
  return undefined;
}

export async function transferOwnership(
  newOwnerMembershipId: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  // Transferir la titularidad es más sensible: solo el owner actual (no
  // cualquier admin) puede cederla.
  if (!ctx.schoolId || !ctx.isOwner) {
    return { error: "Solo el dueño actual puede transferir la titularidad." };
  }

  const supabase = await createClient();
  const { data: newOwner } = await supabase
    .from("memberships")
    .select("id, role, active")
    .eq("id", newOwnerMembershipId)
    .eq("school_id", ctx.schoolId)
    .maybeSingle();

  if (!newOwner || newOwner.role !== "admin" || !newOwner.active) {
    return { error: "El nuevo dueño debe ser un admin activo del colegio." };
  }

  const { error: clearError } = await supabase
    .from("memberships")
    .update({ is_owner: false })
    .eq("school_id", ctx.schoolId)
    .eq("is_owner", true);
  if (clearError) return { error: "No se pudo transferir la titularidad." };

  const { error: setError } = await supabase
    .from("memberships")
    .update({ is_owner: true })
    .eq("id", newOwnerMembershipId);
  if (setError) return { error: "No se pudo transferir la titularidad." };

  revalidatePath("/miembros");
  return undefined;
}
