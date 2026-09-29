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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { createQuiz, deleteQuiz, updateQuiz, type FormState, type Quiz } from "./actions";

export function QuizSheet({
  quiz,
  open,
  onOpenChange,
}: {
  quiz: Quiz | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <QuizSheetBody
            key={quiz?.id ?? "new"}
            quiz={quiz}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function QuizSheetBody({
  quiz,
  onSaved,
}: {
  quiz: Quiz | null;
  onSaved: () => void;
}) {
  const action = quiz ? updateQuiz.bind(null, quiz.id) : createQuiz;
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
    } else if (submittedRef.current && !state?.error && quiz) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleDelete() {
    if (!quiz) return;
    startDelete(async () => {
      const result = await deleteQuiz(quiz.id);
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
        <SheetTitle>{quiz ? "Editar cuestionario" : "Nuevo cuestionario"}</SheetTitle>
        <SheetDescription>
          {quiz
            ? "Cambia el título o la descripción."
            : "Al crearlo pasarás a agregar sus preguntas."}
        </SheetDescription>
      </SheetHeader>

      <form
        id="quiz-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" defaultValue={quiz?.title} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={quiz?.description ?? ""}
            rows={3}
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
        {quiz ? (
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
                <AlertDialogTitle>¿Eliminar este cuestionario?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminan también sus preguntas, sesiones y las respuestas
                  ya registradas. Esta acción no se puede deshacer.
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
        <Button type="submit" form="quiz-form" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </>
  );
}
