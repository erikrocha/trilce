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
import { formatTimeRange } from "@/lib/time";
import type { SchedulePeriod } from "./actions";
import { SchedulePeriodSheet } from "./schedule-period-sheet";

export function SchedulePeriodList({
  periods,
  canWrite,
}: {
  periods: SchedulePeriod[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<SchedulePeriod | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nueva franja
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay franjas horarias configuradas.
                </TableCell>
              </TableRow>
            )}
            {periods.map((period) => (
              <TableRow
                key={period.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(period)}
              >
                <TableCell className="font-mono text-xs">
                  {formatTimeRange(period.start_time, period.end_time)}
                </TableCell>
                <TableCell>
                  {period.is_break ? (
                    <Badge className="bg-badge-pendiente/15 text-badge-pendiente">
                      {period.label ?? "Recreo"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Clase</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SchedulePeriodSheet
        period={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
