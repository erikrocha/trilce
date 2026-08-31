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
import type { PaymentOrigin } from "./actions";
import { PaymentOriginSheet } from "./payment-origin-sheet";

export function PaymentOriginList({
  origins,
  canWrite,
}: {
  origins: PaymentOrigin[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<PaymentOrigin | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nuevo origen de pago
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Requiere referencia</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {origins.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay orígenes de pago configurados.
                </TableCell>
              </TableRow>
            )}
            {origins.map((origin) => (
              <TableRow
                key={origin.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(origin)}
              >
                <TableCell>{origin.name}</TableCell>
                <TableCell>
                  {origin.requires_reference ? "Sí" : "No"}
                </TableCell>
                <TableCell>
                  <Badge variant={origin.active ? "default" : "secondary"}>
                    {origin.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaymentOriginSheet
        origin={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
