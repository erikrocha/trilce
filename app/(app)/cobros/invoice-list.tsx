"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
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
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { CONCEPT_TYPE_LABELS, INVOICE_STATUS_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import { InvoiceSheet } from "./invoice-sheet";

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  students: {
    code: string;
    paternal_surname: string;
    maternal_surname: string | null;
    first_names: string;
  } | null;
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function studentName(invoice: Invoice) {
  const s = invoice.students;
  if (!s) return "—";
  return `${s.paternal_surname} ${s.maternal_surname ?? ""}, ${s.first_names}`;
}

export function InvoiceList({
  invoices,
  canWrite,
}: {
  invoices: Invoice[];
  canWrite: boolean;
}) {
  const [status, setStatus] = useState<InvoiceStatus | "todos">("todos");
  const [query, setQuery] = useState("");
  const [sheetInvoice, setSheetInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (status !== "todos" && invoice.status !== status) return false;
      if (!q) return true;
      return (
        studentName(invoice).toLowerCase().includes(q) ||
        invoice.students?.code.toLowerCase().includes(q) ||
        invoice.description.toLowerCase().includes(q)
      );
    });
  }, [invoices, status, query]);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Input
            placeholder="Buscar alumno o código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-64"
          />
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as InvoiceStatus | "todos")}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} de {invoices.length}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Pagado</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay boletas que coincidan.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer"
                onClick={() => setSheetInvoice(invoice)}
              >
                <TableCell>{studentName(invoice)}</TableCell>
                <TableCell>
                  {CONCEPT_TYPE_LABELS[invoice.concept_type]}
                  {invoice.month && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({invoice.description})
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(invoice.due_date).toLocaleDateString("es-PE")}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {currencyFormatter.format(invoice.amount)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {currencyFormatter.format(invoice.paid_amount)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {currencyFormatter.format(invoice.balance ?? 0)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InvoiceSheet
        invoice={sheetInvoice}
        open={sheetInvoice !== null}
        onOpenChange={(open) => !open && setSheetInvoice(null)}
        readOnly={!canWrite}
      />
    </>
  );
}
