import type { Question } from "./types";

// Las respuestas viajan como string: opción/número tal cual, listas como JSON.
export function correctAnswerString(q: Question): string {
  switch (q.kind) {
    case "choice":
      return q.answer;
    case "number":
    case "shade":
      return String(q.answer);
    case "multi":
      return JSON.stringify([...q.answers].sort());
    case "sequence":
      return JSON.stringify(q.answer);
  }
}

export function checkAnswer(q: Question, given: string): boolean {
  if (given.trim() === "") return false;
  switch (q.kind) {
    case "choice":
      return given === q.answer;
    case "number":
    case "shade":
      return Number(given) === q.answer;
    case "multi":
    case "sequence": {
      try {
        const parsed = JSON.parse(given);
        if (!Array.isArray(parsed)) return false;
        const a = q.kind === "multi" ? [...parsed].map(String).sort() : parsed.map(String);
        return JSON.stringify(a) === correctAnswerString(q);
      } catch {
        return false;
      }
    }
  }
}

export function nextScore(score: number, correct: boolean) {
  if (!correct) return Math.max(0, score - 8);
  const gain = score < 50 ? 10 : score < 80 ? 6 : 4;
  return Math.min(100, score + gain);
}
