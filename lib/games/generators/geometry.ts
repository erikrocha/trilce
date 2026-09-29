import type { Rng } from "../rng";
import type { Question } from "../types";
import { uniqueOptions } from "./common";

export const SHAPES_2D: { name: string; sides: number }[] = [
  { name: "círculo", sides: 0 },
  { name: "triángulo", sides: 3 },
  { name: "cuadrado", sides: 4 },
  { name: "rectángulo", sides: 4 },
  { name: "pentágono", sides: 5 },
  { name: "hexágono", sides: 6 },
];

const SOLIDS: { name: string; faces: number; edges: number; vertices: number }[] = [
  { name: "cubo", faces: 6, edges: 12, vertices: 8 },
  { name: "prisma rectangular", faces: 6, edges: 12, vertices: 8 },
  { name: "pirámide cuadrada", faces: 5, edges: 8, vertices: 5 },
  { name: "pirámide triangular", faces: 4, edges: 6, vertices: 4 },
  { name: "prisma triangular", faces: 5, edges: 9, vertices: 6 },
];

export const SOLID_NAMES_DRAWN = ["cubo", "prisma rectangular", "cilindro", "cono", "esfera", "pirámide cuadrada"];

// M.1
export function compareSidesVertices(r: Rng): Question {
  const polys = SHAPES_2D.filter((s) => s.sides >= 3);
  const mode = r.int(0, 2);
  if (mode === 0) {
    const s = r.pick(polys);
    const what = r.pick(["lados", "vértices"]);
    return {
      kind: "number",
      prompt: `¿Cuántos ${what} tiene la figura?`,
      visual: { kind: "shapes", names: [s.name] },
      answer: s.sides,
      explanation: `Un ${s.name} tiene ${s.sides} lados y ${s.sides} vértices.`,
      tag: what,
    };
  }
  const distinct = r.shuffle(polys.filter((s, i, arr) => arr.findIndex((o) => o.sides === s.sides) === i)).slice(0, 2);
  const [x, y] = distinct;
  const more = mode === 1;
  const what = r.pick(["lados", "vértices"]);
  const winner = (more ? x.sides > y.sides : x.sides < y.sides) ? "A" : "B";
  return {
    kind: "choice",
    prompt: `¿Qué figura tiene ${more ? "más" : "menos"} ${what}?`,
    visual: { kind: "shapes", names: [x.name, y.name] },
    options: ["A", "B"],
    answer: winner,
    explanation: `El ${x.name} tiene ${x.sides} y el ${y.name} tiene ${y.sides}.`,
    tag: what,
  };
}

// M.2
export function identifyShape2d(r: Rng): Question {
  const s = r.pick(SHAPES_2D);
  return {
    kind: "choice",
    prompt: "¿Cómo se llama esta figura?",
    visual: { kind: "shapes", names: [s.name] },
    options: uniqueOptions(r, s.name, SHAPES_2D.map((x) => x.name)),
    answer: s.name,
    explanation: `Es un ${s.name}.`,
    tag: s.name,
  };
}

// M.3
export function compareSolidParts(r: Rng): Question {
  const what = r.pick(["faces", "edges", "vertices"] as const);
  const wordPlural = { faces: "caras", edges: "aristas", vertices: "vértices" }[what];
  if (r.chance(0.5)) {
    const s = r.pick(SOLIDS);
    return {
      kind: "number",
      prompt: `¿Cuántas ${wordPlural} tiene un ${s.name}?`.replace("Cuántas vértices", "Cuántos vértices"),
      visual: { kind: "solids", names: [s.name] },
      answer: s[what],
      explanation: `Un ${s.name} tiene ${s.faces} caras, ${s.edges} aristas y ${s.vertices} vértices.`,
      tag: wordPlural,
    };
  }
  const pair = r.shuffle(SOLIDS).slice(0, 2);
  const [x, y] = pair;
  if (x[what] === y[what]) return compareSolidParts(r);
  const more = r.chance(0.5);
  const win = (more ? x[what] > y[what] : x[what] < y[what]) ? "A" : "B";
  return {
    kind: "choice",
    prompt: `¿Qué cuerpo tiene ${more ? "más" : "menos"} ${wordPlural}?`,
    visual: { kind: "solids", names: [x.name, y.name] },
    options: ["A", "B"],
    answer: win,
    explanation: `El ${x.name} tiene ${x[what]} y el ${y.name} tiene ${y[what]}.`,
    tag: wordPlural,
  };
}

// M.4
export function identifySolid(r: Rng): Question {
  const name = r.pick(SOLID_NAMES_DRAWN);
  return {
    kind: "choice",
    prompt: "¿Cómo se llama este cuerpo?",
    visual: { kind: "solids", names: [name] },
    options: uniqueOptions(r, name, SOLID_NAMES_DRAWN),
    answer: name,
    explanation: `Es un ${name}.`,
    tag: name,
  };
}

const EVERYDAY: { emoji: string; solid: string; label: string }[] = [
  { emoji: "🎲", solid: "cubo", label: "un dado" },
  { emoji: "🧊", solid: "cubo", label: "un cubo de hielo" },
  { emoji: "⚽", solid: "esfera", label: "una pelota" },
  { emoji: "🏀", solid: "esfera", label: "un balón" },
  { emoji: "🥫", solid: "cilindro", label: "una lata" },
  { emoji: "🍦", solid: "cono", label: "un cono de helado" },
  { emoji: "📦", solid: "prisma rectangular", label: "una caja" },
];

// M.5
export function everydayObjects(r: Rng): Question {
  const o = r.pick(EVERYDAY);
  return {
    kind: "choice",
    prompt: "¿Qué figura tiene este objeto?",
    visual: { kind: "text", text: o.emoji },
    options: uniqueOptions(r, o.solid, SOLID_NAMES_DRAWN),
    answer: o.solid,
    explanation: `${o.label[0].toUpperCase()}${o.label.slice(1)} tiene forma de ${o.solid}.`,
    tag: o.solid,
  };
}

const TRACED: { solid: string; face: string; avoid: string[] }[] = [
  { solid: "cubo", face: "cuadrado", avoid: ["rectángulo"] },
  { solid: "cilindro", face: "círculo", avoid: [] },
  { solid: "cono", face: "círculo", avoid: [] },
  { solid: "prisma rectangular", face: "rectángulo", avoid: ["cuadrado"] },
  { solid: "pirámide triangular", face: "triángulo", avoid: [] },
  { solid: "pirámide cuadrada", face: "cuadrado", avoid: ["rectángulo"] },
];

// M.6
export function tracedShapes(r: Rng): Question {
  const t = r.pick(TRACED);
  const pool = SHAPES_2D.map((s) => s.name).filter((n) => n !== t.face && !t.avoid.includes(n));
  return {
    kind: "choice",
    prompt: `Apoyas una cara plana de este cuerpo y la trazas. ¿Qué figura puedes dibujar?`,
    visual: { kind: "solids", names: [t.solid] },
    options: uniqueOptions(r, t.face, pool),
    answer: t.face,
    explanation: `Una cara plana del ${t.solid} es un ${t.face}.`,
    tag: t.solid,
  };
}

const FACES: Record<string, string> = {
  cubo: "Solo cuadrados",
  "prisma rectangular": "Solo rectángulos",
  "pirámide triangular": "Solo triángulos",
  "pirámide cuadrada": "Un cuadrado y triángulos",
  cilindro: "Círculos y una superficie curva",
  cono: "Un círculo y una superficie curva",
};

// M.7
export function solidFaces(r: Rng): Question {
  const solid = r.pick(Object.keys(FACES));
  return {
    kind: "choice",
    prompt: `¿Qué figuras forman las caras de este cuerpo?`,
    visual: { kind: "solids", names: [solid] },
    options: uniqueOptions(r, FACES[solid], Object.values(FACES)),
    answer: FACES[solid],
    explanation: `Las caras del ${solid}: ${FACES[solid].toLowerCase()}.`,
    tag: solid,
  };
}
