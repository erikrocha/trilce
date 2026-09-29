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
import { LEVEL_LABELS } from "@/lib/enum-labels";
import {
  createClassGroup,
  deleteClassGroup,
  updateClassGroup,
  type ClassGroup,
  type FormState,
} from "./actions";

export function ClassGroupSheet({
  classGroup,
  open,
  onOpenChange,
  readOnly,
}: {
  classGroup: ClassGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <ClassGroupSheetBody
            key={classGroup?.id ?? "new"}
            classGroup={classGroup}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ClassGroupSheetBody({
  classGroup,
  readOnly,
  onSaved,
}: {
  classGroup: ClassGroup | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = classGroup
    ? updateClassGroup.bind(null, classGroup.id)
    : createClassGroup;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
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
    if (!classGroup) return;
    startDelete(async () => {
      const result = await deleteClassGroup(classGroup.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      onSaved();
    });
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <SheetHeader>
        <SheetTitle>{classGroup ? "Editar sección" : "Nueva sección"}</SheetTitle>
        <SheetDescription>
          {classGroup
            ? `${classGroup.academic_year} — ${LEVEL_LABELS[classGroup.level]} ${classGroup.grade}${classGroup.section}`
            : "Sección real para un año lectivo."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="class-group-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="academic_year">Año lectivo</Label>
            <Input
              id="academic_year"
              name="academic_year"
              type="number"
              defaultValue={classGroup?.academic_year ?? currentYear}
              disabled={readOnly}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Nivel</Label>
            <Select
              name="level"
              defaultValue={classGroup?.level}
              disabled={readOnly}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade">Grado</Label>
            <Input
              id="grade"
              name="grade"
              defaultValue={classGroup?.grade}
              disabled={readOnly}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section">Sección</Label>
            <Input
              id="section"
              name="section"
              defaultValue={classGroup?.section}
              disabled={readOnly}
              required
            />
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}
      </form>

      {!readOnly && (
        <SheetFooter className="flex-row justify-between">
          {classGroup ? (
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
                  <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
                  <AlertDialogDescription>
                    También se eliminarán los cursos asignados y el horario
                    de esta sección. Los alumnos vinculados quedan sin
                    sección, no se eliminan. Esta acción no se puede deshacer.
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
          <Button type="submit" form="class-group-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
