"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  createPaymentOrigin,
  updatePaymentOrigin,
  type FormState,
  type PaymentOrigin,
} from "./actions";

export function PaymentOriginSheet({
  origin,
  open,
  onOpenChange,
  readOnly,
}: {
  origin: PaymentOrigin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <PaymentOriginSheetBody
            key={origin?.id ?? "new"}
            origin={origin}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PaymentOriginSheetBody({
  origin,
  readOnly,
  onSaved,
}: {
  origin: PaymentOrigin | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = origin
    ? updatePaymentOrigin.bind(null, origin.id)
    : createPaymentOrigin;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !(state && "error" in state)) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {origin ? "Editar origen de pago" : "Nuevo origen de pago"}
        </SheetTitle>
        <SheetDescription>
          {origin ? origin.name : "Efectivo, Yape, transferencia, etc."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="payment-origin-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={origin?.name}
            disabled={readOnly}
            required
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="requires_reference">Requiere N° de referencia</Label>
          <Switch
            id="requires_reference"
            name="requires_reference"
            defaultChecked={origin?.requires_reference}
            disabled={readOnly}
          />
        </div>
        {origin && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              name="active"
              defaultChecked={origin.active}
              disabled={readOnly}
            />
          </div>
        )}

        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </form>

      {!readOnly && (
        <SheetFooter>
          <Button type="submit" form="payment-origin-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
