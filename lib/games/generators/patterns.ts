import type { Rng } from "../rng";
import type { Question } from "../types";
import { uniqueOptions } from "./common";

const TOKENS = ["🔴", "🔵", "🟢", "🟡", "⭐", "🌙", "🍎", "🐟"];
const UNITS = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2], [0, 0, 1, 1]];

function unitTokens(r: Rng) {
  const unit = r.pick(UNITS);
  const set = r.shuffle(TOKENS).slice(0, Math.max(...unit) + 2);
  return { unit, set };
}

function repeat(unit: number[], set: string[], length: number) {
  return Array.from({ length }, (_, i) => set[unit[i % unit.length]]);
}

// N.1
export function completePattern(r: Rng): Question {
  const { unit, set } = unitTokens(r);
  const length = unit.length * 2 + r.int(1, unit.length);
  const full = repeat(unit, set, length);
  const hidden = full.length - 1;
  const shown = full.map((t, i) => (i === hidden ? "?" : t));
  return {
    kind: "choice",
    prompt: "¿Qué figura sigue en el patrón?",
    visual: { kind: "pattern", items: shown },
    options: uniqueOptions(r, full[hidden], set),
    answer: full[hidden],
    explanation: `El patrón se repite: sigue ${full[hidden]}.`,
    tag: unit.join(""),
  };
}

// N.2
export function createPattern(r: Rng): Question {
  const { unit, set } = unitTokens(r);
  const shownLen = unit.length * 2;
  const full = repeat(unit, set, shownLen + 3);
  const tokens = set.slice(0, Math.max(...unit) + 1);
  return {
    kind: "sequence",
    prompt: "Continúa el patrón: toca las 3 figuras que siguen.",
    visual: { kind: "pattern", items: full.slice(0, shownLen) },
    tiles: tokens,
    reuse: true,
    length: 3,
    answer: full.slice(shownLen),
    explanation: `El patrón se repite y siguen ${full.slice(shownLen).join(" ")}.`,
    tag: unit.join(""),
  };
}

// N.3 / N.4
export function numberSequence(r: Rng, increasing: boolean): Question {
  const d = r.pick([1, 2, 3, 4, 5, 10]);
  const start = increasing ? r.int(0, 30) : r.int(45, 99);
  const items = [0, 1, 2, 3].map((i) => start + (increasing ? i : -i) * d);
  const hiddenAt = r.pick([1, 2, 4]);
  const all = [...items, start + (increasing ? 4 : -4) * d];
  const shown = all.map((n, i) => (i === hiddenAt ? "?" : String(n)));
  return {
    kind: "number",
    prompt: `Completa la secuencia ${increasing ? "creciente" : "decreciente"}.`,
    visual: { kind: "text", text: shown.join("  ") },
    answer: all[hiddenAt],
    explanation: `Cada número ${increasing ? "aumenta" : "disminuye"} ${d}: falta el ${all[hiddenAt]}.`,
    tag: `de-${d}`,
  };
}
