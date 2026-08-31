"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/supabase/database.types";
import { MONTH_LABELS } from "@/lib/enum-labels";
import { savePriceList, type FormState } from "./actions";

type TuitionRow = Database["public"]["Tables"]["tuition_schedule"]["Row"];

export function PriceListForm({
  year,
  rows,
  canWrite,
}: {
  year: number;
  rows: TuitionRow[];
  canWrite: boolean;
}) {
  const matricula = rows.find(
    (r) => r.concept_type === "matricula" && r.month === null
  );
  const pensionByMonth = new Map(
    rows
      .filter((r) => r.concept_type === "pension" && r.month !== null)
      .map((r) => [r.month as number, r])
  );

  const action = savePriceList.bind(null, year);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  // Patrón de React para "ajustar estado cuando cambia una prop", sin efecto:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevPending, setPrevPending] = useState(pending);
  const [justSaved, setJustSaved] = useState(false);
  if (pending !== prevPending) {
    setPrevPending(pending);
    setJustSaved(!pending && !(state && "error" in state));
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-border p-4"
    >
      <div className="flex flex-col gap-1.5 sm:w-56">
        <Label htmlFor="amount_matricula">Matrícula {year}</Label>
        <Input
          id="amount_matricula"
          name="amount_matricula"
          type="number"
          step="0.01"
          min="0"
          placeholder="S/ 0.00"
          defaultValue={matricula?.amount ?? ""}
          disabled={!canWrite}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead>Pensión</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MONTH_LABELS.map((label, index) => {
            const month = index + 1;
            const row = pensionByMonth.get(month);
            return (
              <TableRow key={month}>
                <TableCell>{label}</TableCell>
                <TableCell>
                  <Input
                    name={`amount_month_${month}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="S/ 0.00"
                    className="max-w-40"
                    defaultValue={row?.amount ?? ""}
                    disabled={!canWrite}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {justSaved && (
        <p className="text-sm text-brand-green-text">Cambios guardados.</p>
      )}

      {canWrite && (
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      )}
    </form>
  );
}
