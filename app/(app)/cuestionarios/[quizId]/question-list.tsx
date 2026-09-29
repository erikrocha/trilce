"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./question-card";
import type { QuestionWithOptions } from "./types";

export function QuestionList({
  quizId,
  questions,
  canWrite,
}: {
  quizId: string;
  questions: QuestionWithOptions[];
  canWrite: boolean;
}) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && !showNew && (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Todavía no hay preguntas.
        </p>
      )}

      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          quizId={quizId}
          question={question}
          index={index}
          canWrite={canWrite}
        />
      ))}

      {canWrite && showNew && (
        <QuestionCard
          quizId={quizId}
          question={null}
          index={questions.length}
          canWrite={canWrite}
          startExpanded
          onCreated={() => setShowNew(false)}
        />
      )}

      {canWrite && !showNew && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setShowNew(true)}
        >
          <PlusIcon />
          Agregar pregunta
        </Button>
      )}
    </div>
  );
}
