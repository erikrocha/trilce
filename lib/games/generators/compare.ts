import type { Rng } from "../rng";
import type { Question } from "../types";

// I.1 - I.3
export function compareSymbol(r: Rng, max: number): Question {
  const a = r.int(0, max);
  let b = r.chance(0.15) ? a : r.int(0, max);
  if (max === 1000 && r.chance(0.4)) b = Math.max(0, Math.min(1000, a + r.int(-9, 9)));
  const answer = a < b ? "<" : a > b ? ">" : "=";
  return {
    kind: "choice",
    prompt: "Elige el símbolo correcto.",
    visual: { kind: "text", text: `${a}  ?  ${b}` },
    options: ["<", "=", ">"],
    answer,
    explanation:
      answer === "="
        ? `${a} y ${b} son iguales.`
        : `${a} es ${answer === "<" ? "menor" : "mayor"} que ${b}: ${a} ${answer} ${b}.`,
    tag: answer === "=" ? "igual" : answer === "<" ? "menor-que" : "mayor-que",
  };
}

// I.4 / I.5
export function orderNumbers(r: Rng, max: number, count: number): Question {
  const set = new Set<number>();
  while (set.size < count) set.add(r.int(0, max));
  const nums = [...set];
  const ascending = r.chance(0.6);
  const sorted = [...nums].sort((x, y) => (ascending ? x - y : y - x));
  return {
    kind: "sequence",
    prompt: `Ordena los números de ${ascending ? "menor a mayor" : "mayor a menor"}. Tócalos en orden.`,
    tiles: r.shuffle(nums.map(String)),
    reuse: false,
    length: count,
    answer: sorted.map(String),
    explanation: `El orden correcto es ${sorted.join(", ")}.`,
    tag: ascending ? "menor-a-mayor" : "mayor-a-menor",
  };
}
