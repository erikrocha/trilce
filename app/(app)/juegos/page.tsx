import Link from "next/link";
import { BarChart3Icon } from "lucide-react";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { SECTIONS, SKILLS } from "@/lib/games/catalog";
import { aggregate, MIN_ATTEMPTS, WEAK_ACCURACY, type SkillStat } from "@/lib/games/stats";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function JuegosPage() {
  const ctx = await requireAppContext();
  const isStudent = ctx.role === "alumno" && ctx.targetId;

  let stats = new Map<string, SkillStat>();
  if (isStudent) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("game_attempts")
      .select("skill_id, tag, is_correct, answered_at")
      .eq("student_id", ctx.targetId!)
      .order("answered_at", { ascending: false })
      .limit(5000);
    stats = aggregate(data ?? []);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">Juegos educativos</h1>
          <p className="text-sm text-muted-foreground">
            Practica paso a paso. Cada juego genera preguntas nuevas hasta que lo domines
            {isStudent ? " y guarda tus resultados para saber qué repasar." : "."}
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/juegos/progreso" />}>
          <BarChart3Icon />
          {isStudent ? "Mi progreso" : "Progreso de alumnos"}
        </Button>
      </div>

      {SECTIONS.map((section) => {
        const skills = SKILLS.filter((s) => s.section === section.id);
        return (
          <section key={section.id} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium uppercase text-muted-foreground">
              {section.icon} {section.id}. {section.name}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => {
                const st = stats.get(skill.id);
                const weak = st && st.total >= MIN_ATTEMPTS && st.accuracy < WEAK_ACCURACY;
                return (
                  <Link
                    key={skill.id}
                    href={`/juegos/${skill.id}`}
                    className="flex items-start justify-between gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{skill.id}</span>
                      <span className="text-sm">{skill.title}</span>
                    </span>
                    {st && (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                          weak ? "bg-destructive/10 text-destructive" : "bg-brand-green/15 text-brand-green-text"
                        )}
                      >
                        {Math.round(st.accuracy * 100)}%
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
