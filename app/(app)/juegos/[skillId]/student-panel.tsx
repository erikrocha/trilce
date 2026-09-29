"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Roster } from "./skill-player";

export function StudentPanel({ roster, onPick }: { roster: Roster; onPick: (id: string, name: string) => void }) {
  const [groupId, setGroupId] = useState(roster.groups[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const list = roster.students.filter(
    (s) => s.groupId === groupId && (q === "" || s.name.toLowerCase().includes(q) || s.code.includes(q))
  );

  if (roster.groups.length === 0) {
    return (
      <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">
        No hay alumnos disponibles. Los alumnos deben estar vinculados a una sección.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-6">
      <div>
        <h2 className="text-base font-medium">¿Quién va a jugar?</h2>
        <p className="text-sm text-muted-foreground">Las respuestas se guardarán a nombre del alumno que elijas.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={groupId} onValueChange={(v) => v && setGroupId(v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Sección" />
          </SelectTrigger>
          <SelectContent>
            {roster.groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o código" className="w-64" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
        {list.map((s) => (
          <Button
            key={s.id}
            type="button"
            variant="outline"
            className="h-auto justify-between whitespace-normal py-3 text-left text-base"
            onClick={() => onPick(s.id, s.name)}
          >
            <span>{s.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{s.code}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
