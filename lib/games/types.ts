export type Visual =
  | { kind: "text"; text: string }
  | { kind: "objects"; emoji: string; count: number }
  | { kind: "groups"; emoji: string; a: number; b: number }
  | { kind: "takeaway"; emoji: string; total: number; removed: number }
  | { kind: "numberLine"; min: number; max: number; step: number; labelEvery: number; marked?: number }
  | { kind: "fractionLine"; parts: number; marked: number }
  | { kind: "hundredsChart"; blank: number[]; highlight: number }
  | { kind: "placeValue"; tens: number; ones: number }
  | { kind: "fraction"; shape: "circle" | "bar" | "area"; parts: number; shaded: number }
  | { kind: "fractionGroup"; emoji: string; total: number; highlighted: number }
  | { kind: "measureObjects"; itemEmoji: string; unitEmoji: string; count: number }
  | { kind: "ruler"; length: number }
  | { kind: "thermometer"; value: number; min: number; max: number }
  | { kind: "lengthBars"; a: number; b: number }
  | { kind: "gridObjects"; size: number; cells: { r: number; c: number; emoji: string }[] }
  | { kind: "stack"; items: string[] }
  | { kind: "coordPlane"; max: number; points: { x: number; y: number; emoji: string }[] }
  | { kind: "shapes"; names: string[] }
  | { kind: "solids"; names: string[] }
  | { kind: "pattern"; items: string[] }
  | { kind: "bag"; items: { emoji: string; count: number }[] };

type Base = {
  prompt: string;
  visual?: Visual;
  explanation: string;
  // Sub-tema fino para el análisis de deficiencias (ej. "con-reagrupacion").
  tag?: string;
};

export type Question =
  | (Base & { kind: "choice"; options: string[]; answer: string })
  | (Base & { kind: "number"; answer: number })
  | (Base & { kind: "multi"; options: string[]; answers: string[] })
  | (Base & { kind: "sequence"; tiles: string[]; reuse: boolean; length: number; answer: string[] })
  | (Base & { kind: "shade"; shape: "bar" | "area"; parts: number; answer: number });

export type Skill = {
  id: string;
  section: string;
  title: string;
  icon: string;
  generate: (r: import("./rng").Rng) => Question;
};

export type Section = { id: string; name: string; icon: string };
