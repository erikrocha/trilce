import { SKILLS } from "./catalog";

export type AttemptRow = { skill_id: string; tag: string | null; is_correct: boolean; answered_at: string };

export type SkillStat = {
  skillId: string;
  total: number;
  correct: number;
  accuracy: number;
  lastAt: string;
  weakTags: { tag: string; total: number; accuracy: number }[];
};

export const WEAK_ACCURACY = 0.7;
export const MIN_ATTEMPTS = 3;

export function aggregate(rows: AttemptRow[]): Map<string, SkillStat> {
  const bySkill = new Map<string, AttemptRow[]>();
  for (const r of rows) {
    const list = bySkill.get(r.skill_id) ?? [];
    list.push(r);
    bySkill.set(r.skill_id, list);
  }
  const out = new Map<string, SkillStat>();
  for (const [skillId, list] of bySkill) {
    const correct = list.filter((r) => r.is_correct).length;
    const tags = new Map<string, { total: number; correct: number }>();
    for (const r of list) {
      if (!r.tag) continue;
      const t = tags.get(r.tag) ?? { total: 0, correct: 0 };
      t.total += 1;
      if (r.is_correct) t.correct += 1;
      tags.set(r.tag, t);
    }
    out.set(skillId, {
      skillId,
      total: list.length,
      correct,
      accuracy: correct / list.length,
      lastAt: list.reduce((m, r) => (r.answered_at > m ? r.answered_at : m), list[0].answered_at),
      weakTags: [...tags.entries()]
        .map(([tag, t]) => ({ tag, total: t.total, accuracy: t.correct / t.total }))
        .filter((t) => t.total >= 2 && t.accuracy < WEAK_ACCURACY)
        .sort((a, b) => a.accuracy - b.accuracy),
    });
  }
  return out;
}

export function skillTitle(id: string) {
  return SKILLS.find((s) => s.id === id)?.title ?? id;
}
