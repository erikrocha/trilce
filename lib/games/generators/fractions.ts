import type { Rng } from "../rng";
import type { Question } from "../types";
import { COUNTABLES, uniqueOptions } from "./common";

const NAMES: Record<number, string> = { 2: "mitades", 3: "tercios", 4: "cuartos" };

function fractionOptions(r: Rng, shaded: number, parts: number) {
  const answer = `${shaded}/${parts}`;
  const cands = [`${parts - shaded}/${parts}`, `${shaded}/${parts + 1}`, `${shaded + 1}/${parts}`, `${shaded}/${Math.max(2, parts - 1)}`, `${parts}/${shaded}`]
    .filter((c) => c !== answer && !c.startsWith("0/") && Number(c.split("/")[0]) <= Number(c.split("/")[1]));
  return { answer, options: uniqueOptions(r, answer, cands) };
}

// K.1
export function halvesThirdsFourths(r: Rng): Question {
  const parts = r.pick([2, 3, 4]);
  const shape = r.pick(["circle", "area"] as const);
  return {
    kind: "choice",
    prompt: "¿En qué partes iguales está dividida la figura?",
    visual: { kind: "fraction", shape, parts, shaded: 1 },
    options: ["mitades", "tercios", "cuartos"],
    answer: NAMES[parts],
    explanation: `Hay ${parts} partes iguales: son ${NAMES[parts]}.`,
    tag: NAMES[parts],
  };
}

// K.2 (círculo), K.4 (barras), K.5 (áreas)
export function fractionOfShape(r: Rng, shape: "circle" | "bar" | "area", maxParts: number): Question {
  const parts = shape === "circle" ? r.pick([2, 3, 4]) : r.int(2, maxParts);
  const shaded = r.int(1, parts - 1);
  const { answer, options } = fractionOptions(r, shaded, parts);
  return {
    kind: "choice",
    prompt: "¿Qué fracción está sombreada?",
    visual: { kind: "fraction", shape, parts, shaded },
    options,
    answer,
    explanation: `${shaded} de ${parts} partes iguales están sombreadas: ${answer}.`,
    tag: `${parts}-partes`,
  };
}

// K.3
export function fractionOfGroup(r: Rng): Question {
  const total = r.pick([2, 3, 4, 5, 6, 8]);
  const highlighted = r.int(1, total - 1);
  const { answer, options } = fractionOptions(r, highlighted, total);
  return {
    kind: "choice",
    prompt: "¿Qué fracción del grupo está marcada?",
    visual: { kind: "fractionGroup", emoji: r.pick(COUNTABLES), total, highlighted },
    options,
    answer,
    explanation: `${highlighted} de ${total} están marcados: ${answer}.`,
  };
}

// K.6 / K.7
export function shadeFraction(r: Rng, shape: "bar" | "area"): Question {
  const parts = r.pick([2, 3, 4, 6, 8]);
  const shaded = r.int(1, parts - 1);
  return {
    kind: "shade",
    prompt: `Sombrea ${shaded}/${parts}. Toca las partes.`,
    shape,
    parts,
    answer: shaded,
    explanation: `Hay que sombrear ${shaded} de las ${parts} partes.`,
    tag: `${parts}-partes`,
  };
}

// K.8 / K.9
export function fractionOnLine(r: Rng, unitOnly: boolean): Question {
  const parts = r.pick([2, 3, 4, 5, 6, 8]);
  const marked = unitOnly ? 1 : r.int(1, parts);
  const { answer, options } = fractionOptions(r, marked, parts);
  return {
    kind: "choice",
    prompt: "¿Qué fracción marca el punto?",
    visual: { kind: "fractionLine", parts, marked },
    options,
    answer,
    explanation: `Entre 0 y 1 hay ${parts} partes iguales; el punto está en la ${marked}.ª: ${answer}.`,
  };
}
