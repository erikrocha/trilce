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
import { createCourse, updateCourse, type Course, type FormState } from "./actions";

export function CourseSheet({
  course,
  open,
  onOpenChange,
  readOnly,
}: {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <CourseSheetBody
            key={course?.id ?? "new"}
            course={course}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CourseSheetBody({
  course,
  readOnly,
  onSaved,
}: {
  course: Course | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = course ? updateCourse.bind(null, course.id) : createCourse;
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
        <SheetTitle>{course ? "Editar curso" : "Nuevo curso"}</SheetTitle>
        <SheetDescription>
          {course ? course.name : "Materia del catálogo del colegio."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="course-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            name="name"
            defaultValue={course?.name}
            disabled={readOnly}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="short_code">Código corto</Label>
          <Input
            id="short_code"
            name="short_code"
            placeholder="Ej. MAT"
            defaultValue={course?.short_code ?? ""}
            disabled={readOnly}
          />
        </div>
        {course && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active">Activo</Label>
            <Switch
              id="active"
              name="active"
              defaultChecked={course.active}
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
          <Button type="submit" form="course-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
