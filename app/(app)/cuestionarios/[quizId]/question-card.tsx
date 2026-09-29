"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2Icon, ChevronDownIcon, PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { deleteQuestion, saveQuestion, type FormState } from "./actions";
import type { QuestionWithOptions } from "./types";

type OptionDraft = { id?: string; label: string; text: string; is_correct: boolean };

const DEFAULT_LABELS = ["A", "B", "C", "D", "E", "F"];

function blankOptions(): OptionDraft[] {
  return DEFAULT_LABELS.slice(0, 4).map((label) => ({
    label,
    text: "",
    is_correct: false,
  }));
}

function relabel(options: OptionDraft[]): OptionDraft[] {
  return options.map((o, i) => ({ ...o, label: DEFAULT_LABELS[i] ?? String(i + 1) }));
}

export function QuestionCard({
  quizId,
  question,
  index,
  canWrite,
  startExpanded,
  onCreated,
}: {
  quizId: string;
  question: QuestionWithOptions | null;
  index: number;
  canWrite: boolean;
  startExpanded?: boolean;
  onCreated?: () => void;
}) {
  const [expanded, setExpanded] = useState(Boolean(startExpanded || !question));
  const [text, setText] = useState(question?.text ?? "");
  const [options, setOptions] = useState<OptionDraft[]>(
    question
      ? question.quiz_question_options.map((o) => ({
          id: o.id,
          label: o.label,
          text: o.text,
          is_correct: o.is_correct,
        }))
      : blankOptions()
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const action = saveQuestion.bind(null, quizId, question?.id ?? null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      if (!question) {
        onCreated?.();
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- collapse only once, right after a successful save, not a render-sync loop
        setExpanded(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleDelete() {
    if (!question) return;
    startDelete(async () => {
      const result = await deleteQuestion(quizId, question.id);
      if (result?.error) {
        setDeleteError(result.error);
      }
    });
  }

  if (!canWrite || (!expanded && question)) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-border p-4",
          canWrite && "cursor-pointer hover:bg-surface-elevated"
        )}
        onClick={() => canWrite && setExpanded(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {index + 1}. {question?.text}
          </span>
          {canWrite && <ChevronDownIcon className="size-4 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          {question?.quiz_question_options.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              {o.is_correct ? (
                <CheckCircle2Icon className="size-3.5 text-brand-green-text" />
              ) : (
                <span className="size-3.5" />
              )}
              <span>
                {o.label}. {o.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border p-4"
    >
      <input type="hidden" name="options_json" value={JSON.stringify(options)} readOnly />

      <div className="flex flex-col gap-1.5">
        <Textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Pregunta ${index + 1}`}
          rows={2}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option, i) => (
          <div key={option.id ?? `new-${i}`} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setOptions((opts) =>
                  opts.map((o, j) => ({ ...o, is_correct: j === i }))
                )
              }
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                option.is_correct
                  ? "border-brand-green bg-brand-green text-black"
                  : "border-input text-muted-foreground"
              )}
              title="Marcar como correcta"
            >
              {option.label}
            </button>
            <Input
              value={option.text}
              onChange={(e) =>
                setOptions((opts) =>
                  opts.map((o, j) =>
                    j === i ? { ...o, text: e.target.value } : o
                  )
                )
              }
              placeholder={`Alternativa ${option.label}`}
              required
            />
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  setOptions((opts) => relabel(opts.filter((_, j) => j !== i)))
                }
              >
                <XIcon />
              </Button>
            )}
          </div>
        ))}
        {options.length < DEFAULT_LABELS.length && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() =>
              setOptions((opts) =>
                relabel([...opts, { label: "", text: "", is_correct: false }])
              )
            }
          >
            <PlusIcon />
            Agregar alternativa
          </Button>
        )}
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      <div className="flex items-center justify-between">
        {question ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <TrashIcon />
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {question && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
