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
import { classGroupLabel, type ClassGroupBrief } from "@/lib/class-group";
import type { CourseOffering } from "./actions";
import { CourseOfferingSheet } from "./course-offering-sheet";

export type ClassGroupOption = { id: string } & ClassGroupBrief;
export type SimpleOption = { id: string; name: string };
export type TeacherOption = { id: string; full_name: string };

type OfferingRow = CourseOffering & {
  courses: { name: string } | null;
  class_groups: ClassGroupBrief | null;
  staff_members: { full_name: string } | null;
};

export { classGroupLabel };

export function CourseOfferingList({
  offerings,
  courses,
  classGroups,
  teachers,
  canWrite,
}: {
  offerings: OfferingRow[];
  courses: SimpleOption[];
  classGroups: ClassGroupOption[];
  teachers: TeacherOption[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<OfferingRow | "new" | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nueva asignación
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Docente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offerings.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay cursos asignados.
                </TableCell>
              </TableRow>
            )}
            {offerings.map((offering) => (
              <TableRow
                key={offering.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(offering)}
              >
                <TableCell>{offering.courses?.name ?? "—"}</TableCell>
                <TableCell>
                  {offering.class_groups
                    ? classGroupLabel(offering.class_groups)
                    : "—"}
                </TableCell>
                <TableCell>{offering.staff_members?.full_name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CourseOfferingSheet
        offering={sheetItem === "new" ? null : sheetItem}
        courses={courses}
        classGroups={classGroups}
        teachers={teachers}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
