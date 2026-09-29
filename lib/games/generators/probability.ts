import type { Rng } from "../rng";
import type { Question, Visual } from "../types";

const COLORS = ["🔴", "🔵", "🟢", "🟡"];

// O.1
export function moreLikely(r: Rng): Question {
  const [c1, c2] = r.shuffle(COLORS);
  const equal = r.chance(0.25);
  const a = r.int(1, 8);
  let b = equal ? a : r.int(1, 8);
  if (!equal && b === a) b = a + 1;
  const bag: Visual = { kind: "bag", items: [{ emoji: c1, count: a }, { emoji: c2, count: b }] };
  if (equal) {
    return {
      kind: "choice",
      prompt: "Sacas una ficha sin mirar. ¿Qué es más probable?",
      visual: bag,
      options: [`Sacar ${c1}`, `Sacar ${c2}`, "Igual de probable"],
      answer: "Igual de probable",
      explanation: "Hay la misma cantidad de cada color.",
      tag: "igual",
    };
  }
  const most = r.chance(0.5);
  const winner = (most ? a > b : a < b) ? c1 : c2;
  return {
    kind: "choice",
    prompt: `Sacas una ficha sin mirar. ¿Qué color es ${most ? "más" : "menos"} probable?`,
    visual: bag,
    options: [c1, c2],
    answer: winner,
    explanation: `Hay ${a} de ${c1} y ${b} de ${c2}.`,
    tag: most ? "mas-probable" : "menos-probable",
  };
}

// O.2
export function certainOrImpossible(r: Rng): Question {
  const [red, other] = r.shuffle(COLORS);
  const kind = r.int(0, 3);
  let redCount = 0;
  let otherCount = 0;
  let answer = "";
  if (kind === 0) {
    redCount = r.int(3, 8);
    answer = "Seguro";
  } else if (kind === 1) {
    otherCount = r.int(3, 8);
    answer = "Imposible";
  } else if (kind === 2) {
    otherCount = r.int(1, 2);
    redCount = otherCount + r.int(3, 6);
    answer = "Probable";
  } else {
    redCount = r.int(1, 2);
    otherCount = redCount + r.int(3, 6);
    answer = "Improbable";
  }
  const items = [{ emoji: red, count: redCount }, { emoji: other, count: otherCount }].filter((i) => i.count > 0);
  return {
    kind: "choice",
    prompt: `Sacas una ficha sin mirar. Sacar ${red} es...`,
    visual: { kind: "bag", items },
    options: ["Seguro", "Probable", "Improbable", "Imposible"],
    answer,
    explanation:
      answer === "Seguro"
        ? "Todas las fichas son de ese color."
        : answer === "Imposible"
          ? "No hay fichas de ese color."
          : answer === "Probable"
            ? "Hay muchas fichas de ese color."
            : "Hay pocas fichas de ese color.",
    tag: answer.toLowerCase(),
  };
}
