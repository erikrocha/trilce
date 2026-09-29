"use client";

import { useState } from "react";
import { WEEKDAY_LABELS, LEVEL_SHORT_LABELS } from "@/lib/enum-labels";
import { formatTimeRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ScheduleSlotSheet } from "./schedule-slot-sheet";
import type { ActivityOption, OfferingOption, SchedulePeriod, ScheduleSlotRow } from "./types";

const DAYS = [1, 2, 3, 4, 5];

function courseCellLabel(slot: ScheduleSlotRow, compact: boolean) {
  const offering = slot.course_offerings;
  if (!offering) return null;
  if (!compact) return offering.courses?.name ?? "—";
  const cg = offering.class_groups;
  if (!cg) return offering.courses?.short_code ?? offering.courses?.name ?? "—";
  const sectionPart = cg.section ? `-${cg.section}` : "";
  return `${cg.grade}${sectionPart} ${LEVEL_SHORT_LABELS[cg.level]} ${
    offering.courses?.short_code ?? offering.courses?.name ?? "—"
  }`;
}

export function ScheduleTable({
  periods,
  slots,
  canEdit,
  offerings,
  activities,
}: {
  periods: SchedulePeriod[];
  slots: ScheduleSlotRow[];
  canEdit: boolean;
  offerings: OfferingOption[];
  activities: ActivityOption[];
}) {
  const [sheetState, setSheetState] = useState<
    { slot: ScheduleSlotRow | null; period: SchedulePeriod; day: number } | null
  >(null);

  const distinctClassGroups = new Set(
    slots
      .filter((s) => s.course_offering_id)
      .map((s) => s.course_offerings?.class_group_id)
      .filter(Boolean)
  );
  const compact = distinctClassGroups.size > 1;

  const slotByCell = new Map<string, ScheduleSlotRow>();
  for (const slot of slots) {
    slotByCell.set(`${slot.period_id}:${slot.day_of_week}`, slot);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated">
              <th className="w-40 px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                Hora
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground"
                >
                  {WEEKDAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.length === 0 && (
              <tr>
                <td colSpan={DAYS.length + 1} className="py-8 text-center text-muted-foreground">
                  Todavía no hay un horario base configurado.
                </td>
              </tr>
            )}
            {periods.map((period) => (
              <tr key={period.id} className="border-b border-border last:border-b-0">
                <td className="whitespace-nowrap px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                  {formatTimeRange(period.start_time, period.end_time)}
                </td>
                {period.is_break ? (
                  <td
                    colSpan={DAYS.length}
                    className="bg-badge-pendiente/10 px-3 py-2 text-center text-xs font-medium uppercase text-badge-pendiente"
                  >
                    {period.label ?? "Recreo"}
                  </td>
                ) : (
                  DAYS.map((day) => {
                    const slot = slotByCell.get(`${period.id}:${day}`);
                    const content = slot
                      ? slot.activity_id
                        ? { text: slot.schedule_activities?.name ?? "—", isActivity: true }
                        : { text: courseCellLabel(slot, compact) ?? "—", isActivity: false }
                      : null;
                    return (
                      <td
                        key={day}
                        onClick={() =>
                          canEdit && setSheetState({ slot: slot ?? null, period, day })
                        }
                        className={cn(
                          "px-3 py-2 align-top text-xs",
                          canEdit && "cursor-pointer hover:bg-surface-elevated"
                        )}
                      >
                        {content && (
                          <span
                            className={cn(
                              content.isActivity &&
                                "font-medium uppercase text-muted-foreground"
                            )}
                          >
                            {content.text}
                          </span>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <ScheduleSlotSheet
          open={sheetState !== null}
          slot={sheetState?.slot ?? null}
          period={sheetState?.period ?? null}
          day={sheetState?.day ?? 1}
          offerings={offerings}
          activities={activities}
          onOpenChange={(open) => !open && setSheetState(null)}
        />
      )}
    </>
  );
}
