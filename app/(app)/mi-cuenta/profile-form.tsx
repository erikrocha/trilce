"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/database.types";
import { updateProfile, type FormState } from "./actions";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export function ProfileForm({ profile }: { profile: UserProfile | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateProfile,
    undefined
  );
  const [justSaved, setJustSaved] = useState(false);
  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    setJustSaved(!pending && !(state && "error" in state));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact_email">Correo de contacto</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={profile?.contact_email ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} />
      </div>
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {justSaved && <p className="text-sm text-brand-green-text">Guardado.</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
