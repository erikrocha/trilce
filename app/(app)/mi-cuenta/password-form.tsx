"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updatePassword, type FormState } from "./actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updatePassword,
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
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm_password">Confirmar contraseña</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
        />
      </div>
      {state && "error" in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {justSaved && (
        <p className="text-sm text-brand-green-text">Contraseña actualizada.</p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
