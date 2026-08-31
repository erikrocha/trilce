"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/supabase/database.types";
import { LEVEL_LABELS, STUDENT_STATUS_LABELS } from "./labels";
import { StudentSheet } from "./student-sheet";

type Student = Database["public"]["Tables"]["students"]["Row"];

const STATUS_BADGE_VARIANT: Record<string, "default" | "outline" | "secondary"> = {
  activo: "default",
  retirado: "secondary",
  egresado: "outline",
};

export function StudentList({
  students,
  canWrite,
}: {
  students: Student[];
  canWrite: boolean;
}) {
  const [sheetStudent, setSheetStudent] = useState<Student | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetStudent("new")}>
              <PlusIcon />
              Nuevo alumno
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Alumno</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Sección</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay alumnos registrados.
                </TableCell>
              </TableRow>
            )}
            {students.map((student) => (
              <TableRow
                key={student.id}
                className="cursor-pointer"
                onClick={() => setSheetStudent(student)}
              >
                <TableCell className="font-mono text-xs">
                  {student.code}
                </TableCell>
                <TableCell>
                  {student.paternal_surname} {student.maternal_surname ?? ""}
                  , {student.first_names}
                </TableCell>
                <TableCell>
                  {student.level ? LEVEL_LABELS[student.level] : "—"}
                </TableCell>
                <TableCell>{student.grade ?? "—"}</TableCell>
                <TableCell>{student.section ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE_VARIANT[student.status]}>
                    {STUDENT_STATUS_LABELS[student.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StudentSheet
        student={sheetStudent === "new" ? null : sheetStudent}
        open={sheetStudent !== null}
        onOpenChange={(open) => !open && setSheetStudent(null)}
        onCreated={(created) => setSheetStudent(created)}
        readOnly={!canWrite}
      />
    </>
  );
}
