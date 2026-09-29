"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function StudentPicker({
  students,
  selectedId,
}: {
  students: { id: string; label: string }[];
  selectedId?: string;
}) {
  const router = useRouter();
  return (
    <Select value={selectedId ?? ""} onValueChange={(v) => router.push(v ? `/juegos/progreso?studentId=${v}` : "/juegos/progreso")}>
      <SelectTrigger className="w-72">
        <SelectValue placeholder="Elige un alumno" />
      </SelectTrigger>
      <SelectContent>
        {students.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay alumnos disponibles.</div>}
        {students.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
