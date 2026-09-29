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
import type { Course } from "./actions";
import { CourseSheet } from "./course-sheet";

export function CourseList({
  courses,
  canWrite,
}: {
  courses: Course[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<Course | "new" | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nuevo curso
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay cursos configurados.
                </TableCell>
              </TableRow>
            )}
            {courses.map((course) => (
              <TableRow
                key={course.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(course)}
              >
                <TableCell>{course.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {course.short_code ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={course.active ? "default" : "secondary"}>
                    {course.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CourseSheet
        course={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
