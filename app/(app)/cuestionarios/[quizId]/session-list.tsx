"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classGroupLabel } from "@/lib/class-group";
import { QUIZ_SESSION_STATUS_LABELS } from "@/lib/enum-labels";
import { createSession, deleteSession, type FormState } from "./actions";
import type { OfferingOption, QuizSessionStatus, SessionRow } from "./types";

const STATUS_CLASSES: Record<QuizSessionStatus, string> = {
  borrador: "bg-muted text-muted-foreground",
  activo: "bg-badge-pagado/15 text-badge-pagado",
  cerrado: "bg-muted text-badge-anulado",
};

function offeringLabel(offering: OfferingOption) {
  const section = offering.class_groups ? classGroupLabel(offering.class_groups) : "—";
  return `${section} — ${offering.courses?.name ?? "—"} — ${offering.staff_members?.full_name ?? "—"}`;
}

export function SessionList({
  quizId,
  sessions,
  offerings,
  canWrite,
  hasQuestions,
}: {
  quizId: string;
  sessions: SessionRow[];
  offerings: OfferingOption[];
  canWrite: boolean;
  hasQuestions: boolean;
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const action = createSession.bind(null, quizId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      setShowNew(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleDelete(sessionId: string) {
    setDeletingId(sessionId);
    startDelete(async () => {
      await deleteSession(quizId, sessionId);
      setDeletingId(null);
    });
  }

  return (
    <div className="rounded-2xl border border-border">
      {canWrite && (
        <div className="border-b border-border p-3">
          {showNew ? (
            <form action={formAction} className="flex items-center gap-2">
              <Select name="course_offering_id">
                <SelectTrigger className="w-96">
                  <SelectValue placeholder="Elige una sección" />
                </SelectTrigger>
                <SelectContent>
                  {offerings.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay cursos asignados a ninguna sección.
                    </div>
                  )}
                  {offerings.map((offering) => (
                    <SelectItem key={offering.id} value={offering.id}>
                      {offeringLabel(offering)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Creando…" : "Crear sesión"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNew(false)}
              >
                Cancelar
              </Button>
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </form>
          ) : (
            <Button
              size="sm"
              disabled={!hasQuestions}
              title={!hasQuestions ? "Agrega al menos una pregunta primero" : undefined}
              onClick={() => setShowNew(true)}
            >
              <PlusIcon />
              Nueva sesión
            </Button>
          )}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sección</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Docente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Todavía no hay sesiones para este cuestionario.
              </TableCell>
            </TableRow>
          )}
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              className="cursor-pointer"
              onClick={() => router.push(`/cuestionarios/sesiones/${session.id}`)}
            >
              <TableCell>
                {session.course_offerings?.class_groups
                  ? classGroupLabel(session.course_offerings.class_groups)
                  : "—"}
              </TableCell>
              <TableCell>{session.course_offerings?.courses?.name ?? "—"}</TableCell>
              <TableCell>
                {session.course_offerings?.staff_members?.full_name ?? "—"}
              </TableCell>
              <TableCell>
                <Badge className={STATUS_CLASSES[session.status]}>
                  {QUIZ_SESSION_STATUS_LABELS[session.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {canWrite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isDeleting && deletingId === session.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(session.id);
                    }}
                  >
                    <TrashIcon />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
