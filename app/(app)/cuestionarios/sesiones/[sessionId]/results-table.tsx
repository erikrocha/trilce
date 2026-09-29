import { CheckIcon, XIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  first_names: string;
  paternal_surname: string;
  code: string;
};
type Question = { id: string; order_index: number };
type Response = {
  student_id: string;
  question_id: string;
  quiz_question_options: { is_correct: boolean } | null;
};

export function ResultsTable({
  students,
  questions,
  responses,
}: {
  students: Student[];
  questions: Question[];
  responses: Response[];
}) {
  const byKey = new Map<string, boolean>();
  for (const r of responses) {
    byKey.set(`${r.student_id}:${r.question_id}`, Boolean(r.quiz_question_options?.is_correct));
  }

  return (
    <div className="rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Código</TableHead>
            {questions.map((q, i) => (
              <TableHead key={q.id} className="text-center">
                P{i + 1}
              </TableHead>
            ))}
            <TableHead className="text-center">Puntaje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={questions.length + 3}
                className="py-8 text-center text-muted-foreground"
              >
                Esta sección no tiene alumnos vinculados todavía.
              </TableCell>
            </TableRow>
          )}
          {students.map((student) => {
            let correctCount = 0;
            const cells = questions.map((q) => {
              const key = `${student.id}:${q.id}`;
              const has = byKey.has(key);
              const correct = byKey.get(key);
              if (correct) correctCount += 1;
              return { key, has, correct };
            });

            return (
              <TableRow key={student.id}>
                <TableCell>
                  {student.paternal_surname} {student.first_names}
                </TableCell>
                <TableCell className="font-mono text-xs">{student.code}</TableCell>
                {cells.map((cell) => (
                  <TableCell key={cell.key} className="text-center">
                    {cell.has ? (
                      cell.correct ? (
                        <CheckIcon className="mx-auto size-4 text-brand-green-text" />
                      ) : (
                        <XIcon className="mx-auto size-4 text-destructive" />
                      )
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "text-center font-medium",
                    questions.length > 0 &&
                      correctCount === questions.length &&
                      "text-brand-green-text"
                  )}
                >
                  {correctCount}/{questions.length}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
