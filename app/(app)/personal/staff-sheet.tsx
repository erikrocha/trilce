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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPE_LABELS, STAFF_TYPE_LABELS } from "@/lib/enum-labels";
import {
  createStaffMember,
  updateStaffMember,
  type FormState,
  type StaffMember,
} from "./actions";

export function StaffSheet({
  staffMember,
  open,
  onOpenChange,
  readOnly,
}: {
  staffMember: StaffMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <StaffSheetBody
            key={staffMember?.id ?? "new"}
            staffMember={staffMember}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function StaffSheetBody({
  staffMember,
  readOnly,
  onSaved,
}: {
  staffMember: StaffMember | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = staffMember
    ? updateStaffMember.bind(null, staffMember.id)
    : createStaffMember;
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

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {staffMember ? "Editar personal" : "Nuevo personal"}
        </SheetTitle>
        <SheetDescription>
          {staffMember ? staffMember.full_name : "Docente o administrativo."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="staff-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={staffMember?.full_name}
            disabled={readOnly}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de personal</Label>
          <Select
            name="staff_type"
            defaultValue={staffMember?.staff_type}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAFF_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de documento</Label>
            <Select
              name="document_type"
              defaultValue={staffMember?.document_type ?? "DNI"}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document_number">N° de documento</Label>
            <Input
              id="document_number"
              name="document_number"
              defaultValue={staffMember?.document_number ?? ""}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={staffMember?.phone ?? ""}
              disabled={readOnly}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hire_date">Fecha de ingreso</Label>
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              defaultValue={staffMember?.hire_date ?? ""}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={staffMember?.email ?? ""}
            disabled={readOnly}
          />
        </div>
        {staffMember && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              name="active"
              defaultChecked={staffMember.active}
              disabled={readOnly}
            />
          </div>
        )}

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </form>

      {!readOnly && (
        <SheetFooter>
          <Button type="submit" form="staff-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
