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
import type { ScheduleActivity } from "./actions";
import { ScheduleActivitySheet } from "./schedule-activity-sheet";

export function ScheduleActivityList({
  activities,
  canWrite,
}: {
  activities: ScheduleActivity[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<ScheduleActivity | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nueva actividad
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay actividades configuradas.
                </TableCell>
              </TableRow>
            )}
            {activities.map((activity) => (
              <TableRow
                key={activity.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(activity)}
              >
                <TableCell>{activity.name}</TableCell>
                <TableCell>
                  <Badge variant={activity.active ? "default" : "secondary"}>
                    {activity.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ScheduleActivitySheet
        activity={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
