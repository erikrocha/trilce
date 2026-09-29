import type { Rng } from "../rng";
import type { Question } from "../types";
import { uniqueOptions } from "./common";

function label(t: number, o: number) {
  return `${t} ${t === 1 ? "decena" : "decenas"} y ${o} ${o === 1 ? "unidad" : "unidades"}`;
}

function pick(r: Rng, max: number) {
  const n = max === 20 ? r.int(10, 20) : r.int(11, 99);
  return { n, t: Math.floor(n / 10), o: n % 10 };
}

function distractors(t: number, o: number, max: number) {
  const list = [label(o, t), label(t + 1, o), label(Math.max(0, t - 1), o), label(t, (o + 1) % 10), label(t, Math.abs(o - 1))];
  return list.filter((l) => l !== label(t, o) && !(max === 20 && /^[3-9]/.test(l)));
}

// J.1 / J.4
export function modelToTensOnes(r: Rng, max: number): Question {
  const { t, o } = pick(r, max);
  return {
    kind: "choice",
    prompt: "¿Cuántas decenas y unidades hay?",
    visual: { kind: "placeValue", tens: t, ones: o },
    options: uniqueOptions(r, label(t, o), distractors(t, o, max)),
    answer: label(t, o),
    explanation: `Cada barra es una decena y cada cubo una unidad: ${label(t, o)}.`,
  };
}

// J.2 / J.5
export function modelToNumber(r: Rng, max: number): Question {
  const { n, t, o } = pick(r, max);
  return {
    kind: "number",
    prompt: "¿Qué número muestra el dibujo?",
    visual: { kind: "placeValue", tens: t, ones: o },
    answer: n,
    explanation: `${label(t, o)} forman el ${n}.`,
  };
}

// J.3 / J.6
export function numberToTensOnes(r: Rng, max: number): Question {
  const { n, t, o } = pick(r, max);
  return {
    kind: "choice",
    prompt: `Escribe el ${n} como decenas y unidades.`,
    visual: { kind: "text", text: String(n) },
    options: uniqueOptions(r, label(t, o), distractors(t, o, max)),
    answer: label(t, o),
    explanation: `${n} = ${label(t, o)}.`,
  };
}
