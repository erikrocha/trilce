"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type SchoolStatus = Database["public"]["Enums"]["school_status"];
type SchoolType = Database["public"]["Enums"]["school_type"];
type PricingModel = Database["public"]["Enums"]["pricing_model"];
type PlatformStaffRole = Database["public"]["Enums"]["platform_staff_role"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export type FormState = { error: string } | undefined;

async function requirePlatformStaff() {
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
  return { supabase, userId: user.id, role: staffRow.role };
}

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

// ---------------------------------------------------------------------------
// Colegios
// ---------------------------------------------------------------------------

export async function createSchool(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requirePlatformStaff();

  const name = str(formData, "name");
  const planId = str(formData, "plan_id");
  if (!name || !planId) {
    return { error: "Nombre y plan son obligatorios." };
  }

  const { data: school, error } = await supabase
    .from("schools")
    .insert({
      name,
      slug: str(formData, "slug"),
      school_type: (str(formData, "school_type") ?? "privado") as SchoolType,
    })
    .select("id")
    .single();

  if (error || !school) return { error: "No se pudo crear el colegio." };

  const { error: subError } = await supabase.from("subscriptions").insert({
    school_id: school.id,
    plan_id: planId,
    status: "trialing",
  });
  if (subError) return { error: "Colegio creado, pero falló la suscripción." };

  const { error: catalogError } = await supabase.rpc(
    "seed_default_school_catalog",
    { p_school_id: school.id }
  );
  if (catalogError) {
    return { error: "Colegio creado, pero falló el catálogo por defecto." };
  }

  revalidatePath("/plataforma");
  return undefined;
}

export async function updateSchoolStatus(
  schoolId: string,
  status: SchoolStatus,
  suspendedReason: string | null
): Promise<{ error: string } | undefined> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("schools")
    .update({
      status,
      suspended_at: status === "suspended" ? new Date().toISOString() : null,
      suspended_reason: status === "suspended" ? suspendedReason : null,
    })
    .eq("id", schoolId);

  if (error) return { error: "No se pudo actualizar el colegio." };
  revalidatePath("/plataforma");
  return undefined;
}

export async function softDeleteSchool(
  schoolId: string
): Promise<{ error: string } | undefined> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("schools")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", schoolId);

  if (error) return { error: "No se pudo eliminar el colegio." };
  revalidatePath("/plataforma");
  return undefined;
}

export async function updateSubscription(
  subscriptionId: string,
  planId: string,
  status: SubscriptionStatus
): Promise<{ error: string } | undefined> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("subscriptions")
    .update({ plan_id: planId, status })
    .eq("id", subscriptionId);

  if (error) return { error: "No se pudo actualizar la suscripción." };
  revalidatePath("/plataforma");
  return undefined;
}

export async function markBillingInvoicePaid(
  billingInvoiceId: string
): Promise<{ error: string } | undefined> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("billing_invoices")
    .update({ status: "pagado", paid_at: new Date().toISOString() })
    .eq("id", billingInvoiceId);

  if (error) return { error: "No se pudo marcar como pagado." };
  revalidatePath("/plataforma");
  return undefined;
}

// ---------------------------------------------------------------------------
// Planes
// ---------------------------------------------------------------------------

export async function createPlan(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requirePlatformStaff();

  const code = str(formData, "code");
  const name = str(formData, "name");
  const pricingModel = str(formData, "pricing_model") as PricingModel | null;
  if (!code || !name || !pricingModel) {
    return { error: "Código, nombre y modelo de precio son obligatorios." };
  }

  const { error } = await supabase.from("plans").insert({
    code,
    name,
    pricing_model: pricingModel,
    price_per_student: formData.get("price_per_student")
      ? Number(formData.get("price_per_student"))
      : null,
    fixed_price: formData.get("fixed_price")
      ? Number(formData.get("fixed_price"))
      : null,
    max_students: formData.get("max_students")
      ? Number(formData.get("max_students"))
      : null,
    trial_days: formData.get("trial_days")
      ? Number(formData.get("trial_days"))
      : null,
  });

  if (error) {
    return {
      error:
        error.code === "23505" ? "Ya existe un plan con ese código." : "No se pudo crear el plan.",
    };
  }

  revalidatePath("/plataforma");
  return undefined;
}

export async function updatePlan(
  planId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("plans")
    .update({
      name: str(formData, "name") ?? undefined,
      price_per_student: formData.get("price_per_student")
        ? Number(formData.get("price_per_student"))
        : null,
      fixed_price: formData.get("fixed_price")
        ? Number(formData.get("fixed_price"))
        : null,
      max_students: formData.get("max_students")
        ? Number(formData.get("max_students"))
        : null,
      trial_days: formData.get("trial_days")
        ? Number(formData.get("trial_days"))
        : null,
      active: formData.get("active") === "on",
    })
    .eq("id", planId);

  if (error) return { error: "No se pudo guardar el plan." };
  revalidatePath("/plataforma");
  return undefined;
}

// ---------------------------------------------------------------------------
// Equipo (platform_staff)
// ---------------------------------------------------------------------------

export async function createPlatformStaffMember(input: {
  role: PlatformStaffRole;
  email: string;
  username: string;
  password: string;
  fullName: string;
}): Promise<{ error: string } | { userId: string }> {
  const { supabase } = await requirePlatformStaff();

  if (input.password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const { data, error } = await supabase.rpc("create_platform_staff_login", {
    p_role: input.role,
    p_email: input.email.trim(),
    p_username: input.username.trim(),
    p_password: input.password,
    p_full_name: input.fullName,
  });

  if (error) return { error: error.message || "No se pudo crear el acceso." };

  revalidatePath("/plataforma");
  return { userId: data as string };
}

export async function togglePlatformStaffActive(
  staffId: string,
  active: boolean
): Promise<{ error: string } | undefined> {
  const { supabase } = await requirePlatformStaff();

  const { error } = await supabase
    .from("platform_staff")
    .update({ active })
    .eq("id", staffId);

  if (error) return { error: "No se pudo actualizar." };
  revalidatePath("/plataforma");
  return undefined;
}
