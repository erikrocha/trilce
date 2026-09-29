"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { FractionCells, VisualView } from "@/components/games/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSkill } from "@/lib/games/catalog";
import { checkAnswer, correctAnswerString, nextScore } from "@/lib/games/check";
import { makeRng, newSeed } from "@/lib/games/rng";
import { cn } from "@/lib/utils";
import { recordAttempt } from "../actions";
import { StudentPanel } from "./student-panel";

export type Roster = {
  groups: { id: string; label: string }[];
  students: { id: string; groupId: string; name: string; code: string }[];
};

type Status = "answering" | "correct" | "wrong";

export function SkillPlayer({
  skillId,
  title,
  sectionName,
  initialSeed,
  isStudent,
  roster,
}: {
  skillId: string;
  title: string;
  sectionName: string;
  initialSeed: number;
  isStudent: boolean;
  roster?: Roster;
}) {
  const [seed, setSeed] = useState(initialSeed);
  const question = useMemo(() => getSkill(skillId)!.generate(makeRng(seed)), [skillId, seed]);

  const [status, setStatus] = useState<Status>("answering");
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [seq, setSeq] = useState<string[]>([]);
  const [shadedCells, setShadedCells] = useState<number[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(null);

  // Modo un solo dispositivo: el docente elige al alumno; sin elegir no se juega.
  const teacherMode = roster !== undefined;
  const needsStudent = teacherMode && !player;
  const canSave = isStudent || (teacherMode && !!player);

  const sessionRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const locked = status !== "answering";
  const mastered = score >= 100;

  function submit(answer: string) {
    if (locked || answer.trim() === "") return;
    const isCorrect = checkAnswer(question, answer);
    setChosen(answer);
    setStatus(isCorrect ? "correct" : "wrong");
    setScore((s) => nextScore(s, isCorrect));
    setAnswered((n) => n + 1);
    if (isCorrect) setCorrectCount((n) => n + 1);

    if (canSave) {
      const attemptSeed = seed;
      const studentId = player?.id;
      queueRef.current = queueRef.current.then(async () => {
        try {
          const res = await recordAttempt({ sessionId: sessionRef.current, skillId, seed: attemptSeed, answer, studentId });
          if (res.ok) sessionRef.current = res.sessionId;
          else setSaveError(true);
        } catch {
          setSaveError(true);
        }
      });
    }
  }

  function next() {
    setSeed(newSeed());
    setStatus("answering");
    setTyped("");
    setPicked([]);
    setSeq([]);
    setShadedCells([]);
    setChosen(null);
  }

  function pickStudent(id: string, name: string) {
    sessionRef.current = null;
    setPlayer({ id, name });
    setScore(0);
    setAnswered(0);
    setCorrectCount(0);
    setSaveError(false);
    next();
  }

  const correctString = correctAnswerString(question);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/juegos" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" />
          Juegos
        </Link>
        <p className="text-xs text-muted-foreground">
          {skillId} · {sectionName}
        </p>
        <h1 className="text-lg font-medium">{title}</h1>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Puntaje</span>
          <span className="font-medium tabular-nums">{score} / 100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${score}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {answered} contestadas · {correctCount} correctas
        </p>
        {!canSave && !teacherMode && (
          <p className="text-xs text-muted-foreground">Modo práctica: solo los alumnos guardan sus resultados.</p>
        )}
        {teacherMode && player && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border-brand px-3 py-2 text-sm">
            <span>
              Jugando: <span className="font-medium">{player.name}</span>
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => setPlayer(null)}>
              Cambiar alumno
            </Button>
          </div>
        )}
        {saveError && <p className="text-xs text-destructive">No se pudo guardar alguna respuesta.</p>}
      </div>

      {mastered && (
        <div className="rounded-2xl border border-border-brand p-4 text-sm">
          <span className="font-medium text-brand-green-text">¡Dominaste esta habilidad!</span> Puedes seguir practicando o
          elegir otro juego.
        </div>
      )}

      {needsStudent && roster && <StudentPanel roster={roster} onPick={pickStudent} />}

      {!needsStudent && (
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border p-6">
        <p className="text-center text-lg font-medium">{question.prompt}</p>
        {question.visual && <VisualView visual={question.visual} />}

        {question.kind === "choice" && (
          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {question.options.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                disabled={locked}
                onClick={() => submit(option)}
                className={cn(
                  "h-auto min-h-14 whitespace-normal py-2 text-xl",
                  locked && option === question.answer && "border-brand-green bg-brand-green/15",
                  locked && option === chosen && option !== question.answer && "border-destructive bg-destructive/10"
                )}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {question.kind === "number" && (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(typed);
            }}
          >
            <Input
              type="number"
              inputMode="numeric"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={locked}
              className="h-14 w-32 text-center text-2xl"
              autoFocus
            />
            <Button type="submit" size="lg" disabled={locked || typed === ""}>
              Comprobar
            </Button>
          </form>
        )}

        {question.kind === "multi" && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {question.options.map((option) => {
                const on = picked.includes(option);
                const isAnswer = question.answers.includes(option);
                return (
                  <Button
                    key={option}
                    type="button"
                    variant="outline"
                    disabled={locked}
                    onClick={() => setPicked((p) => (on ? p.filter((x) => x !== option) : [...p, option]))}
                    className={cn(
                      "h-auto min-h-12 min-w-16 whitespace-normal text-lg",
                      on && !locked && "border-brand-green bg-brand-green/20",
                      locked && isAnswer && "border-brand-green bg-brand-green/15",
                      locked && on && !isAnswer && "border-destructive bg-destructive/10"
                    )}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
            <Button size="lg" disabled={locked || picked.length === 0} onClick={() => submit(JSON.stringify(picked))}>
              Comprobar
            </Button>
          </div>
        )}

        {question.kind === "sequence" && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: question.length }, (_, i) => (
                <div key={i} className="flex size-14 items-center justify-center rounded-lg border-2 border-dashed border-foreground text-2xl">
                  {seq[i] ?? ""}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {question.tiles.map((tile, i) => {
                const used = !question.reuse && seq.includes(tile);
                return (
                  <Button
                    key={`${tile}-${i}`}
                    type="button"
                    variant="outline"
                    disabled={locked || used || seq.length >= question.length}
                    onClick={() => setSeq((s) => [...s, tile])}
                    className="h-14 min-w-14 text-2xl"
                  >
                    {tile}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={locked || seq.length === 0} onClick={() => setSeq((s) => s.slice(0, -1))}>
                Borrar
              </Button>
              <Button size="lg" disabled={locked || seq.length < question.length} onClick={() => submit(JSON.stringify(seq))}>
                Comprobar
              </Button>
            </div>
          </div>
        )}

        {question.kind === "shade" && (
          <div className="flex flex-col items-center gap-4">
            <FractionCells
              parts={question.parts}
              shape={question.shape}
              shaded={(i) => shadedCells.includes(i)}
              onToggle={locked ? undefined : (i) => setShadedCells((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
            />
            <Button size="lg" disabled={locked || shadedCells.length === 0} onClick={() => submit(String(shadedCells.length))}>
              Comprobar
            </Button>
          </div>
        )}

        {locked && (
          <div className="flex w-full flex-col items-center gap-3">
            <p className={cn("flex items-center gap-2 text-sm font-medium", status === "correct" ? "text-brand-green-text" : "text-destructive")}>
              {status === "correct" ? <CheckCircle2Icon className="size-4" /> : <XCircleIcon className="size-4" />}
              {status === "correct" ? "¡Muy bien!" : "Casi. Inténtalo con la siguiente."}
            </p>
            {status === "wrong" && question.kind !== "choice" && question.kind !== "multi" && (
              <p className="text-sm">
                Respuesta correcta: <span className="font-medium">{question.kind === "sequence" ? (JSON.parse(correctString) as string[]).join(" ") : correctString}</span>
              </p>
            )}
            <p className="text-center text-sm text-muted-foreground">{question.explanation}</p>
            <Button onClick={next} autoFocus>
              Siguiente
            </Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
