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
import type { Guardian } from "./actions";
import { GuardianSheet } from "./guardian-sheet";

export function GuardianList({
  guardians,
  canWrite,
}: {
  guardians: Guardian[];
  canWrite: boolean;
}) {
  const [sheetGuardian, setSheetGuardian] = useState<Guardian | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetGuardian("new")}>
              <PlusIcon />
              Nuevo apoderado
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apoderado</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guardians.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay apoderados registrados.
                </TableCell>
              </TableRow>
            )}
            {guardians.map((guardian) => (
              <TableRow
                key={guardian.id}
                className="cursor-pointer"
                onClick={() => setSheetGuardian(guardian)}
              >
                <TableCell>
                  {guardian.paternal_surname ?? ""}{" "}
                  {guardian.maternal_surname ?? ""}, {guardian.first_names}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {guardian.document_number ?? "—"}
                </TableCell>
                <TableCell>{guardian.mobile ?? guardian.phone ?? "—"}</TableCell>
                <TableCell>{guardian.email ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <GuardianSheet
        guardian={sheetGuardian === "new" ? null : sheetGuardian}
        open={sheetGuardian !== null}
        onOpenChange={(open) => !open && setSheetGuardian(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
