"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  createSchedulePeriod,
  deleteSchedulePeriod,
  updateSchedulePeriod,
  type FormState,
  type SchedulePeriod,
} from "./actions";

export function SchedulePeriodSheet({
  period,
  open,
  onOpenChange,
  readOnly,
}: {
  period: SchedulePeriod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <SchedulePeriodSheetBody
            key={period?.id ?? "new"}
            period={period}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SchedulePeriodSheetBody({
  period,
  readOnly,
  onSaved,
}: {
  period: SchedulePeriod | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = period
    ? updateSchedulePeriod.bind(null, period.id)
    : createSchedulePeriod;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const [isBreak, setIsBreak] = useState(period?.is_break ?? false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleDelete() {
    if (!period) return;
    startDelete(async () => {
      const result = await deleteSchedulePeriod(period.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {period ? "Editar franja horaria" : "Nueva franja horaria"}
        </SheetTitle>
        <SheetDescription>
          Se aplica igual de lunes a viernes.
        </SheetDescription>
      </SheetHeader>

      <form
        id="schedule-period-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start_time">Hora de inicio</Label>
            <Input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={period?.start_time.slice(0, 5)}
              disabled={readOnly}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="end_time">Hora de fin</Label>
            <Input
              id="end_time"
              name="end_time"
              type="time"
              defaultValue={period?.end_time.slice(0, 5)}
              disabled={readOnly}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="is_break">Es un recreo</Label>
          <Switch
            id="is_break"
            name="is_break"
            checked={isBreak}
            onCheckedChange={setIsBreak}
            disabled={readOnly}
          />
        </div>

        {isBreak && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">Nombre del recreo (opcional)</Label>
            <Input
              id="label"
              name="label"
              placeholder="Recreo"
              defaultValue={period?.label ?? ""}
              disabled={readOnly}
            />
          </div>
        )}

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}
      </form>

      {!readOnly && (
        <SheetFooter className="flex-row justify-between">
          {period ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="outline" disabled={isDeleting} />
                }
              >
                <TrashIcon />
                Eliminar
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar esta franja?</AlertDialogTitle>
                  <AlertDialogDescription>
                    También se elimina todo lo que esté ubicado en esta
                    franja horaria (cursos y actividades). Esta acción no se
                    puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <Button type="submit" form="schedule-period-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
