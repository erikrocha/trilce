"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | undefined;

const INVALID_CREDENTIALS = "Correo/usuario o contraseña incorrectos.";

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Completa ambos campos." };
  }

  const supabase = await createClient();

  let email = identifier;
  if (!identifier.includes("@")) {
    const { data: resolvedEmail } = await supabase.rpc("resolve_login_email", {
      p_username: identifier,
    });
    if (!resolvedEmail) {
      return { error: INVALID_CREDENTIALS };
    }
    email = resolvedEmail;
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: INVALID_CREDENTIALS };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: INVALID_CREDENTIALS };
  }

  const { data: staffRow } = await supabase
    .from("platform_staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (staffRow) {
    redirect("/dashboard");
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("active", true);

  if (!memberships || memberships.length === 0) {
    await supabase.auth.signOut();
    return {
      error: "Tu cuenta no tiene acceso a ningún colegio. Contacta al administrador.",
    };
  }

  if (memberships.length > 1) {
    redirect("/seleccionar-colegio");
  }

  const cookieStore = await cookies();
  cookieStore.set("active_school_id", memberships[0].school_id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}
