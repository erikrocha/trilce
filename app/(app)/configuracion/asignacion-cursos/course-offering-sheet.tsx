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
import {
  createCourseOffering,
  deleteCourseOffering,
  updateCourseOffering,
  type CourseOffering,
  type FormState,
} from "./actions";
import {
  classGroupLabel,
  type ClassGroupOption,
  type SimpleOption,
  type TeacherOption,
} from "./course-offering-list";
import type { Database } from "@/lib/supabase/database.types";

type EnrollmentLevel = Database["public"]["Enums"]["enrollment_level"];

type OfferingRow = CourseOffering & {
  courses: { name: string } | null;
  class_groups: {
    academic_year: number;
    level: EnrollmentLevel;
    grade: string;
    section: string;
  } | null;
  staff_members: { full_name: string } | null;
};

export function CourseOfferingSheet({
  offering,
  courses,
  classGroups,
  teachers,
  open,
  onOpenChange,
  readOnly,
}: {
  offering: OfferingRow | null;
  courses: SimpleOption[];
  classGroups: ClassGroupOption[];
  teachers: TeacherOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <CourseOfferingSheetBody
            key={offering?.id ?? "new"}
            offering={offering}
            courses={courses}
            classGroups={classGroups}
            teachers={teachers}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CourseOfferingSheetBody({
  offering,
  courses,
  classGroups,
  teachers,
  readOnly,
  onSaved,
}: {
  offering: OfferingRow | null;
  courses: SimpleOption[];
  classGroups: ClassGroupOption[];
  teachers: TeacherOption[];
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = offering
    ? updateCourseOffering.bind(null, offering.id)
    : createCourseOffering;
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
    if (!offering) return;
    startDelete(async () => {
      const result = await deleteCourseOffering(offering.id);
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
          {offering ? "Editar asignación" : "Nueva asignación"}
        </SheetTitle>
        <SheetDescription>
          {offering
            ? `${offering.courses?.name ?? ""} — ${offering.staff_members?.full_name ?? ""}`
            : "Qué docente dicta un curso a una sección."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="course-offering-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label>Curso</Label>
          <Select
            name="course_id"
            defaultValue={offering?.course_id}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sección</Label>
          <Select
            name="class_group_id"
            defaultValue={offering?.class_group_id}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {classGroups.map((cg) => (
                <SelectItem key={cg.id} value={cg.id}>
                  {classGroupLabel(cg)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Docente</Label>
          <Select
            name="teacher_id"
            defaultValue={offering?.teacher_id}
            disabled={readOnly}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {teachers.length === 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No hay personal docente activo todavía.
                </div>
              )}
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id}>
                  {teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          {offering ? (
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
                  <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
                  <AlertDialogDescription>
                    También se elimina el horario que dependa de esta
                    asignación. Esta acción no se puede deshacer.
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
          <Button type="submit" form="course-offering-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
