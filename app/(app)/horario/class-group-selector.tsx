"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classGroupLabel } from "@/lib/class-group";
import type { ClassGroupOption } from "../configuracion/asignacion-cursos/course-offering-list";

export function ClassGroupSelector({
  classGroups,
  selectedId,
}: {
  classGroups: ClassGroupOption[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedId ?? ""}
      onValueChange={(value) =>
        router.push(value ? `/horario?classGroupId=${value}` : "/horario")
      }
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Elige una sección" />
      </SelectTrigger>
      <SelectContent>
        {classGroups.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No hay secciones configuradas.
          </div>
        )}
        {classGroups.map((cg) => (
          <SelectItem key={cg.id} value={cg.id}>
            {classGroupLabel(cg)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
