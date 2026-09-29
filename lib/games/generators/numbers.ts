import type { Rng } from "../rng";
import type { Question } from "../types";
import { COUNTABLES, numberOptions, uniqueOptions } from "./common";

// A.1 / A.2
export function countObjects(r: Rng, max: number, asChoice: boolean): Question {
  const count = r.int(1, max);
  const visual = { kind: "objects", emoji: r.pick(COUNTABLES), count } as const;
  const explanation = `Contamos uno por uno: hay ${count}.`;
  if (asChoice) {
    return {
      kind: "choice",
      prompt: "¿Cuántos hay?",
      visual,
      options: numberOptions(r, count, 1, max),
      answer: String(count),
      explanation,
    };
  }
  return { kind: "number", prompt: "¿Cuántos hay? Escribe el número.", visual, answer: count, explanation };
}

// A.3 - A.6
export function skipCount(r: Rng, steps: number[]): Question {
  const step = r.pick(steps);
  const start = step * r.int(0, step === 10 ? 4 : step === 5 ? 6 : 8);
  const items = Array.from({ length: 6 }, (_, i) => start + i * step);
  const hidden = r.int(1, 5);
  const shown = items.map((n, i) => (i === hidden ? "?" : String(n)));
  return {
    kind: "number",
    prompt: `Cuenta de ${step} en ${step}. ¿Qué número falta?`,
    visual: { kind: "text", text: shown.join("  ") },
    answer: items[hidden],
    explanation: `Sumamos ${step} cada vez: falta el ${items[hidden]}.`,
    tag: `de-${step}`,
  };
}

// A.7
export function countingPattern(r: Rng): Question {
  const d = r.pick([1, 2, 3, 4, 5, 10]);
  const up = r.chance(0.6);
  const start = up ? r.int(0, 30) : r.int(40, 90);
  const items = [0, 1, 2, 3].map((i) => start + (up ? i : -i) * d);
  const next = start + (up ? 4 : -4) * d;
  return {
    kind: "number",
    prompt: "Sigue el patrón. ¿Qué número viene después?",
    visual: { kind: "text", text: `${items.join("  ")}  ?` },
    answer: next,
    explanation: `El patrón ${up ? "suma" : "resta"} ${d} cada vez: sigue el ${next}.`,
    tag: up ? "creciente" : "decreciente",
  };
}

// A.8
export function readNumberLine(r: Rng): Question {
  const max = r.pick([10, 10, 20]);
  const n = r.int(0, max);
  return {
    kind: "choice",
    prompt: "¿Qué número marca el punto?",
    visual: { kind: "numberLine", min: 0, max, step: 1, labelEvery: max === 10 ? 1 : 5, marked: n },
    options: numberOptions(r, n, 0, max),
    answer: String(n),
    explanation: `El punto está en el ${n}.`,
  };
}

// A.9
export function hundredsChartMissing(r: Rng): Question {
  const target = r.int(1, 100);
  const blank = new Set<number>([target]);
  while (blank.size < 4) blank.add(r.int(1, 100));
  return {
    kind: "number",
    prompt: "¿Qué número va en la casilla marcada?",
    visual: { kind: "hundredsChart", blank: [...blank], highlight: target },
    answer: target,
    explanation: `Miramos los vecinos de la casilla: va el ${target}.`,
  };
}

// A.10 / A.12
export function countUpDown(r: Rng, max: number): Question {
  const steps = max === 100 ? [1, 1, 1, 10] : [1, 10, 100];
  const step = r.pick(steps);
  const forward = r.chance(0.5);
  const dir = forward ? 1 : -1;
  const lo = step * 3;
  const start = r.int(lo, max - step * 4);
  const shown = [0, 1, 2].map((i) => start + dir * i * step);
  const answer = start + dir * 3 * step;
  return {
    kind: "number",
    prompt: `Cuenta hacia ${forward ? "delante" : "atrás"}${step > 1 ? ` de ${step} en ${step}` : ""}. ¿Qué número sigue?`,
    visual: { kind: "text", text: `${shown.join("  ")}  ?` },
    answer,
    explanation: `${forward ? "Sumamos" : "Restamos"} ${step}: sigue el ${answer}.`,
    tag: forward ? "adelante" : "atras",
  };
}

// A.11
export function estimateToTen(r: Rng): Question {
  let n = r.int(11, 89);
  if (n % 10 === 5) n += 1;
  const lo = Math.floor(n / 10) * 10;
  const hi = lo + 10;
  const answer = n - lo < 5 ? lo : hi;
  return {
    kind: "choice",
    prompt: `¿A qué decena está más cerca el ${n}?`,
    visual: { kind: "numberLine", min: lo, max: hi, step: 1, labelEvery: 5, marked: n },
    options: uniqueOptions(r, String(answer), [String(lo === answer ? hi : lo), String(lo - 10), String(hi + 10)]),
    answer: String(answer),
    explanation: `${n} está más cerca de ${answer}.`,
  };
}

// A.13
export function evenOdd(r: Rng): Question {
  const wantEven = r.chance(0.5);
  const nums = new Set<number>();
  while (nums.size < 8) nums.add(r.int(1, 30));
  const options = [...nums].sort((a, b) => a - b).map(String);
  const answers = options.filter((n) => (Number(n) % 2 === 0) === wantEven);
  if (answers.length === 0 || answers.length === options.length) return evenOdd(r);
  return {
    kind: "multi",
    prompt: `Selecciona todos los números ${wantEven ? "pares" : "impares"}.`,
    options,
    answers,
    explanation: wantEven
      ? "Los pares terminan en 0, 2, 4, 6 u 8."
      : "Los impares terminan en 1, 3, 5, 7 o 9.",
    tag: wantEven ? "pares" : "impares",
  };
}
