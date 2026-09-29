"use client";

import { useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, RotateCcwIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QUIZ_SESSION_STATUS_LABELS } from "@/lib/enum-labels";
import {
  closeSession,
  goToQuestion,
  reopenSession,
  startSession,
} from "./actions";

type Question = { id: string; text: string; order_index: number };
type SessionShape = {
  id: string;
  status: "borrador" | "activo" | "cerrado";
  current_question_id: string | null;
};

const STATUS_CLASSES: Record<SessionShape["status"], string> = {
  borrador: "bg-muted text-muted-foreground",
  activo: "bg-badge-pagado/15 text-badge-pagado",
  cerrado: "bg-muted text-badge-anulado",
};

export function ControlPanel({
  session,
  questions,
  totalStudents,
  answeredCurrentQuestion,
}: {
  session: SessionShape;
  questions: Question[];
  totalStudents: number;
  answeredCurrentQuestion: number;
}) {
  const [isPending, startAction] = useTransition();

  const currentIndex = questions.findIndex(
    (q) => q.id === session.current_question_id
  );
  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : null;

  function go(action: () => Promise<{ error: string } | undefined>) {
    startAction(async () => {
      await action();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2">
        <Badge className={STATUS_CLASSES[session.status]}>
          {QUIZ_SESSION_STATUS_LABELS[session.status]}
        </Badge>
        {session.status === "activo" && (
          <span className="text-sm text-muted-foreground">
            {answeredCurrentQuestion} de {totalStudents} respondieron esta pregunta
          </span>
        )}
      </div>

      {session.status === "borrador" && (
        <div>
          <Button
            size="sm"
            disabled={isPending || questions.length === 0}
            onClick={() => go(() => startSession(session.id))}
          >
            <PlayIcon />
            Iniciar sesión
          </Button>
        </div>
      )}

      {session.status === "activo" && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={isPending || currentIndex <= 0}
            onClick={() =>
              go(() => goToQuestion(session.id, questions[currentIndex - 1].id))
            }
          >
            <ChevronLeftIcon />
          </Button>
          <div className="min-w-64 rounded-lg border border-border px-3 py-1.5 text-sm">
            {currentQuestion
              ? `Pregunta ${currentIndex + 1} de ${questions.length}: ${currentQuestion.text}`
              : "Sin pregunta activa"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={isPending || currentIndex === -1 || currentIndex >= questions.length - 1}
            onClick={() =>
              go(() => goToQuestion(session.id, questions[currentIndex + 1].id))
            }
          >
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => go(() => closeSession(session.id))}
          >
            <SquareIcon />
            Cerrar sesión
          </Button>
        </div>
      )}

      {session.status === "cerrado" && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => go(() => reopenSession(session.id))}
          >
            <RotateCcwIcon />
            Reabrir sesión
          </Button>
        </div>
      )}
    </div>
  );
}
