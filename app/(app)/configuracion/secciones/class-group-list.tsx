"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEVEL_LABELS } from "@/lib/enum-labels";
import type { ClassGroup } from "./actions";
import { ClassGroupSheet } from "./class-group-sheet";

export function ClassGroupList({
  classGroups,
  canWrite,
}: {
  classGroups: ClassGroup[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<ClassGroup | "new" | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nueva sección
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Año</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Sección</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classGroups.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay secciones configuradas.
                </TableCell>
              </TableRow>
            )}
            {classGroups.map((cg) => (
              <TableRow
                key={cg.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(cg)}
              >
                <TableCell className="font-mono text-xs">
                  {cg.academic_year}
                </TableCell>
                <TableCell>{LEVEL_LABELS[cg.level]}</TableCell>
                <TableCell>{cg.grade}</TableCell>
                <TableCell>{cg.section}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ClassGroupSheet
        classGroup={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
