"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classGroupLabel, type ClassGroupBrief } from "@/lib/class-group";

type ClassGroupOption = { id: string } & ClassGroupBrief;

export function GroupPicker({
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
        router.push(
          value ? `/cuestionarios/tarjetas?classGroupId=${value}` : "/cuestionarios/tarjetas"
        )
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
