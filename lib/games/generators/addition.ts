import type { Rng } from "../rng";
import type { Question } from "../types";
import { COUNTABLES, numberOptions, uniqueOptions } from "./common";

function num(answer: number, prompt: string, text: string, explanation: string, tag?: string): Question {
  return { kind: "number", prompt, visual: { kind: "text", text }, answer, explanation, tag };
}

// B.1
export function addPictureEquation(r: Rng): Question {
  const a = r.int(1, 9);
  const b = r.int(1, Math.min(10 - a, 9));
  const answer = `${a} + ${b}`;
  const reversed = `${b} + ${a}`;
  const distractors = [`${a} + ${b + 1}`, `${a + 1} + ${b}`, `${a} + ${Math.max(1, b - 1)}`, `${a + 2} + ${b}`].filter(
    (d) => d !== answer && d !== reversed
  );
  return {
    kind: "choice",
    prompt: "¿Qué suma coincide con el dibujo?",
    visual: { kind: "groups", emoji: r.pick(COUNTABLES), a, b },
    options: uniqueOptions(r, answer, distractors),
    answer,
    explanation: `Hay ${a} en un grupo y ${b} en el otro: ${a} + ${b}.`,
  };
}

// B.2 / B.5
export function addFacts(r: Rng, max: number): Question {
  const big = max > 10 && r.chance(0.75);
  const sum = big ? r.int(11, max) : r.int(2, Math.min(max, 10));
  const a = r.int(Math.max(0, sum - 10), Math.min(sum, 10));
  const b = sum - a;
  return num(sum, "Resuelve la suma.", `${a} + ${b} = ?`, `${a} + ${b} = ${sum}.`, big ? "pasa-de-10" : "hasta-10");
}

// B.3 / B.6 y E.3 / E.6 (op = "+" o "−")
export function makeTargetNumber(r: Rng, max: number, op: "+" | "−"): Question {
  const target = op === "+" ? r.int(4, max) : r.int(1, Math.min(max, 12));
  const build = (t: number): string => {
    if (op === "+") {
      const a = r.int(0, t);
      return `${a} + ${t - a}`;
    }
    const b = r.int(0, Math.min(6, max - t));
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
    if (t < 0 || t > max) continue;
    const e = build(t);
    if (!correct.has(e)) wrong.add(e);
  }
  const options = r.shuffle([...correct, ...wrong]);
  return {
    kind: "multi",
    prompt: `Selecciona todas las ${op === "+" ? "sumas" : "restas"} que dan ${target}.`,
    options,
    answers: [...correct],
    explanation: `Las operaciones correctas dan ${target}.`,
  };
}

// B.4
export function addMissing(r: Rng, max: number): Question {
  const c = r.int(3, max);
  const a = r.int(1, c - 1);
  const b = c - a;
  return r.chance(0.5)
    ? num(b, "¿Qué número falta?", `${a} + ? = ${c}`, `${a} + ${b} = ${c}.`)
    : num(a, "¿Qué número falta?", `? + ${b} = ${c}`, `${a} + ${b} = ${c}.`);
}

// B.7
export function relatedAdd(r: Rng, max: number): Question {
  const c = r.int(4, max);
  const a = r.int(1, c - 1);
  const b = c - a;
  return num(
    c,
    "Usa la primera suma para resolver la segunda.",
    `${a} + ${b} = ${c}\n${b} + ${a} = ?`,
    `Sumar en otro orden da lo mismo: ${b} + ${a} = ${c}.`
  );
}

// B.8 / B.9
export function addTwoDigitOne(r: Rng, regroup: boolean): Question {
  for (;;) {
    const tens = r.int(1, 9);
    const ones = regroup ? r.int(1, 9) : r.int(0, 8);
    const b = r.int(1, 9);
    const a = tens * 10 + ones;
    if (regroup ? ones + b >= 10 && a + b < 100 : ones + b <= 9) {
      return num(
        a + b,
        "Resuelve la suma.",
        `${a} + ${b} = ?`,
        `${a} + ${b} = ${a + b}.`,
        regroup ? "con-reagrupacion" : "sin-reagrupacion"
      );
    }
  }
}

// B.10 / B.11
export function addTwoTwo(r: Rng, regroup: boolean): Question {
  for (;;) {
    const a = r.int(10, 89);
    const b = r.int(10, 89);
    const onesSum = (a % 10) + (b % 10);
    const ok = regroup ? onesSum >= 10 && a + b < 100 : onesSum <= 9 && a + b < 100;
    if (ok) {
      return num(
        a + b,
        "Resuelve la suma.",
        `${a} + ${b} = ?`,
        `${a} + ${b} = ${a + b}.`,
        regroup ? "con-reagrupacion" : "sin-reagrupacion"
      );
    }
  }
}

// B.12 y E.12
export function estimateTwoDigit(r: Rng, op: "+" | "−"): Question {
  const fix = (n: number) => (n % 10 === 5 ? n + 1 : n);
  const roundTen = (n: number) => Math.round(n / 10) * 10;
  for (;;) {
    let a = fix(r.int(12, 89));
    let b = fix(r.int(12, 89));
    if (op === "−" && a < b) [a, b] = [b, a];
    const est = op === "+" ? roundTen(a) + roundTen(b) : roundTen(a) - roundTen(b);
    if (est < 0 || est > 200 || (op === "−" && a === b)) continue;
    return {
      kind: "choice",
      prompt: `Estima ${op === "+" ? "la suma" : "la resta"} redondeando a la decena más cercana.`,
      visual: { kind: "text", text: `${a} ${op} ${b} ≈ ?` },
      options: uniqueOptions(r, String(est), [String(est + 10), String(est - 10), String(est + 20), String(Math.max(0, est - 20))]),
      answer: String(est),
      explanation: `${a} ≈ ${roundTen(a)} y ${b} ≈ ${roundTen(b)}; ${roundTen(a)} ${op} ${roundTen(b)} = ${est}.`,
    };
  }
}

// C.1
export function doubles(r: Rng): Question {
  const a = r.int(1, 10);
  return num(a + a, "Suma los dobles.", `${a} + ${a} = ?`, `${a} + ${a} = ${a * 2}.`);
}

// C.2 / C.3
export function doublesNear(r: Rng, delta: 1 | -1): Question {
  const a = r.int(2, 9);
  const b = a + delta;
  const [x, y] = r.chance(0.5) ? [a, b] : [b, a];
  const hint = delta === 1 ? `${a} + ${a} = ${a * 2}, y uno más es ${a * 2 + 1}` : `${a} + ${a} = ${a * 2}, y uno menos es ${a * 2 - 1}`;
  return num(a + b, delta === 1 ? "Usa dobles más uno." : "Usa dobles menos uno.", `${x} + ${y} = ?`, `${hint}.`);
}

// C.4
export function makeTen(r: Rng): Question {
  const a = r.int(1, 9);
  return num(10 - a, "¿Cuánto falta para llegar a 10?", `${a} + ? = 10`, `${a} + ${10 - a} = 10.`);
}

// C.5
export function addTens(r: Rng): Question {
  const a = r.int(1, 8) * 10;
  const b = r.int(1, (100 - a) / 10) * 10;
  return num(a + b, "Suma los múltiplos de 10.", `${a} + ${b} = ?`, `${a / 10} decenas + ${b / 10} decenas = ${(a + b) / 10} decenas: ${a + b}.`);
}

// C.6
export function addMultipleOfTen(r: Rng): Question {
  for (;;) {
    const n = r.int(11, 89);
    if (n % 10 === 0) continue;
    const m = r.int(1, Math.floor((99 - n) / 10)) * 10;
    if (m < 10) continue;
    const [x, y] = r.chance(0.5) ? [n, m] : [m, n];
    return num(n + m, "Suma un múltiplo de 10.", `${x} + ${y} = ?`, `Solo cambian las decenas: ${n} + ${m} = ${n + m}.`);
  }
}

// D.1 - D.10
export function addK(r: Rng, k: number): Question {
  const n = r.int(0, k === 0 ? 20 : 10);
  const [x, y] = r.chance(0.5) ? [n, k] : [k, n];
  return num(n + k, `Suma ${k}.`, `${x} + ${y} = ?`, `${n} + ${k} = ${n + k}.`);
}

export { numberOptions };
