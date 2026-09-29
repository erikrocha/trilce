"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuizSheet } from "./quiz-sheet";
import type { Quiz } from "./actions";

type QuizRow = Quiz & { staff_members: { full_name: string } | null };

export function QuizList({
  quizzes,
  canWrite,
}: {
  quizzes: QuizRow[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<Quiz | "new" | null>(null);
  const router = useRouter();

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nuevo cuestionario
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Creado por</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay cuestionarios.
                </TableCell>
              </TableRow>
            )}
            {quizzes.map((quiz) => (
              <TableRow
                key={quiz.id}
                className="cursor-pointer"
                onClick={() => router.push(`/cuestionarios/${quiz.id}`)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{quiz.title}</span>
                    {quiz.description && (
                      <span className="text-xs text-muted-foreground">
                        {quiz.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{quiz.staff_members?.full_name ?? "—"}</TableCell>
                <TableCell>
                  {canWrite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSheetItem(quiz);
                      }}
                    >
                      <PencilIcon />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <QuizSheet
        quiz={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
      />
    </>
  );
}
