import type { Rng } from "../rng";

export const COUNTABLES = ["🍎", "⭐", "🐟", "🚗", "🎈", "🐥", "🌸", "⚽", "🍪", "🦋"];

export function numberOptions(
  r: Rng,
  answer: number,
  min: number,
  max: number,
  count = 4,
  step = 1
) {
  const options = new Set<number>([answer]);
  let guard = 0;
  while (options.size < count && guard++ < 80) {
    const candidate = answer + r.int(-3, 3) * step;
    if (candidate >= min && candidate <= max) options.add(candidate);
  }
  return r.shuffle([...options]).map(String);
}

export function uniqueOptions(r: Rng, answer: string, distractors: string[], count = 4) {
  const set = new Set<string>([answer]);
  for (const d of r.shuffle(distractors)) {
    if (set.size >= count) break;
    set.add(d);
  }
  return r.shuffle([...set]);
}

