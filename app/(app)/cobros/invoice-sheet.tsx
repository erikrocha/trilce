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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { DISCOUNT_REASON_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import { updateInvoice, type FormState } from "./actions";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  students: {
    code: string;
    paternal_surname: string;
    maternal_surname: string | null;
    first_names: string;
  } | null;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function InvoiceSheet({
  invoice,
  open,
  onOpenChange,
  readOnly,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && invoice && (
          <InvoiceSheetBody
            key={invoice.id}
            invoice={invoice}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function InvoiceSheetBody({
  invoice,
  readOnly,
  onSaved,
}: {
  invoice: Invoice;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = updateInvoice.bind(null, invoice.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const student = invoice.students;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{invoice.description}</SheetTitle>
        <SheetDescription>
          {student
            ? `${student.paternal_surname} ${student.maternal_surname ?? ""}, ${student.first_names}`
            : "Alumno no encontrado"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-border p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Monto</p>
            <p className="font-mono">
              {currencyFormatter.format(invoice.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="font-mono">
              {currencyFormatter.format(invoice.paid_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-mono">
              {currencyFormatter.format(invoice.balance ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vence</p>
            <p>{new Date(invoice.due_date).toLocaleDateString("es-PE")}</p>
          </div>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          El monto pagado y el estado los calcula el sistema automáticamente
          a partir de los pagos registrados — no se editan aquí.
        </p>

        <form
          id="invoice-form"
          action={formAction}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount_amount">Descuento</Label>
              <Input
                id="discount_amount"
                name="discount_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={invoice.discount_amount}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Motivo del descuento</Label>
              <Select
                name="discount_reason"
                defaultValue={invoice.discount_reason ?? undefined}
                disabled={readOnly}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISCOUNT_REASON_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mora_amount">Mora</Label>
              <Input
                id="mora_amount"
                name="mora_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={invoice.mora_amount}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prorroga_date">Prórroga hasta</Label>
              <Input
                id="prorroga_date"
                name="prorroga_date"
                type="date"
                defaultValue={invoice.prorroga_date ?? ""}
                disabled={readOnly}
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>
      </div>

      {!readOnly && (
        <SheetFooter>
          <Button type="submit" form="invoice-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
