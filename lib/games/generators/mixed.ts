import type { Rng } from "../rng";
import type { Question } from "../types";
import { COUNTABLES, uniqueOptions } from "./common";

function num(answer: number, prompt: string, text: string, explanation: string, tag?: string): Question {
  return { kind: "number", prompt, visual: { kind: "text", text }, answer, explanation, tag };
}

// H.1
export function pictureEquationMixed(r: Rng): Question {
  const emoji = r.pick(COUNTABLES);
  if (r.chance(0.5)) {
    const a = r.int(1, 8);
    const b = r.int(1, Math.min(10 - a, 9));
    const answer = `${a} + ${b}`;
    return {
      kind: "choice",
      prompt: "¿Qué operación coincide con el dibujo?",
      visual: { kind: "groups", emoji, a, b },
      options: uniqueOptions(r, answer, [`${a + b} − ${b}`, `${a} − ${b}`, `${a + 1} + ${b}`, `${a + b} − ${a}`].filter((d) => d !== answer)),
      answer,
      explanation: `Se juntan dos grupos: ${a} + ${b}.`,
      tag: "suma",
    };
  }
  const total = r.int(3, 10);
  const removed = r.int(1, total - 1);
  const answer = `${total} − ${removed}`;
  return {
    kind: "choice",
    prompt: "¿Qué operación coincide con el dibujo?",
    visual: { kind: "takeaway", emoji, total, removed },
    options: uniqueOptions(r, answer, [`${total} + ${removed}`, `${removed} − ${total - removed}`, `${total} − ${removed + 1}`, `${total - removed} + ${removed}`].filter((d) => d !== answer && !d.startsWith("-"))),
    answer,
    explanation: `Había ${total} y se quitaron ${removed}: ${total} − ${removed}.`,
    tag: "resta",
  };
}

// H.2
export function mixedTargets(r: Rng): Question {
  const target = r.int(4, 18);
  const build = (t: number): string => {
    if (r.chance(0.5)) {
      const a = r.int(0, t);
      return `${a} + ${t - a}`;
    }
    const b = r.int(0, Math.min(6, 20 - t));
    return `${t + b} − ${b}`;
  };
  const correct = new Set<string>();
  const want = r.int(2, 3);
  let guard = 0;
  while (correct.size < want && guard++ < 60) correct.add(build(target));
  const wrong = new Set<string>();
  guard = 0;
  while (wrong.size < 6 - correct.size && guard++ < 100) {
    const t = target + r.pick([-3, -2, -1, 1, 2, 3]);
    if (t < 0 || t > 20) continue;
    const e = build(t);
    if (!correct.has(e)) wrong.add(e);
  }
  return {
    kind: "multi",
    prompt: `Selecciona todas las operaciones que dan ${target}.`,
    options: r.shuffle([...correct, ...wrong]),
    answers: [...correct],
    explanation: `Todas las operaciones correctas dan ${target}.`,
  };
}

// H.3
export function doublesMixed(r: Rng): Question {
  const a = r.int(1, 9);
  return r.chance(0.5)
    ? num(a * 2, "Suma los dobles.", `${a} + ${a} = ?`, `${a} + ${a} = ${a * 2}.`, "suma")
    : num(a, "Resta los dobles.", `${a * 2} − ${a} = ?`, `${a * 2} − ${a} = ${a}.`, "resta");
}

// H.4
export function factFamily(r: Rng): Question {
  const a = r.int(1, 9);
  let b = r.int(1, Math.min(10, 18 - a));
  if (b === a) b = a === 1 ? 2 : a - 1;
  const c = a + b;
  const eqs: [string[], number][] = [
    [[String(a), "+", String(b), "=", String(c)], 0],
    [[String(b), "+", String(a), "=", String(c)], 0],
    [[String(c), "−", String(a), "=", String(b)], 0],
    [[String(c), "−", String(b), "=", String(a)], 0],
  ];
  const hiddenLine = r.int(0, 3);
  const idx = r.pick([0, 2, 4]);
  const answer = Number(eqs[hiddenLine][0][idx]);
  const lines = eqs.map(([parts], li) => parts.map((p, pi) => (li === hiddenLine && pi === idx ? "?" : p)).join(" "));
  return num(answer, "Completa la familia de operaciones.", lines.join("\n"), `Los números de la familia son ${a}, ${b} y ${c}.`);
}

// H.5
export function relatedMixed(r: Rng): Question {
  const c = r.int(6, 20);
  const a = r.int(1, c - 1);
  const b = c - a;
  return r.chance(0.5)
    ? num(c, "Usa la primera operación para resolver la segunda.", `${c} − ${b} = ${a}\n${a} + ${b} = ?`, `Suma y resta están relacionadas: ${a} + ${b} = ${c}.`, "resta-a-suma")
    : num(a, "Usa la primera operación para resolver la segunda.", `${a} + ${b} = ${c}\n${c} − ${b} = ?`, `Suma y resta están relacionadas: ${c} − ${b} = ${a}.`, "suma-a-resta");
}

// H.6
export function mixedFacts(r: Rng): Question {
  if (r.chance(0.5)) {
    const a = r.int(2, 18);
    const b = r.int(1, Math.min(9, 20 - a));
    return num(a + b, "Resuelve.", `${a} + ${b} = ?`, `${a} + ${b} = ${a + b}.`, "suma");
  }
  const a = r.int(4, 20);
  const b = r.int(1, Math.min(9, a));
  return num(a - b, "Resuelve.", `${a} − ${b} = ?`, `${a} − ${b} = ${a - b}.`, "resta");
}

// H.7
export function completeEquation(r: Rng): Question {
  const form = r.int(0, 3);
  if (form < 2) {
    const c = r.int(4, 20);
    const a = r.int(1, c - 1);
    const b = c - a;
    return form === 0
      ? num(b, "¿Qué número falta?", `${a} + ? = ${c}`, `${a} + ${b} = ${c}.`, "suma")
      : num(a, "¿Qué número falta?", `? + ${b} = ${c}`, `${a} + ${b} = ${c}.`, "suma");
  }
  const a = r.int(4, 20);
  const c = r.int(0, a - 1);
  const b = a - c;
  return form === 2
    ? num(b, "¿Qué número falta?", `${a} − ? = ${c}`, `${a} − ${b} = ${c}.`, "resta")
    : num(a, "¿Qué número falta?", `? − ${b} = ${c}`, `${a} − ${b} = ${c}.`, "resta");
}

// H.8
export function tenMoreOrLess(r: Rng): Question {
  const more = r.chance(0.5);
  const n = more ? r.int(0, 89) : r.int(10, 99);
  const answer = more ? n + 10 : n - 10;
  return num(answer, `¿Cuánto es 10 ${more ? "más" : "menos"} que ${n}?`, `${n} ${more ? "+" : "−"} 10 = ?`, `Solo cambia la cifra de las decenas: ${answer}.`, more ? "diez-mas" : "diez-menos");
}

// H.9
export function addSubMultipleOfTen(r: Rng): Question {
  for (;;) {
    const n = r.int(11, 89);
    if (n % 10 === 0) continue;
    if (r.chance(0.5)) {
      const m = r.int(1, Math.floor((99 - n) / 10)) * 10;
      if (m < 10) continue;
      return num(n + m, "Resuelve.", `${n} + ${m} = ?`, `${n} + ${m} = ${n + m}.`, "suma");
    }
    const m = r.int(1, Math.floor(n / 10)) * 10;
    return num(n - m, "Resuelve.", `${n} − ${m} = ?`, `${n} − ${m} = ${n - m}.`, "resta");
  }
}

// H.10
export function addSubTens(r: Rng): Question {
  if (r.chance(0.5)) {
    const a = r.int(1, 8) * 10;
    const b = r.int(1, (100 - a) / 10) * 10;
    return num(a + b, "Resuelve.", `${a} + ${b} = ?`, `${a} + ${b} = ${a + b}.`, "suma");
  }
  const a = r.int(2, 10) * 10;
  const b = r.int(1, a / 10) * 10;
  return num(a - b, "Resuelve.", `${a} − ${b} = ?`, `${a} − ${b} = ${a - b}.`, "resta");
}
