import type { Rng } from "../rng";
import type { Question } from "../types";
import { COUNTABLES, numberOptions, uniqueOptions } from "./common";

// L.1
export function measureWithObjects(r: Rng): Question {
  const item = r.pick([["🖍️", "lápiz"], ["🥕", "zanahoria"], ["🪥", "cepillo"]]);
  const unit = r.pick([["📎", "clips"], ["🧱", "bloques"], ["🍪", "galletas"]]);
  const count = r.int(2, 9);
  return {
    kind: "number",
    prompt: `¿Cuántos ${unit[1]} mide el ${item[1]}?`,
    visual: { kind: "measureObjects", itemEmoji: item[0], unitEmoji: unit[0], count },
    answer: count,
    explanation: `Contamos los ${unit[1]} de un extremo al otro: ${count}.`,
  };
}

// L.2
export function measureWithRuler(r: Rng): Question {
  const length = r.int(2, 10);
  return {
    kind: "number",
    prompt: "¿Cuántos centímetros mide el objeto?",
    visual: { kind: "ruler", length },
    answer: length,
    explanation: `El objeto empieza en 0 y termina en ${length}: mide ${length} cm.`,
  };
}

// L.3
export function readThermometer(r: Rng): Question {
  const value = r.int(0, 10) * 5;
  return {
    kind: "choice",
    prompt: "¿Qué temperatura marca el termómetro? (°C)",
    visual: { kind: "thermometer", value, min: 0, max: 50 },
    options: numberOptions(r, value, 0, 50, 4, 5),
    answer: String(value),
    explanation: `El líquido llega a ${value} °C.`,
  };
}

// L.4
export function compareLengths(r: Rng): Question {
  const a = r.int(1, 10);
  let b = r.int(1, 10);
  while (b === a) b = r.int(1, 10);
  const longer = r.chance(0.5);
  const answer = (longer ? a > b : a < b) ? "A" : "B";
  return {
    kind: "choice",
    prompt: `¿Cuál es más ${longer ? "largo" : "corto"}?`,
    visual: { kind: "lengthBars", a, b },
    options: ["A", "B"],
    answer,
    explanation: `${answer} es más ${longer ? "largo" : "corto"}.`,
    tag: longer ? "mas-largo" : "mas-corto",
  };
}

// L.5
export function gridPosition(r: Rng): Question {
  const size = 4;
  const emojis = r.shuffle(COUNTABLES).slice(0, 4);
  const used = new Set<string>();
  const cells = emojis.map((emoji) => {
    for (;;) {
      const rr = r.int(1, size);
      const cc = r.int(1, size);
      const key = `${rr}-${cc}`;
      if (!used.has(key)) {
        used.add(key);
        return { r: rr, c: cc, emoji };
      }
    }
  });
  const target = r.pick(cells);
  return {
    kind: "choice",
    prompt: `¿Qué hay en la fila ${target.r}, columna ${target.c}?`,
    visual: { kind: "gridObjects", size, cells },
    options: emojis,
    answer: target.emoji,
    explanation: `Bajamos hasta la fila ${target.r} y avanzamos a la columna ${target.c}: ${target.emoji}.`,
  };
}

// L.6
export function aboveBelow(r: Rng): Question {
  const items = r.shuffle(COUNTABLES).slice(0, 5);
  const stack = items.slice(0, 4);
  const extra = items[4];
  const above = r.chance(0.5);
  const idx = above ? r.int(1, 3) : r.int(0, 2);
  const ref = stack[idx];
  const answer = above ? stack[idx - 1] : stack[idx + 1];
  return {
    kind: "choice",
    prompt: `¿Qué está ${above ? "encima" : "debajo"} de ${ref}?`,
    visual: { kind: "stack", items: stack },
    options: uniqueOptions(r, answer, [...stack.filter((s) => s !== answer && s !== ref), extra]),
    answer,
    explanation: `${above ? "Encima" : "Debajo"} de ${ref} está ${answer}.`,
    tag: above ? "encima" : "debajo",
  };
}

const TIME_FACTS: { q: string; a: string; wrong: string[] }[] = [
  { q: "¿Cuántos días hay en una semana?", a: "7", wrong: ["5", "6", "10", "12"] },
  { q: "¿Cuántas horas hay en un día?", a: "24", wrong: ["12", "60", "30", "7"] },
  { q: "¿Cuántos meses hay en un año?", a: "12", wrong: ["10", "7", "24", "52"] },
  { q: "¿Cuántos minutos hay en una hora?", a: "60", wrong: ["30", "100", "24", "12"] },
  { q: "¿Cuántas semanas hay en un año? (aprox.)", a: "52", wrong: ["12", "30", "7", "365"] },
  { q: "¿Qué dura más?", a: "1 día", wrong: ["1 hora", "1 minuto"] },
  { q: "¿Qué dura más?", a: "1 semana", wrong: ["1 día", "1 hora"] },
  { q: "¿Qué dura más?", a: "1 año", wrong: ["1 mes", "1 semana"] },
  { q: "¿Qué dura menos?", a: "1 minuto", wrong: ["1 hora", "1 día"] },
  { q: "¿Qué dura menos?", a: "1 hora", wrong: ["1 día", "1 semana"] },
  { q: "¿Cuántos minutos tiene media hora?", a: "30", wrong: ["15", "60", "45", "20"] },
];

// L.7
export function timeUnits(r: Rng): Question {
  const f = r.pick(TIME_FACTS);
  return {
    kind: "choice",
    prompt: f.q,
    options: uniqueOptions(r, f.a, f.wrong),
    answer: f.a,
    explanation: `La respuesta correcta es ${f.a}.`,
  };
}

// L.8
export function coordinatePlane(r: Rng): Question {
  const max = 5;
  const emojis = r.shuffle(COUNTABLES).slice(0, 3);
  const used = new Set<string>();
  const points = emojis.map((emoji) => {
    for (;;) {
      const x = r.int(1, max);
      const y = r.int(1, max);
      const key = `${x},${y}`;
      if (!used.has(key)) {
        used.add(key);
        return { x, y, emoji };
      }
    }
  });
  const t = r.pick(points);
  const answer = `(${t.x}, ${t.y})`;
  const swapped = `(${t.y}, ${t.x})`;
  return {
    kind: "choice",
    prompt: `¿Cuáles son las coordenadas de ${t.emoji}? (primero → horizontal, luego ↑ vertical)`,
    visual: { kind: "coordPlane", max, points },
    options: uniqueOptions(r, answer, [swapped, `(${Math.min(max, t.x + 1)}, ${t.y})`, `(${t.x}, ${Math.max(0, t.y - 1)})`, `(${Math.max(0, t.x - 1)}, ${t.y})`].filter((d) => d !== answer)),
    answer,
    explanation: `Avanzamos ${t.x} a la derecha y ${t.y} hacia arriba: ${answer}.`,
  };
}
