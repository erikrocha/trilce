"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function selectSchool(schoolId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("active", true)
    .maybeSingle();

  if (!membership) {
    redirect("/seleccionar-colegio");
  }

  const cookieStore = await cookies();
  cookieStore.set("active_school_id", schoolId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}
