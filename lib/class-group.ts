import { LEVEL_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";

type EnrollmentLevel = Database["public"]["Enums"]["enrollment_level"];

export type ClassGroupBrief = {
  academic_year: number;
  level: EnrollmentLevel;
  grade: string;
  section: string;
};

export function classGroupLabel(cg: ClassGroupBrief) {
  return `${cg.academic_year} — ${LEVEL_LABELS[cg.level]} ${cg.grade}${cg.section}`;
}
