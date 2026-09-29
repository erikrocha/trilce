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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { WEEKDAY_LABELS } from "@/lib/enum-labels";
import { classGroupLabel } from "@/lib/class-group";
import { formatTimeRange } from "@/lib/time";
import {
  createScheduleSlot,
  deleteScheduleSlot,
  updateScheduleSlot,
  type FormState,
} from "./actions";
import type { ActivityOption, OfferingOption, SchedulePeriod, ScheduleSlotRow } from "./types";

export function ScheduleSlotSheet({
  open,
  slot,
  period,
  day,
  offerings,
  activities,
  onOpenChange,
}: {
  open: boolean;
  slot: ScheduleSlotRow | null;
  period: SchedulePeriod | null;
  day: number;
  offerings: OfferingOption[];
  activities: ActivityOption[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && period && (
          <ScheduleSlotSheetBody
            key={slot?.id ?? "new"}
            slot={slot}
            period={period}
            day={day}
            offerings={offerings}
            activities={activities}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScheduleSlotSheetBody({
  slot,
  period,
  day,
  offerings,
  activities,
  onSaved,
}: {
  slot: ScheduleSlotRow | null;
  period: SchedulePeriod;
  day: number;
  offerings: OfferingOption[];
  activities: ActivityOption[];
  onSaved: () => void;
}) {
  const action = slot
    ? updateScheduleSlot.bind(null, slot.id)
    : createScheduleSlot;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const [contentType, setContentType] = useState<"course" | "activity">(
    slot?.activity_id ? "activity" : "course"
  );
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
    if (!slot) return;
    startDelete(async () => {
      const result = await deleteScheduleSlot(slot.id);
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
          {slot ? "Editar bloque de horario" : "Nuevo bloque de horario"}
        </SheetTitle>
        <SheetDescription>
          {WEEKDAY_LABELS[day]} · {formatTimeRange(period.start_time, period.end_time)}
        </SheetDescription>
      </SheetHeader>

      <form
        id="schedule-slot-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <input type="hidden" name="period_id" value={period.id} />
        <input type="hidden" name="day_of_week" value={day} />

        <div className="flex flex-col gap-1.5">
          <Label>Tipo de bloque</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={contentType === "course" ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType("course")}
            >
              Curso
            </Button>
            <Button
              type="button"
              variant={contentType === "activity" ? "default" : "outline"}
              size="sm"
              onClick={() => setContentType("activity")}
            >
              Actividad
            </Button>
          </div>
          <input type="hidden" name="content_type" value={contentType} />
        </div>

        {contentType === "course" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Curso</Label>
            <Select
              name="course_offering_id"
              defaultValue={slot?.course_offering_id ?? undefined}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {offerings.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Todavía no hay cursos asignados a ninguna sección.
                  </div>
                )}
                {offerings.map((offering) => (
                  <SelectItem key={offering.id} value={offering.id}>
                    {offering.class_groups ? classGroupLabel(offering.class_groups) : "—"} —{" "}
                    {offering.courses?.name ?? "—"} —{" "}
                    {offering.staff_members?.full_name ?? "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label>Actividad</Label>
            <Select
              name="activity_id"
              defaultValue={slot?.activity_id ?? undefined}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {activities.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay actividades configuradas.
                  </div>
                )}
                {activities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="classroom">Aula</Label>
          <Input
            id="classroom"
            name="classroom"
            defaultValue={slot?.classroom ?? ""}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}
      </form>

      <SheetFooter className="flex-row justify-between">
        {slot ? (
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
                <AlertDialogTitle>¿Eliminar este bloque?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
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
        <Button type="submit" form="schedule-slot-form" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </>
  );
}
