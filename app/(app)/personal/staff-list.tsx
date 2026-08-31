"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STAFF_TYPE_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import type { StaffMember } from "./actions";
import { StaffSheet } from "./staff-sheet";

type StaffType = Database["public"]["Enums"]["staff_type"];

export function StaffList({
  staff,
  canWrite,
}: {
  staff: StaffMember[];
  canWrite: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState<StaffType | "todos">("todos");
  const [sheetItem, setSheetItem] = useState<StaffMember | "new" | null>(null);

  const filtered = useMemo(
    () =>
      typeFilter === "todos"
        ? staff
        : staff.filter((s) => s.staff_type === typeFilter),
    [staff, typeFilter]
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter((v as StaffType) ?? "todos")}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo el personal</SelectItem>
              {Object.entries(STAFF_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canWrite && (
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => setSheetItem("new")}
            >
              <PlusIcon />
              Nuevo personal
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay personal que coincida.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((member) => (
              <TableRow
                key={member.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(member)}
              >
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{STAFF_TYPE_LABELS[member.staff_type]}</TableCell>
                <TableCell className="font-mono text-xs">
                  {member.document_number ?? "—"}
                </TableCell>
                <TableCell>{member.phone ?? member.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={member.active ? "default" : "secondary"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffSheet
        staffMember={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
