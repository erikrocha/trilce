import Link from "next/link";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { SECTIONS, SKILLS } from "@/lib/games/catalog";
import { aggregate, MIN_ATTEMPTS, skillTitle, WEAK_ACCURACY } from "@/lib/games/stats";
import { cn } from "@/lib/utils";
import { StudentPicker } from "./student-picker";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default async function ProgresoPage(props: PageProps<"/juegos/progreso">) {
  const ctx = await requireAppContext();
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const isStudent = ctx.role === "alumno";

  const { data: visible } = isStudent
    ? { data: [] }
    : await supabase
        .from("students")
        .select("id, code, first_names, paternal_surname")
        .order("paternal_surname", { ascending: true })
        .limit(500);
  const students = (visible ?? []).map((s) => ({ id: s.id, label: `${s.paternal_surname} ${s.first_names} (${s.code})` }));

  const param = Array.isArray(searchParams.studentId) ? searchParams.studentId[0] : searchParams.studentId;
  const studentId = isStudent ? ctx.targetId : students.some((s) => s.id === param) ? param : students.length === 1 ? students[0].id : undefined;
  const studentLabel = students.find((s) => s.id === studentId)?.label;

  const { data: attempts } = studentId
    ? await supabase
        .from("game_attempts")
        .select("skill_id, tag, is_correct, answered_at")
        .eq("student_id", studentId)
        .order("answered_at", { ascending: false })
        .limit(5000)
    : { data: [] };
  const stats = aggregate(attempts ?? []);
  const rows = [...stats.values()];
  const total = rows.reduce((n, r) => n + r.total, 0);
  const correct = rows.reduce((n, r) => n + r.correct, 0);
  const weak = rows.filter((r) => r.total >= MIN_ATTEMPTS && r.accuracy < WEAK_ACCURACY).sort((a, b) => a.accuracy - b.accuracy);

  const { data: mistakes } = studentId
    ? await supabase
        .from("game_attempts")
        .select("id, skill_id, question, given_answer, correct_answer, answered_at")
        .eq("student_id", studentId)
        .eq("is_correct", false)
        .order("answered_at", { ascending: false })
        .limit(10)
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/juegos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Juegos
          </Link>
          <h1 className="text-lg font-medium">{isStudent ? "Mi progreso" : "Progreso de alumnos"}</h1>
          {studentLabel && <p className="text-sm text-muted-foreground">{studentLabel}</p>}
        </div>
        {!isStudent && <StudentPicker students={students} selectedId={studentId ?? undefined} />}
      </div>

      {!studentId ? (
        <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">Elige un alumno para ver su progreso.</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">Todavía no hay respuestas guardadas.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Juegos practicados", String(rows.length)],
              ["Preguntas contestadas", String(total)],
              ["Aciertos", pct(correct / total)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-medium tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium uppercase text-muted-foreground">A repasar</h2>
            {weak.length === 0 ? (
              <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                Ningún juego con menos de {pct(WEAK_ACCURACY)} de aciertos (mínimo {MIN_ATTEMPTS} respuestas).
              </p>
            ) : (
              weak.map((r) => (
                <Link key={r.skillId} href={`/juegos/${r.skillId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4 hover:bg-accent">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      <span className="font-mono text-xs text-muted-foreground">{r.skillId}</span> {skillTitle(r.skillId)}
                    </span>
                    {r.weakTags.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Falla más en: {r.weakTags.slice(0, 3).map((t) => `${t.tag} (${pct(t.accuracy)})`).join(", ")}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-destructive">
                    {pct(r.accuracy)} · {r.correct}/{r.total}
                  </span>
                </Link>
              ))
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase text-muted-foreground">Por tema</h2>
            {SECTIONS.map((section) => {
              const list = SKILLS.filter((s) => s.section === section.id && stats.has(s.id));
              if (list.length === 0) return null;
              return (
                <div key={section.id} className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {section.icon} {section.name}
                  </p>
                  {list.map((s) => {
                    const st = stats.get(s.id)!;
                    const isWeak = st.total >= MIN_ATTEMPTS && st.accuracy < WEAK_ACCURACY;
                    return (
                      <div key={s.id} className="flex items-center gap-3 text-sm">
                        <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{s.id}</span>
                        <span className="min-w-0 flex-1 truncate">{s.title}</span>
                        <div className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full", isWeak ? "bg-destructive" : "bg-brand-green")} style={{ width: pct(st.accuracy) }} />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {pct(st.accuracy)} · {st.correct}/{st.total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {(mistakes ?? []).length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium uppercase text-muted-foreground">Últimos errores</h2>
              {(mistakes ?? []).map((m) => {
                const q = m.question as { prompt?: string; visual?: { kind?: string; text?: string } } | null;
                return (
                  <div key={m.id} className="rounded-2xl border border-border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{m.skill_id}</span> {skillTitle(m.skill_id)}
                    </p>
                    <p>
                      {q?.prompt} {q?.visual?.kind === "text" && <span className="whitespace-pre font-medium">{q.visual.text}</span>}
                    </p>
                    <p className="text-xs">
                      Respondió <span className="text-destructive">{m.given_answer}</span> · correcta{" "}
                      <span className="text-brand-green-text">{m.correct_answer}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
