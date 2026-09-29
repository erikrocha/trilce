"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string } | undefined;

export async function updateProfile(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión inválida." };

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  const { error } = await supabase
    .from("user_profiles")
    .update({ full_name: fullName, contact_email: contactEmail, phone })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar tu perfil." };

  revalidatePath("/mi-cuenta");
  return undefined;
}

export async function updatePassword(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.updateUser({ password });
  if (error || !user) return { error: "No se pudo cambiar la contraseña." };

  // La contraseña temporal impresa deja de ser válida: se retira de la lista.
  await supabase.from("initial_credentials").delete().eq("user_id", user.id);

  return undefined;
}

export async function revokeTrustedDevice(
  deviceId: string
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión inválida." };

  const { error } = await supabase
    .from("trusted_devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("user_id", user.id);

  if (error) return { error: "No se pudo revocar el dispositivo." };

  revalidatePath("/mi-cuenta");
  return undefined;
}
