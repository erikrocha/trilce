"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Database } from "@/lib/supabase/database.types";
import {
  deleteStudent,
  getStudentBillingSummary,
  type StudentBillingSummary,
} from "./actions";

type Student = Database["public"]["Tables"]["students"]["Row"];

export function DeleteStudentDialog({
  student,
  canForceDelete,
  onDeleted,
}: {
  student: Student;
  canForceDelete: boolean;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<StudentBillingSummary | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setSummary(null);
    setConfirmCode("");
    setError(null);
    startLoading(async () => {
      const result = await getStudentBillingSummary(student.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSummary(result);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteStudent(student.id, confirmCode);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onDeleted();
    });
  }

  const hasBilling =
    summary !== null && (summary.invoices > 0 || summary.payments > 0);
  const blocked = hasBilling && !canForceDelete;
  const canSubmit =
    summary !== null &&
    !blocked &&
    !isDeleting &&
    (!hasBilling || confirmCode.trim() === student.code);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" />}
      >
        <TrashIcon />
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar alumno?</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoading || summary === null
              ? "Revisando cobros y pagos del alumno…"
              : !hasBilling
                ? "Se eliminará el alumno junto con sus vínculos a apoderados y su acceso al sistema. Esta acción no se puede deshacer."
                : blocked
                  ? `Este alumno tiene ${summary.invoices} cobro(s) y ${summary.payments} pago(s) registrados. Solo un administrador puede eliminarlo. Si dejó el colegio, márcalo como Retirado.`
                  : `Este alumno tiene ${summary.invoices} cobro(s) y ${summary.payments} pago(s) registrados. Se eliminarán también, junto con los comprobantes emitidos. Úsalo solo para datos de prueba o cargados por error. Si el alumno dejó el colegio, márcalo como Retirado.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasBilling && !blocked && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-code">
              Escribe el código del alumno (
              <span className="font-mono">{student.code}</span>) para confirmar
            </Label>
            <Input
              id="confirm-code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {!blocked && (
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={!canSubmit}
            >
              {isDeleting
                ? "Eliminando…"
                : hasBilling
                  ? "Eliminar todo"
                  : "Eliminar"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
