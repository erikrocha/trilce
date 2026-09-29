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
  createScheduleActivity,
  updateScheduleActivity,
  type FormState,
  type ScheduleActivity,
} from "./actions";

export function ScheduleActivitySheet({
  activity,
  open,
  onOpenChange,
  readOnly,
}: {
  activity: ScheduleActivity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <ScheduleActivitySheetBody
            key={activity?.id ?? "new"}
            activity={activity}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScheduleActivitySheetBody({
  activity,
  readOnly,
  onSaved,
}: {
  activity: ScheduleActivity | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = activity
    ? updateScheduleActivity.bind(null, activity.id)
    : createScheduleActivity;
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
          {activity ? "Editar actividad" : "Nueva actividad"}
        </SheetTitle>
        <SheetDescription>
          {activity
            ? activity.name
            : "Ej. Hora de formación, Plan lector, Reunión de docentes."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="schedule-activity-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={activity?.name}
            disabled={readOnly}
            required
          />
        </div>
        {activity && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              name="active"
              defaultChecked={activity.active}
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
          <Button type="submit" form="schedule-activity-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
