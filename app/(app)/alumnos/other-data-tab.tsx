"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type AcademicYear = Database["public"]["Tables"]["academic_years"]["Row"];
type PreviousSchool = Database["public"]["Tables"]["previous_schools"]["Row"];

export function OtherDataTab({ studentId }: { studentId: string }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [previousSchools, setPreviousSchools] = useState<PreviousSchool[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("academic_years")
      .select("*")
      .eq("student_id", studentId)
      .order("year", { ascending: false })
      .then(({ data }) => setAcademicYears(data ?? []));

    supabase
      .from("previous_schools")
      .select("*")
      .eq("student_id", studentId)
      .then(({ data }) => setPreviousSchools(data ?? []));
  }, [studentId]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Historial académico</h3>
        {academicYears.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros.</p>
        ) : (
          academicYears.map((year) => (
            <div key={year.id} className="rounded-lg border border-border p-2.5 text-sm">
              {year.year} — {year.level ?? "—"} {year.grade ?? ""}{" "}
              {year.section ?? ""}
              {year.final_status && (
                <span className="text-muted-foreground"> · {year.final_status}</span>
              )}
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Colegios anteriores</h3>
        {previousSchools.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros.</p>
        ) : (
          previousSchools.map((school) => (
            <div key={school.id} className="rounded-lg border border-border p-2.5 text-sm">
              {school.institution ?? "—"}
              {school.year_start && school.year_end
                ? ` (${school.year_start}–${school.year_end})`
                : ""}
              {school.district && (
                <span className="text-muted-foreground"> · {school.district}</span>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
