"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  closeSession,
  getAnsweredCount,
  goToQuestion,
  reopenSession,
  startSession,
} from "../actions";

type Option = { id: string; label: string; text: string };
type Question = { id: string; text: string; order_index: number; options: Option[] };
type SessionShape = {
  id: string;
  status: "borrador" | "activo" | "cerrado";
  current_question_id: string | null;
};

const DURATIONS = [10, 15, 20, 30, 45, 60];

export function Presenter({
  session,
  questions,
  totalStudents,
  quizTitle,
  courseName,
  sectionLabel,
}: {
  session: SessionShape;
  questions: Question[];
  totalStudents: number;
  quizTitle: string;
  courseName: string;
  sectionLabel: string;
}) {
  const [status, setStatus] = useState(session.status);
  const [currentId, setCurrentId] = useState(session.current_question_id);
  const [duration, setDuration] = useState(20);
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [playing, setPlaying] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [isPending, startAction] = useTransition();

  const currentIndex = questions.findIndex((q) => q.id === currentId);
  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : null;

  const isRunning = playing && secondsLeft > 0;

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isRunning) {
      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isRunning]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (status !== "activo" || !currentId) return;
    let cancelled = false;
    const poll = async () => {
      const count = await getAnsweredCount(session.id, currentId);
      if (!cancelled) setAnswered(count);
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, currentId, session.id]);

  function resetTimer() {
    setSecondsLeft(duration);
    setPlaying(false);
    setAnswered(0);
  }

  function handleStart() {
    startAction(async () => {
      await startSession(session.id);
      setStatus("activo");
      setCurrentId(questions[0]?.id ?? null);
      resetTimer();
      setPlaying(true);
    });
  }

  function handleGo(index: number) {
    const target = questions[index];
    if (!target) return;
    startAction(async () => {
      await goToQuestion(session.id, target.id);
      setCurrentId(target.id);
      resetTimer();
      setPlaying(true);
    });
  }

  function handleClose() {
    startAction(async () => {
      await closeSession(session.id);
      setStatus("cerrado");
      setPlaying(false);
    });
  }

  function handleReopen() {
    startAction(async () => {
      await reopenSession(session.id);
      setStatus("activo");
    });
  }

  if (status === "borrador") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-medium">{quizTitle}</h1>
        <p className="text-muted-foreground">
          {sectionLabel} — {courseName}
        </p>
        <Button size="lg" disabled={isPending || questions.length === 0} onClick={handleStart}>
          <PlayIcon />
          Iniciar sesión
        </Button>
        {questions.length === 0 && (
          <p className="text-sm text-destructive">
            Este cuestionario todavía no tiene preguntas.
          </p>
        )}
      </div>
    );
  }

  if (status === "cerrado") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-medium">Sesión cerrada</h1>
        <p className="text-muted-foreground">{quizTitle}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReopen} disabled={isPending}>
            <RotateCcwIcon />
            Reabrir
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/cuestionarios/sesiones/${session.id}`} />}
          >
            Ver resultados
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <p className="text-sm font-medium">{quizTitle}</p>
          <p className="text-xs text-muted-foreground">
            {sectionLabel} — {courseName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          nativeButton={false}
          render={<Link href={`/cuestionarios/sesiones/${session.id}`} />}
        >
          <XIcon />
        </Button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        <div
          className={cn(
            "flex size-24 items-center justify-center rounded-full border-4 text-4xl font-bold tabular-nums",
            secondsLeft === 0
              ? "border-destructive text-destructive"
              : "border-brand-green text-brand-green-text"
          )}
        >
          {secondsLeft}
        </div>

        <h2 className="max-w-3xl text-center text-3xl font-medium">
          {currentQuestion ? currentQuestion.text : "Sin pregunta activa"}
        </h2>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {currentQuestion?.options.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 text-lg"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-input font-bold">
                {option.label}
              </span>
              {option.text}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          {answered} de {totalStudents} respondieron
        </p>
      </main>

      <footer className="flex flex-wrap items-center justify-center gap-2 border-t border-border px-6 py-4">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={isPending || currentIndex <= 0}
          onClick={() => handleGo(currentIndex - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={isPending || secondsLeft === 0}
          onClick={() => setPlaying((p) => !p)}
        >
          {isRunning ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button variant="outline" size="icon-sm" onClick={resetTimer} disabled={isPending}>
          <RotateCcwIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={isPending || currentIndex === -1 || currentIndex >= questions.length - 1}
          onClick={() => handleGo(currentIndex + 1)}
        >
          <ChevronRightIcon />
        </Button>

        <Select
          value={String(duration)}
          onValueChange={(v) => {
            setDuration(Number(v));
            setSecondsLeft(Number(v));
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d}s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" disabled={isPending} onClick={handleClose}>
          <SquareIcon />
          Cerrar sesión
        </Button>
      </footer>
    </div>
  );
}
