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
import type { Database } from "@/lib/supabase/database.types";
import { DocumentTypeSheet } from "./document-type-sheet";

type DocumentSeries = Database["public"]["Tables"]["document_series"]["Row"];
type DocumentType = Database["public"]["Tables"]["document_types"]["Row"] & {
  document_series: DocumentSeries[];
};

export function DocumentTypeList({
  documentTypes,
  canWrite,
}: {
  documentTypes: DocumentType[];
  canWrite: boolean;
}) {
  const [sheetItem, setSheetItem] = useState<DocumentType | "new" | null>(
    null
  );

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {canWrite && (
            <Button size="sm" onClick={() => setSheetItem("new")}>
              <PlusIcon />
              Nuevo tipo de documento
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Series</TableHead>
              <TableHead>Electrónica</TableHead>
              <TableHead>IGV</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentTypes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Todavía no hay tipos de documento configurados.
                </TableCell>
              </TableRow>
            )}
            {documentTypes.map((docType) => (
              <TableRow
                key={docType.id}
                className="cursor-pointer"
                onClick={() => setSheetItem(docType)}
              >
                <TableCell>{docType.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {docType.short_code ?? "—"}
                </TableCell>
                <TableCell>
                  {docType.document_series
                    .map((s) => s.series_code)
                    .join(", ") || "—"}
                </TableCell>
                <TableCell>{docType.is_electronic ? "Sí" : "No"}</TableCell>
                <TableCell>{docType.requires_igv ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <Badge variant={docType.active ? "default" : "secondary"}>
                    {docType.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DocumentTypeSheet
        documentType={sheetItem === "new" ? null : sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => !open && setSheetItem(null)}
        onCreated={(created) =>
          setSheetItem({ ...created, document_series: [] })
        }
        readOnly={!canWrite}
      />
    </>
  );
}
